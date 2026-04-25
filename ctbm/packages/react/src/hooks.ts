import { useCTBM } from './context.js'
import type { Zone, ClassificationResult } from '@ctbm/core'
import { classify } from '@ctbm/core'
import { useCallback } from 'react'

// ──────────────────────────────────────────────────────────────────────────────
// useZone
//
// Returns the current conversation zone. Re-renders whenever the zone changes.
// ──────────────────────────────────────────────────────────────────────────────

export function useZone(): Zone {
  return useCTBM().zone
}

// ──────────────────────────────────────────────────────────────────────────────
// useCTBMClassify
//
// Returns a stable `classifyAndSend` function the caller uses on message send.
// Also returns the full ClassificationResult for callers that need signal data.
// ──────────────────────────────────────────────────────────────────────────────

export interface UseCTBMClassifyReturn {
  /**
   * Call this with the user's message text on send.
   * Updates the shared zone via CTBMProvider and returns the full result.
   */
  classifyAndSend: (message: string) => Promise<ClassificationResult>
  isClassifying: boolean
  zone: Zone
}

export function useCTBMClassify(): UseCTBMClassifyReturn {
  const { config, history, isClassifying, zone, classifyMessage } = useCTBM()

  const classifyAndSend = useCallback(
    async (message: string): Promise<ClassificationResult> => {
      // Run classify for the full result (signals, scores, reasoning)
      const result = await classify(message, history, config)
      // Update shared context zone + history (may re-classify internally)
      await classifyMessage(message, 'user')
      return result
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, config, classifyMessage],
  )

  return { classifyAndSend, isClassifying, zone }
}
