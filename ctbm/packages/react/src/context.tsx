import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { classify, type CTBMConfig, type Zone, type Message } from '@ctbm/core'

// ──────────────────────────────────────────────────────────────────────────────
// Context shape
// ──────────────────────────────────────────────────────────────────────────────

export interface CTBMContextValue {
  /** Active classification zone for the current conversation. */
  zone: Zone
  /** Whether a classification is in progress. */
  isClassifying: boolean
  /** The full conversation history (with zone annotations). */
  history: Message[]
  /** SDK configuration. */
  config: CTBMConfig
  /**
   * Classify a new message and update zone + history.
   * Returns the zone so callers can react immediately.
   */
  classifyMessage: (content: string, role?: Message['role']) => Promise<Zone>
  /** Manually reset the conversation zone. */
  resetZone: () => void
}

// ──────────────────────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────────────────────

const CTBMContext = createContext<CTBMContextValue | null>(null)
CTBMContext.displayName = 'CTBMContext'

// ──────────────────────────────────────────────────────────────────────────────
// CTBMProvider
// ──────────────────────────────────────────────────────────────────────────────

export interface CTBMProviderProps {
  config: CTBMConfig
  /** Initial zone for the conversation. Defaults to 'neutral'. */
  initialZone?: Zone
  children: ReactNode
}

export function CTBMProvider({
  config,
  initialZone = 'neutral',
  children,
}: CTBMProviderProps): React.ReactElement {
  const [zone, setZone] = useState<Zone>(initialZone)
  const [isClassifying, setIsClassifying] = useState(false)
  const [history, setHistory] = useState<Message[]>([])

  const classifyMessage = useCallback(
    async (content: string, role: Message['role'] = 'user'): Promise<Zone> => {
      setIsClassifying(true)
      try {
        const result = await classify(content, history, config)
        const classified: Message = { role, content, zone: result.zone }

        setHistory((prev) => [...prev, classified])
        setZone(result.zone)
        return result.zone
      } finally {
        setIsClassifying(false)
      }
    },
    [history, config],
  )

  const resetZone = useCallback(() => {
    setZone(initialZone)
  }, [initialZone])

  const value: CTBMContextValue = {
    zone,
    isClassifying,
    history,
    config,
    classifyMessage,
    resetZone,
  }

  return (
    <CTBMContext.Provider value={value}>
      {children}
    </CTBMContext.Provider>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// useCTBM — access raw context (internal use)
// ──────────────────────────────────────────────────────────────────────────────

export function useCTBM(): CTBMContextValue {
  const ctx = useContext(CTBMContext)
  if (!ctx) {
    throw new Error(
      'useCTBM must be used within a <CTBMProvider>. ' +
        'Wrap your app (or the relevant component tree) in <CTBMProvider config={...}>.',
    )
  }
  return ctx
}
