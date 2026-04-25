import type { ClassificationResult, CTBMConfig, Zone } from './types.js'

// ──────────────────────────────────────────────────────────────────────────────
// Violation detection patterns
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Patterns that should never appear in a response delivered under the
 * protected zone. If any of these are detected, a violation is raised.
 */
const COMMERCE_LEAK_PATTERNS = [
  /\bbuy\b/i,
  /\bpurchase\b/i,
  /\bshop\b/i,
  /\bstore\b/i,
  /\bproduct\b/i,
  /\baffiliate\b/i,
  /\bsponsored\b/i,
  /\bdiscount\b/i,
  /\bpromo(?:tion|code)?\b/i,
  /\bcoupon\b/i,
  /\bdeal\b/i,
  /\boffer\b/i,
  /\bprice\b/i,
  /\bcost\b/i,
  /\bcheap(?:er|est)?\b/i,
  /\bhttps?:\/\//i,
  /\bclick here\b/i,
  /\bcheck it out\b/i,
  /\bget it (?:now|here|today)\b/i,
  /\bamazon\.com\b/i,
  /\bflipkart\b/i,
  /\bmeesho\b/i,
]

function detectCommerceLeakInResponse(responseText: string): boolean {
  return COMMERCE_LEAK_PATTERNS.some((pattern) => pattern.test(responseText))
}

// ──────────────────────────────────────────────────────────────────────────────
// CTBMRouter
// ──────────────────────────────────────────────────────────────────────────────

export interface RouterHandlers<T> {
  onProtected: () => Promise<T> | T
  onNeutral: () => Promise<T> | T
  onCommerce: () => Promise<T> | T
}

export class CTBMRouter {
  /**
   * Dispatches to the appropriate handler based on the classification zone
   * and enforces that protected-zone responses never contain commerce content.
   *
   * @param zone            - The zone returned by `classify()`.
   * @param handlers        - Zone-specific response generators.
   * @param classificationResult - The full result (used in violation reporting).
   * @param config          - SDK config (for `onViolation` callback).
   */
  static async route<T>(
    zone: Zone,
    handlers: RouterHandlers<T>,
    classificationResult?: ClassificationResult,
    config?: CTBMConfig,
  ): Promise<T> {
    switch (zone) {
      case 'protected': {
        const result = await handlers.onProtected()

        // Safety wrapper: scan string responses for commerce leaks
        if (typeof result === 'string' && detectCommerceLeakInResponse(result)) {
          if (classificationResult && config?.onViolation) {
            config.onViolation(classificationResult)
          }
          // We still return the result — the onViolation callback decides action
        }

        return result
      }

      case 'neutral':
        return handlers.onNeutral()

      case 'commerce':
        return handlers.onCommerce()
    }
  }

  /**
   * Standalone method to check if a string response would constitute a
   * commerce violation in a protected context. Useful for custom pipelines.
   */
  static containsCommerceContent(responseText: string): boolean {
    return detectCommerceLeakInResponse(responseText)
  }
}
