import type {
  LayerARecord,
  LayerBRecord,
  StorageAdapter,
} from './adapter.js'

// ──────────────────────────────────────────────────────────────────────────────
// MemoryStorageAdapter
//
// In-process, Map-based implementation of StorageAdapter.
// Ideal for tests, demos, and development. Data is lost on restart.
// ──────────────────────────────────────────────────────────────────────────────

export class MemoryStorageAdapter implements StorageAdapter {
  /** Layer A: emotional / protected content. Map key = userId. */
  private readonly layerA = new Map<string, LayerARecord[]>()

  /** Layer B: behavioural signals. Map key = userId. */
  private readonly layerB = new Map<string, LayerBRecord[]>()

  async storeLayerA(
    userId: string,
    content: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const records = this.layerA.get(userId) ?? []
    records.push({ userId, content, metadata, storedAt: new Date() })
    this.layerA.set(userId, records)
  }

  async storeLayerB(
    userId: string,
    signal: string,
    type: string,
  ): Promise<void> {
    const records = this.layerB.get(userId) ?? []
    records.push({ userId, signal, type, storedAt: new Date() })
    this.layerB.set(userId, records)
  }

  async getLayerA(userId: string, limit = 20): Promise<LayerARecord[]> {
    const records = this.layerA.get(userId) ?? []
    // Return most recent `limit` records
    return records.slice(-limit)
  }

  async getLayerB(userId: string, limit = 20): Promise<LayerBRecord[]> {
    const records = this.layerB.get(userId) ?? []
    return records.slice(-limit)
  }

  /**
   * Clears all stored data. Useful between tests.
   */
  clear(): void {
    this.layerA.clear()
    this.layerB.clear()
  }

  /**
   * Returns raw record counts for a given user. Useful for assertions in tests.
   */
  debugCounts(userId: string): {
    layerACount: number
    layerBCount: number
  } {
    return {
      layerACount: (this.layerA.get(userId) ?? []).length,
      layerBCount: (this.layerB.get(userId) ?? []).length,
    }
  }
}
