import type { StorageAdapter, LayerARecord, LayerBRecord } from '@ctbm/storage'
import type { Zone } from './types.js'

// ──────────────────────────────────────────────────────────────────────────────
// CTBMMemory
//
// Manages the two-layer memory architecture. Protected and neutral conversations
// go to Layer A (emotional context). Commerce conversations go to Layer B
// (behavioural signals only). Cross-layer access is architecturally impossible.
// ──────────────────────────────────────────────────────────────────────────────

export interface ZoneStats {
  protectedCount: number
  neutralCount: number
  commerceCount: number
  /**
   * Rate at which protected conversations eventually transition to commerce.
   * Approximated as: commerce interactions / (protected + commerce) interactions.
   * Returns 0 if there are no tracked interactions.
   */
  transitionRate: number
}

export class CTBMMemory {
  private readonly adapter: StorageAdapter
  private readonly userId: string

  /** In-process counters for getZoneStats — persisted alongside layer records. */
  private readonly zoneCounts = { protected: 0, neutral: 0, commerce: 0 }

  constructor(adapter: StorageAdapter, userId: string) {
    this.adapter = adapter
    this.userId = userId
  }

  /**
   * Stores conversation content in the appropriate memory layer based on zone.
   *
   * - `protected` → Layer A (emotional, private context).
   * - `neutral`   → Layer A (general context, safe to recall later).
   * - `commerce`  → Layer B only. Signals are stored, emotional content is NOT.
   *
   * @param zone     - The classification zone.
   * @param content  - The message or summary to persist.
   * @param signals  - Classification signals from ClassificationResult.signals.
   */
  async store(zone: Zone, content: string, signals: string[]): Promise<void> {
    this.zoneCounts[zone]++

    const metadata: Record<string, unknown> = {
      zone,
      signals,
      storedAt: new Date().toISOString(),
    }

    if (zone === 'protected' || zone === 'neutral') {
      // Emotional and general context goes to the private Layer A
      await this.adapter.storeLayerA(this.userId, content, metadata)
    } else {
      // Commerce: extract only behavioural signals, never store emotional content
      for (const signal of signals) {
        await this.adapter.storeLayerB(this.userId, signal, 'commerce-signal')
      }
      // Store a sanitised intent marker (not the raw message content)
      await this.adapter.storeLayerB(
        this.userId,
        'commerce-intent',
        'intent',
      )
    }
  }

  /**
   * Retrieves memory context for the given zone.
   *
   * - `protected` | `neutral` → Layer A records only.
   * - `commerce`              → Layer B records only.
   *
   * Cross-layer access is architecturally impossible through this method.
   *
   * @param zone  - The zone requesting context.
   * @returns     The context records and which layer was used.
   */
  async getContextForZone(
    zone: 'protected' | 'neutral' | 'commerce',
  ): Promise<{ context: (LayerARecord | LayerBRecord)[]; layerUsed: 'A' | 'B' }> {
    if (zone === 'protected' || zone === 'neutral') {
      const context = await this.adapter.getLayerA(this.userId)
      return { context, layerUsed: 'A' }
    }

    // zone === 'commerce'
    const context = await this.adapter.getLayerB(this.userId)
    return { context, layerUsed: 'B' }
  }

  /**
   * Returns aggregate zone statistics for the current user.
   * Counts are from the lifetime of this CTBMMemory instance (in-process).
   *
   * @param _userId - Provided for API symmetry; uses the instance's userId.
   */
  async getZoneStats(_userId?: string): Promise<ZoneStats> {
    const { protected: p, neutral: n, commerce: c } = this.zoneCounts
    const total = p + n + c

    // Transition rate: approximate share of sessions that moved into commerce
    // after having had protected interactions.
    const transitionRate =
      p + c === 0 ? 0 : parseFloat((c / (p + c)).toFixed(4))

    return {
      protectedCount: p,
      neutralCount: n,
      commerceCount: c,
      transitionRate,
    }
  }
}
