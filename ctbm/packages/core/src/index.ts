// ─── Types ─────────────────────────────────────────────────────────────────
export type { Zone, ClassificationResult, CTBMConfig, Message } from './types.js'

// ─── Classifier ────────────────────────────────────────────────────────────
export { classify } from './classifier.js'
export type { LLMClientOverride } from './classifier.js'

// ─── Router ────────────────────────────────────────────────────────────────
export { CTBMRouter } from './router.js'
export type { RouterHandlers } from './router.js'

// ─── Memory ────────────────────────────────────────────────────────────────
export { CTBMMemory } from './memory.js'
export type { ZoneStats } from './memory.js'

// ─── Storage (re-exported for convenience) ─────────────────────────────────
export type { StorageAdapter, LayerARecord, LayerBRecord } from '@ctbm/storage'
export { MemoryStorageAdapter } from '@ctbm/storage'
