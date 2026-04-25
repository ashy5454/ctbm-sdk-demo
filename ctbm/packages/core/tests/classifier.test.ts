import { describe, it, expect, vi, beforeEach } from 'vitest'
import { classify, CTBMRouter } from '../src/index.js'
import type {
  CTBMConfig,
  Message,
  LLMClientOverride,
  ClassificationResult,
} from '../src/index.js'

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Minimal valid config. No real API calls — always overridden by mockLLM. */
const baseConfig: CTBMConfig = {
  provider: 'openai',
  apiKey: 'test-key-not-used',
  thresholds: {
    protected: 0.35,
    neutral: 0.55,
    commerce: 0.75,
  },
}

/** Factory for a mock LLM that returns fixed scores. */
function mockLLM(scores: {
  protected: number
  neutral: number
  commerce: number
  reasoning?: string
}): LLMClientOverride {
  return {
    complete: vi.fn().mockResolvedValue({
      protected: scores.protected,
      neutral: scores.neutral,
      commerce: scores.commerce,
      reasoning: scores.reasoning ?? 'Mocked reasoning.',
    }),
  }
}

/** Build a history array of messages all in the same zone. */
function makeHistory(zone: Message['zone'], count: number): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    role: 'user' as const,
    content: `Message ${i + 1}`,
    zone,
  }))
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('CTBMClassifier — 4-layer pipeline', () => {
  // ────────────────────────────────────────────────────────────────────────────
  // Edge case 1: "I'm stressed about which laptop to buy"
  // Even though it has commerce signal (laptop, buy), the emotional primary
  // signal "stressed" should push it to PROTECTED.
  // ────────────────────────────────────────────────────────────────────────────
  it('EC-1: "stressed" primary signal → PROTECTED (not COMMERCE)', async () => {
    // LLM returns a commerce-leaning result; Layer 2 affect + keyword should override
    const llm = mockLLM({ protected: 0.35, neutral: 0.25, commerce: 0.40 })

    const result = await classify(
      "I'm stressed about which laptop to buy",
      [],
      baseConfig,
      llm,
    )

    expect(result.zone).toBe('protected')
    // Either affect bias or keyword guard should be credited
    const triggeredByAffect =
      result.decisionLayer === 'affect' ||
      result.decisionLayer === 'keyword' ||
      result.signals.some((s) => s.startsWith('affect:'))
    expect(triggeredByAffect).toBe(true)
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Edge case 2: "My mom and I were talking about getting a new phone"
  // Relational context, no distress signal → NEUTRAL
  // ────────────────────────────────────────────────────────────────────────────
  it('EC-2: relational context, no distress → NEUTRAL', async () => {
    const llm = mockLLM({ protected: 0.15, neutral: 0.70, commerce: 0.15 })

    const result = await classify(
      'My mom and I were talking about getting a new phone',
      [],
      baseConfig,
      llm,
    )

    expect(result.zone).toBe('neutral')
    expect(result.scores.neutral).toBeGreaterThan(result.scores.protected)
    expect(result.scores.neutral).toBeGreaterThan(result.scores.commerce)
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Edge case 3: "I feel like I need a fresh start, maybe redecorate"
  // Emotional undertone ("feel like") → PROTECTED even with possible commerce
  // ────────────────────────────────────────────────────────────────────────────
  it('EC-3: emotional undertone "feel like" → PROTECTED', async () => {
    // LLM leans neutral-commerce; affect scoring of "feel" should boost protected
    const llm = mockLLM({ protected: 0.25, neutral: 0.45, commerce: 0.30 })

    const result = await classify(
      'I feel like I need a fresh start, maybe redecorate',
      [],
      baseConfig,
      llm,
    )

    // With affect bias boosting protected by 0.35 the final score should win
    expect(result.zone).toBe('protected')
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Edge case 4: Clear purchase intent → COMMERCE
  // ────────────────────────────────────────────────────────────────────────────
  it('EC-4: clear purchase intent → COMMERCE', async () => {
    // LLM confidently returns commerce; no affect signals
    const llm = mockLLM({ protected: 0.05, neutral: 0.10, commerce: 0.85 })

    const result = await classify(
      'What are the best noise-canceling headphones under ₹15000',
      [],
      baseConfig,
      llm,
    )

    expect(result.zone).toBe('commerce')
    expect(result.scores.commerce).toBeGreaterThan(0.75)
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Edge case 5: Mood help → PROTECTED even with commerce potential
  // ────────────────────────────────────────────────────────────────────────────
  it('EC-5: "feeling really down" → PROTECTED even with commerce potential', async () => {
    // LLM might see commerce (supplements, mood products); layer 2 should override
    const llm = mockLLM({ protected: 0.40, neutral: 0.30, commerce: 0.30 })

    const result = await classify(
      "I've been feeling really down lately, what helps with mood?",
      [],
      baseConfig,
      llm,
    )

    expect(result.zone).toBe('protected')
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Edge case 6: Trajectory bias — 3 protected messages → headphone query
  // should NOT immediately flip to COMMERCE; trajectory should push to NEUTRAL
  // ────────────────────────────────────────────────────────────────────────────
  it('EC-6: trajectory bias after 3 protected messages suppresses COMMERCE', async () => {
    const history = makeHistory('protected', 3)

    // LLM returns a mild commerce signal (below threshold without bias)
    const llm = mockLLM({ protected: 0.15, neutral: 0.25, commerce: 0.60 })

    const result = await classify(
      'what headphones should I buy',
      history,
      baseConfig,
      llm,
    )

    // With 0.25 trajectory bias on protected and -0.125 on commerce,
    // combined commerce drops below 0.75 threshold → should NOT be commerce
    expect(result.zone).not.toBe('commerce')
    expect(result.signals.some((s) => s.startsWith('trajectory:'))).toBe(true)
    expect(result.decisionLayer).toBe('trajectory')
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Layer 1: Keyword guard fires synchronously, no LLM call made
  // ────────────────────────────────────────────────────────────────────────────
  it('Layer 1: keyword guard short-circuits; LLM client is never called', async () => {
    const llmClient = mockLLM({ protected: 0.1, neutral: 0.1, commerce: 0.8 })

    const result = await classify(
      'I feel so hopeless and worthless',
      [],
      baseConfig,
      llmClient,
    )

    expect(result.zone).toBe('protected')
    expect(result.decisionLayer).toBe('keyword')
    expect(result.confidence).toBeCloseTo(0.99)
    // LLM should NOT have been called
    expect(llmClient.complete).not.toHaveBeenCalled()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // Extended protected keywords (config.extendProtectedKeywords)
  // ────────────────────────────────────────────────────────────────────────────
  it('Custom extendProtectedKeywords fires keyword guard', async () => {
    const llmClient = mockLLM({ protected: 0.1, neutral: 0.5, commerce: 0.4 })

    const config: CTBMConfig = {
      ...baseConfig,
      extendProtectedKeywords: ['malpractice', 'wrongful termination'],
    }

    const result = await classify(
      'I think I have a malpractice case against my doctor',
      [],
      config,
      llmClient,
    )

    expect(result.zone).toBe('protected')
    expect(result.decisionLayer).toBe('keyword')
    expect(llmClient.complete).not.toHaveBeenCalled()
  })
  // ────────────────────────────────────────────────────────────────────────────
  // Hardening tests (Edge Cases & Fallbacks)
  // ────────────────────────────────────────────────────────────────────────────
  it('Empty message → neutral immediately', async () => {
    const result = await classify('   ', [], baseConfig)
    expect(result.zone).toBe('neutral')
    expect(result.confidence).toBe(1.0)
    expect(result.signals).toContain('empty-message')
  })

  it('Message > 2000 chars → truncates and classifies', async () => {
    const longMessage = 'A'.repeat(2500)
    const llmClient = mockLLM({ protected: 0.1, neutral: 0.8, commerce: 0.1 })
    const result = await classify(longMessage, [], baseConfig, llmClient)
    
    expect(result.truncated).toBe(true)
    expect(llmClient.complete).toHaveBeenCalled()
    // The second argument is the message, check if it was truncated
    expect((llmClient.complete as any).mock.calls[0][1].length).toBe(2000)
  })

  it('LLM Timeout → falls back to protected (default)', async () => {
    const timeoutMock: LLMClientOverride = {
      complete: vi.fn().mockRejectedValue(new Error('LLM_TIMEOUT')),
    }
    const result = await classify('test', [], baseConfig, timeoutMock)
    expect(result.zone).toBe('protected')
    expect(result.reasoning).toContain('timeout')
  })

  it('LLM Timeout → uses configured timeoutFallbackZone', async () => {
    const timeoutMock: LLMClientOverride = {
      complete: vi.fn().mockRejectedValue(new Error('LLM_TIMEOUT')),
    }
    const customConfig: CTBMConfig = { ...baseConfig, timeoutFallbackZone: 'neutral' }
    const result = await classify('test', [], customConfig, timeoutMock)
    expect(result.zone).toBe('neutral')
  })

  it('Rate limit (429) exhaustion → silent fallback to neutral', async () => {
    const rateLimitMock: LLMClientOverride = {
      complete: vi.fn().mockRejectedValue(new Error('RATE_LIMIT_ERROR')),
    }
    const result = await classify('test', [], baseConfig, rateLimitMock)
    expect(result.zone).toBe('neutral')
    expect(result.reasoning).toContain('Rate limit exhausted')
  })

  it('Malformed/Failed LLM response → graceful fallback to Layer 1 & 2', async () => {
    const failMock: LLMClientOverride = {
      complete: vi.fn().mockRejectedValue(new Error('SyntaxError: unexpected token')),
    }
    const result = await classify('I feel terrible', [], baseConfig, failMock)
    // Even though LLM failed, the affect score of "terrible" will boost protected
    expect(result.zone).toBe('protected')
    expect(result.reasoning).toContain('failed')
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// CTBMRouter — violation detection
// ──────────────────────────────────────────────────────────────────────────────

describe('CTBMRouter — violation detection', () => {
  it('calls onViolation when protected response contains commerce content', async () => {
    const violationSpy = vi.fn()

    const config: CTBMConfig = {
      ...baseConfig,
      onViolation: violationSpy,
    }

    // Simulate a partial ClassificationResult for violation reporting
    const fakeResult: ClassificationResult = {
      zone: 'protected',
      confidence: 0.95,
      scores: { protected: 0.95, neutral: 0.03, commerce: 0.02 },
      signals: [],
      reasoning: 'User is in distress.',
      decisionLayer: 'keyword',
      processingMs: 5,
    }

    const leakyResponse =
      'I understand you feel down. You should buy this mood supplement — great deal!'

    await CTBMRouter.route(
      'protected',
      {
        onProtected: () => Promise.resolve(leakyResponse),
        onNeutral: () => Promise.resolve('neutral response'),
        onCommerce: () => Promise.resolve('commerce response'),
      },
      fakeResult,
      config,
    )

    expect(violationSpy).toHaveBeenCalledOnce()
    expect(violationSpy).toHaveBeenCalledWith(fakeResult)
  })

  it('does NOT call onViolation when protected response is clean', async () => {
    const violationSpy = vi.fn()

    const config: CTBMConfig = {
      ...baseConfig,
      onViolation: violationSpy,
    }

    const fakeResult: ClassificationResult = {
      zone: 'protected',
      confidence: 0.9,
      scores: { protected: 0.9, neutral: 0.07, commerce: 0.03 },
      signals: [],
      reasoning: 'Distress detected.',
      decisionLayer: 'keyword',
      processingMs: 3,
    }

    await CTBMRouter.route(
      'protected',
      {
        onProtected: () => Promise.resolve("I'm here to listen. That sounds really hard."),
        onNeutral: () => Promise.resolve('neutral'),
        onCommerce: () => Promise.resolve('commerce'),
      },
      fakeResult,
      config,
    )

    expect(violationSpy).not.toHaveBeenCalled()
  })

  it('routes commerce zone to onCommerce handler', async () => {
    const result = await CTBMRouter.route('commerce', {
      onProtected: () => 'protected',
      onNeutral: () => 'neutral',
      onCommerce: () => 'commerce-response',
    })

    expect(result).toBe('commerce-response')
  })
})
