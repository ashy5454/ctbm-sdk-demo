// ─── Context & Provider ────────────────────────────────────────────────────
export { CTBMProvider, useCTBM } from './context.js'
export type { CTBMProviderProps, CTBMContextValue } from './context.js'

// ─── Hooks ─────────────────────────────────────────────────────────────────
export { useZone, useCTBMClassify } from './hooks.js'
export type { UseCTBMClassifyReturn } from './hooks.js'

// ─── Components ────────────────────────────────────────────────────────────
export { ZoneBadge } from './components/ZoneBadge.js'
export type { ZoneBadgeProps } from './components/ZoneBadge.js'

export { CCIPrompt } from './components/CCIPrompt.js'
export type { CCIPromptProps } from './components/CCIPrompt.js'

export { ProtectedBanner } from './components/ProtectedBanner.js'
export type { ProtectedBannerProps } from './components/ProtectedBanner.js'
