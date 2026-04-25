// ──────────────────────────────────────────────────────────────────────────────
// StorageAdapter — the interface all storage backends must implement
//
// Design note: There is intentionally NO method to retrieve Layer A data in a
// commerce context. Cross-layer access is architecturally impossible, not just
// guarded at runtime. Implement this interface to add your own backend
// (PostgreSQL, Redis, DynamoDB, etc.).
// ──────────────────────────────────────────────────────────────────────────────

export interface LayerARecord {
  userId: string
  content: string
  metadata: Record<string, unknown>
  storedAt: Date
}

export interface LayerBRecord {
  userId: string
  signal: string
  type: string
  storedAt: Date
}

/**
 * Storage adapter for CTBM's two-layer memory architecture.
 *
 * - **Layer A** stores emotional / protected context (personal content, feelings).
 *   It is ONLY accessible from protected or neutral zone queries.
 *
 * - **Layer B** stores behavioural signals (intent, topic, category).
 *   It is accessible from commerce zone queries for personalisation.
 *
 * There is NO `getLayerAForCommerce` — this separation is by design.
 */
export interface StorageAdapter {
  /**
   * Persist a message or summary to Layer A (emotional/protected layer).
   * @param userId   - The end-user identifier.
   * @param content  - Raw or summarised content.
   * @param metadata - Arbitrary key-value metadata (zone, signals, etc.).
   */
  storeLayerA(
    userId: string,
    content: string,
    metadata: Record<string, unknown>,
  ): Promise<void>

  /**
   * Persist a behavioural signal to Layer B (commerce/neutral layer).
   * @param userId  - The end-user identifier.
   * @param signal  - The signal string (e.g. a topic or category).
   * @param type    - Signal type (e.g. "topic", "intent", "category").
   */
  storeLayerB(userId: string, signal: string, type: string): Promise<void>

  /**
   * Retrieve Layer A records for a user.
   * Use this ONLY in protected or neutral context handlers.
   * @param userId - The end-user identifier.
   * @param limit  - Maximum number of records to return (default: 20).
   */
  getLayerA(userId: string, limit?: number): Promise<LayerARecord[]>

  /**
   * Retrieve Layer B records for a user.
   * Safe to use in commerce context — contains no emotional data.
   * @param userId - The end-user identifier.
   * @param limit  - Maximum number of records to return (default: 20).
   */
  getLayerB(userId: string, limit?: number): Promise<LayerBRecord[]>
}
