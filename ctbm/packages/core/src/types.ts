// ─────────────────────────────────────────────
// Zone — the three ethical monetization states
// ─────────────────────────────────────────────

/** The three possible classification zones. */
export type Zone = 'protected' | 'neutral' | 'commerce'

// ─────────────────────────────────────────────
// Classification result
// ─────────────────────────────────────────────

/**
 * Full output from the 4-layer classification pipeline.
 * Consumers should treat `zone` as the primary decision field.
 * All scores, signals, and reasoning are for transparency/logging.
 */
export interface ClassificationResult {
  /** The final zone decision after all layers and thresholds. */
  zone: Zone

  /** Confidence in the winning zone — 0 (none) to 1 (certain). */
  confidence: number

  /** Normalised probability mass for each zone (sums to 1.0). */
  scores: {
    protected: number
    neutral: number
    commerce: number
  }

  /**
   * Human-readable signals that influenced the classification.
   * E.g. "keyword:crisis", "affect:high-negative", "trajectory:2/3-protected"
   */
  signals: string[]

  /** One-sentence reasoning from the LLM layer (or "N/A" if skipped). */
  reasoning: string

  /** Which layer made (or dominated) the final decision. */
  decisionLayer: 'keyword' | 'affect' | 'llm' | 'trajectory'

  /** Wall-clock time for the full classify() call in milliseconds. */
  processingMs: number

  /** True if the original message was truncated to 2000 characters. */
  truncated?: boolean
}

// ─────────────────────────────────────────────
// SDK configuration
// ─────────────────────────────────────────────

export interface CTBMConfig {
  /** LLM provider to use for Layer 3 classification. */
  provider: 'anthropic' | 'openai' | 'gemini'

  /** API key for the chosen provider. */
  apiKey: string

  /**
   * Model identifier.
   * Defaults: Anthropic → "claude-3-5-haiku-20241022", OpenAI → "gpt-4o-mini", Gemini → "gemini-2.5-flash"
   */
  model?: string

  /**
   * Asymmetric zone decision thresholds.
   * A zone wins only if its normalised score exceeds its threshold.
   * Protected wins ties.
   */
  thresholds?: {
    /** Score required for a message to be labelled protected. Default: 0.35 */
    protected?: number
    /** Score required for neutral. Default: 0.55 */
    neutral?: number
    /** Score required for commerce. Default: 0.75 */
    commerce?: number
  }

  /**
   * Additional keywords that, if matched, immediately classify as protected.
   * Useful for domain-specific terms (e.g. medical, legal, financial crisis).
   */
  extendProtectedKeywords?: string[]

  /**
   * Additional keywords that boost commerce scoring in Layer 1.
   * Note: these do NOT short-circuit to commerce — they only raise the signal.
   */
  extendCommerceKeywords?: string[]

  /**
   * Called when CTBMRouter detects a commerce pattern inside a protected-zone
   * response. Use this to log, alert, or abort.
   */
  onViolation?: (result: ClassificationResult) => void

  /**
   * If the LLM takes longer than 8 seconds, cancel the request and fall back
   * to this zone. Defaults to 'protected'.
   */
  timeoutFallbackZone?: Zone
}

// ─────────────────────────────────────────────
// Conversation message
// ─────────────────────────────────────────────

export interface Message {
  role: 'user' | 'assistant'
  content: string
  /** Zone previously assigned to this message, if any. Used for trajectory analysis. */
  zone?: Zone
}
