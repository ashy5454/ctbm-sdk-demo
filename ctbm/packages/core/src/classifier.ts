import type { ClassificationResult, CTBMConfig, Message, Zone } from './types.js'
import protectedKeywords from './data/protected-keywords.json' assert { type: 'json' }
import afinnLexicon from './data/afinn-lexicon.json' assert { type: 'json' }

// ──────────────────────────────────────────────────────────────────────────────
// Internal types
// ──────────────────────────────────────────────────────────────────────────────

interface LLMScores {
  protected: number
  neutral: number
  commerce: number
  reasoning: string
}

/** Escape-hatch for testing — inject a fake LLM client instead of making real API calls. */
export interface LLMClientOverride {
  complete(systemPrompt: string, userMessage: string): Promise<LLMScores>
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS = {
  protected: 0.35,
  neutral: 0.55,
  commerce: 0.75,
} as const

const ANTHROPIC_DEFAULT_MODEL = 'claude-3-5-haiku-20241022'
const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini'
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-flash'

const AFINN = afinnLexicon as unknown as Record<string, number>

// ──────────────────────────────────────────────────────────────────────────────
// Layer 1 — Keyword Guard (synchronous, O(n))
// ──────────────────────────────────────────────────────────────────────────────

function runLayer1(
  message: string,
  config: CTBMConfig,
): ClassificationResult | null {
  const lower = message.toLowerCase()

  const allProtectedKeywords = [
    ...(protectedKeywords as string[]),
    ...(config.extendProtectedKeywords ?? []),
  ]

  for (const keyword of allProtectedKeywords) {
    if (lower.includes(keyword.toLowerCase())) {
      return {
        zone: 'protected',
        confidence: 0.99,
        scores: { protected: 0.99, neutral: 0.005, commerce: 0.005 },
        signals: [`keyword:${keyword}`],
        reasoning: 'Hard-coded keyword guard matched a protected term.',
        decisionLayer: 'keyword',
        processingMs: 0, // filled in by caller
      }
    }
  }
  return null
}

// ──────────────────────────────────────────────────────────────────────────────
// Layer 2 — Affect Scoring (synchronous, bundled AFINN lexicon)
// ──────────────────────────────────────────────────────────────────────────────

interface AffectResult {
  /** Negative valence ratio: 0 (neutral) → 1 (very negative) */
  negativeValence: number
  /** Protected score bias to add. 0 unless valence > 0.6 */
  protectedBias: number
  signals: string[]
}

function runLayer2(message: string): AffectResult {
  const words = message.toLowerCase().match(/\b\w+\b/g) ?? []
  let negativeSum = 0
  let positiveSum = 0
  const signals: string[] = []

  for (const word of words) {
    const score = AFINN[word]
    if (score !== undefined) {
      if (score < 0) {
        negativeSum += Math.abs(score)
        if (score <= -2) signals.push(`affect:neg-word:${word}`)
      } else {
        positiveSum += score
      }
    }
  }

  const total = negativeSum + positiveSum
  const negativeValence = total === 0 ? 0 : negativeSum / total

  const protectedBias = negativeValence > 0.6 ? 0.35 : 0

  if (negativeValence > 0.6) {
    signals.push(`affect:high-negative-valence:${negativeValence.toFixed(2)}`)
  }

  return { negativeValence, protectedBias, signals }
}

// ──────────────────────────────────────────────────────────────────────────────
// Layer 3 — LLM Classification
// ──────────────────────────────────────────────────────────────────────────────

async function fetchLLM(url: string, options: RequestInit): Promise<Response> {
  const delays = [2000, 4000]
  let attempt = 0

  while (true) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)

      if (response.status === 429 && attempt < delays.length) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
        attempt++
        continue
      }
      
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_ERROR')
      }

      return response
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new Error('LLM_TIMEOUT')
      }
      throw err
    }
  }
}

const SYSTEM_PROMPT = `You are a conversation zone classifier. Classify the user message into three zones and return ONLY valid JSON.

Zone definitions:
- protected: emotional distress, mental health, personal crisis, grief, trauma, or vulnerable states
- neutral: general information, questions, advice, everyday conversation with no strong purchase intent
- commerce: clear product purchase intent, "best X to buy", comparison shopping, price queries, review seeking

Respond ONLY with this JSON structure (scores must sum to 1.0):
{
  "protected": <float 0-1>,
  "neutral": <float 0-1>,
  "commerce": <float 0-1>,
  "reasoning": "<one sentence>"
}

Be CONSERVATIVE about commerce. If there is ANY emotional signal, increase protected. Protected wins ambiguity.`

async function callAnthropic(
  apiKey: string,
  model: string,
  message: string,
): Promise<LLMScores> {
  const response = await fetchLLM('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>
  }
  const text = data.content.find((c) => c.type === 'text')?.text ?? '{}'
  return parseScores(text)
}

async function callOpenAI(
  apiKey: string,
  model: string,
  message: string,
): Promise<LLMScores> {
  const response = await fetchLLM('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 256,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  const text = data.choices[0]?.message?.content ?? '{}'
  return parseScores(text)
}

async function callGemini(
  apiKey: string,
  model: string,
  message: string,
): Promise<LLMScores> {
  const response = await fetchLLM(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  return parseScores(text)
}

function parseScores(raw: string): LLMScores {
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```(?:json)?/g, '').trim()
    const parsed = JSON.parse(cleaned) as Partial<LLMScores>
    const p = Number(parsed.protected)
    const n = Number(parsed.neutral)
    const c = Number(parsed.commerce)
    
    if (isNaN(p) || isNaN(n) || isNaN(c)) {
      throw new Error('Missing or invalid scores in JSON')
    }
    
    const total = p + n + c
    return {
      protected: total > 0 ? p / total : 0.33,
      neutral: total > 0 ? n / total : 0.34,
      commerce: total > 0 ? c / total : 0.33,
      reasoning: String(parsed.reasoning ?? 'No reasoning provided.'),
    }
  } catch (err) {
    console.warn('[CTBM] Malformed LLM response:', raw)
    // Fallback to Layer 1 + 2 only (neutral base)
    return {
      protected: 0.33,
      neutral: 0.34,
      commerce: 0.33,
      reasoning: 'LLM response malformed; falling back to Layer 1 & 2 only.',
    }
  }
}

async function runLayer3(
  message: string,
  config: CTBMConfig,
  llmOverride?: LLMClientOverride,
): Promise<LLMScores> {
  const model =
    config.model ??
    (config.provider === 'anthropic'
      ? ANTHROPIC_DEFAULT_MODEL
      : config.provider === 'openai'
        ? OPENAI_DEFAULT_MODEL
        : GEMINI_DEFAULT_MODEL)

  try {
    if (llmOverride) {
      return await llmOverride.complete(SYSTEM_PROMPT, message)
    }
    if (config.provider === 'anthropic') {
      return await callAnthropic(config.apiKey, model, message)
    }
    if (config.provider === 'gemini') {
      return await callGemini(config.apiKey, model, message)
    }
    return await callOpenAI(config.apiKey, model, message)
  } catch (error: any) {
    if (error.message === 'LLM_TIMEOUT') {
      const fallback = config.timeoutFallbackZone ?? 'protected'
      console.warn(`[CTBM] LLM Timeout. Falling back to ${fallback}.`)
      return {
        protected: fallback === 'protected' ? 0.9 : 0.05,
        neutral: fallback === 'neutral' ? 0.9 : 0.05,
        commerce: fallback === 'commerce' ? 0.9 : 0.05,
        reasoning: `LLM timeout (8s). Fallback to ${fallback} applied.`,
      }
    }
    if (error.message === 'RATE_LIMIT_ERROR') {
      console.warn('[CTBM] LLM Rate Limit exceeded after 3 attempts. Falling back to neutral.')
      return {
        protected: 0.05,
        neutral: 0.9,
        commerce: 0.05,
        reasoning: 'Rate limit exhausted. Silent fallback to neutral applied.',
      }
    }
    console.warn('[CTBM] LLM Request Failed:', error.message)
    return {
      protected: 0.33,
      neutral: 0.34,
      commerce: 0.33,
      reasoning: 'LLM request failed; falling back to Layer 1 & 2 only.',
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Layer 4 — Trajectory Bias
// ──────────────────────────────────────────────────────────────────────────────

interface TrajectoryResult {
  protectedBias: number
  signals: string[]
}

function runLayer4(history: Message[]): TrajectoryResult {
  const recent = history.slice(-3)
  const protectedCount = recent.filter((m) => m.zone === 'protected').length
  const signals: string[] = []

  if (protectedCount >= 2) {
    signals.push(
      `trajectory:${protectedCount}/3-recent-messages-were-protected`,
    )
    return { protectedBias: 0.25, signals }
  }

  return { protectedBias: 0, signals }
}

// ──────────────────────────────────────────────────────────────────────────────
// Score normalisation & threshold application
// ──────────────────────────────────────────────────────────────────────────────

function normalise(scores: {
  protected: number
  neutral: number
  commerce: number
}): { protected: number; neutral: number; commerce: number } {
  const total = scores.protected + scores.neutral + scores.commerce
  if (total === 0) return { protected: 0.33, neutral: 0.34, commerce: 0.33 }
  return {
    protected: scores.protected / total,
    neutral: scores.neutral / total,
    commerce: scores.commerce / total,
  }
}

function applyThresholds(
  scores: { protected: number; neutral: number; commerce: number },
  thresholds: { protected: number; neutral: number; commerce: number },
): Zone {
  // Commerce requires highest confidence bar
  if (scores.commerce >= thresholds.commerce) return 'commerce'
  // Protected wins ties — checked before neutral
  if (scores.protected >= thresholds.protected) return 'protected'
  if (scores.neutral >= thresholds.neutral) return 'neutral'
  // Default: protected (safe fallback)
  return 'protected'
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Classifies a message through the 4-layer pipeline.
 *
 * Layer 1 (keyword guard) is synchronous and may short-circuit.
 * Layers 2–4 run in parallel where possible.
 * Layer 4 (trajectory) applies bias after Layer 3 returns.
 *
 * @param message - The message text to classify.
 * @param history - Previous conversation messages (with zone fields for trajectory).
 * @param config  - SDK configuration.
 * @param _llmOverride - Optional LLM client for testing (bypasses real API calls).
 */
export async function classify(
  message: string,
  history: Message[],
  config: CTBMConfig,
  _llmOverride?: LLMClientOverride,
): Promise<ClassificationResult> {
  const startMs = performance.now()

  if (message.trim().length === 0) {
    return {
      zone: 'neutral',
      confidence: 1.0,
      scores: { protected: 0, neutral: 1, commerce: 0 },
      signals: ['empty-message'],
      reasoning: 'Message was empty.',
      decisionLayer: 'keyword',
      processingMs: performance.now() - startMs,
    }
  }

  let truncated = false
  if (message.length > 2000) {
    message = message.substring(0, 2000)
    truncated = true
  }

  // ── Layer 1: Keyword Guard ──────────────────────────────────────────────────
  const layer1Result = runLayer1(message, config)
  if (layer1Result !== null) {
    layer1Result.processingMs = performance.now() - startMs
    if (truncated) layer1Result.truncated = true
    return layer1Result
  }

  // ── Layer 2: Affect Score (sync, runs immediately) ─────────────────────────
  const affect = runLayer2(message)

  // ── Layer 3: LLM Classification (async) ───────────────────────────────────
  const llmScores = await runLayer3(message, config, _llmOverride)

  // ── Layer 4: Trajectory Bias ───────────────────────────────────────────────
  const trajectory = runLayer4(history)

  // ── Combine: apply affect bias + trajectory bias ───────────────────────────
  const combined = {
    protected:
      llmScores.protected + affect.protectedBias + trajectory.protectedBias,
    neutral: llmScores.neutral,
    commerce: Math.max(
      0,
      llmScores.commerce - affect.protectedBias * 0.5 - trajectory.protectedBias * 0.5,
    ),
  }

  const normalised = normalise(combined)

  // ── Resolve thresholds ────────────────────────────────────────────────────
  const effectiveThresholds = {
    protected:
      config.thresholds?.protected ?? DEFAULT_THRESHOLDS.protected,
    neutral: config.thresholds?.neutral ?? DEFAULT_THRESHOLDS.neutral,
    commerce: config.thresholds?.commerce ?? DEFAULT_THRESHOLDS.commerce,
  }

  const zone = applyThresholds(normalised, effectiveThresholds)
  const confidence = normalised[zone]

  // ── Determine dominant decision layer ─────────────────────────────────────
  let decisionLayer: ClassificationResult['decisionLayer'] = 'llm'
  if (trajectory.signals.length > 0 && zone !== 'commerce') {
    decisionLayer = 'trajectory'
  } else if (affect.protectedBias > 0 && zone === 'protected') {
    decisionLayer = 'affect'
  }

  // ── Collect all signals ───────────────────────────────────────────────────
  const signals: string[] = [
    ...affect.signals,
    ...trajectory.signals,
    `llm:provider=${config.provider}`,
  ]

  if (config.extendCommerceKeywords?.length) {
    const lower = message.toLowerCase()
    for (const kw of config.extendCommerceKeywords) {
      if (lower.includes(kw.toLowerCase())) {
        signals.push(`commerce-keyword:${kw}`)
      }
    }
  }

  return {
    zone,
    confidence,
    scores: normalised,
    signals,
    reasoning: llmScores.reasoning,
    decisionLayer,
    processingMs: performance.now() - startMs,
    ...(truncated ? { truncated: true } : {}),
  }
}
