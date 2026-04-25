import React, { useState, useEffect } from 'react'

// ──────────────────────────────────────────────────────────────────────────────
// CCIPrompt — Contextual Commerce Invitation
//
// Shows only in the Neutral zone. A soft, dismissible prompt that invites the
// user to see commerce options. Dismissal is persisted per-topic in localStorage.
// ──────────────────────────────────────────────────────────────────────────────

const LS_KEY_PREFIX = 'ctbm-cci-dismissed'

function getDismissedKey(topic: string): string {
  return `${LS_KEY_PREFIX}:${topic.toLowerCase().replace(/\s+/g, '-')}`
}

function isTopicDismissed(topic: string): boolean {
  try {
    return localStorage.getItem(getDismissedKey(topic)) === 'true'
  } catch {
    // localStorage unavailable (SSR, private mode, etc.)
    return false
  }
}

function dismissTopic(topic: string): void {
  try {
    localStorage.setItem(getDismissedKey(topic), 'true')
  } catch {
    // ignore
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface CCIPromptProps {
  /** The topic of the conversation (e.g., "headphones", "laptops"). */
  topic: string
  /** Called when the user accepts the invitation. */
  onAccept: () => void
  /** Called when the user dismisses the prompt. */
  onDismiss: () => void
  /**
   * Whether to show the prompt. Typically tied to zone === 'neutral'.
   * The component also auto-hides if the topic was previously dismissed.
   */
  visible?: boolean
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '12px 16px',
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
  borderRadius: '0 0 8px 8px',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '13px',
  color: '#475569',
  animation: 'ctbm-slide-up 0.2s ease-out',
}

const messageStyle: React.CSSProperties = {
  flex: 1,
  lineHeight: 1.4,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexShrink: 0,
}

const acceptBtnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#3b82f6',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.15s',
}

const dismissBtnStyle: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  backgroundColor: 'transparent',
  color: '#64748b',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
}

const keyframeStyle = `
@keyframes ctbm-slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export function CCIPrompt({
  topic,
  onAccept,
  onDismiss,
  visible = true,
}: CCIPromptProps): React.ReactElement | null {
  const [dismissed, setDismissed] = useState(() => isTopicDismissed(topic))

  // Re-check if topic changes
  useEffect(() => {
    setDismissed(isTopicDismissed(topic))
  }, [topic])

  if (!visible || dismissed) return null

  function handleDismiss(): void {
    dismissTopic(topic)
    setDismissed(true)
    onDismiss()
  }

  function handleAccept(): void {
    onAccept()
  }

  return (
    <>
      {/* Inject keyframe animation once */}
      <style>{keyframeStyle}</style>
      <div
        role="complementary"
        aria-label="Commerce invitation"
        style={containerStyle}
      >
        <span style={messageStyle}>
          💡 I know some things that might help with{' '}
          <strong>{topic}</strong> — want to see options? Totally optional.
        </span>
        <div style={actionsStyle}>
          <button
            id="ctbm-cci-accept"
            onClick={handleAccept}
            style={acceptBtnStyle}
            aria-label={`See options for ${topic}`}
          >
            Show me
          </button>
          <button
            id="ctbm-cci-dismiss"
            onClick={handleDismiss}
            style={dismissBtnStyle}
            aria-label={`Dismiss commerce suggestion for ${topic}`}
          >
            No thanks
          </button>
        </div>
      </div>
    </>
  )
}
