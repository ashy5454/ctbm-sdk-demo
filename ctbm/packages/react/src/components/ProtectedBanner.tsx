import React from 'react'

// ──────────────────────────────────────────────────────────────────────────────
// ProtectedBanner
//
// Renders in the conversation header when the zone is 'protected'.
// Communicates to users that this conversation is ad-free and private.
// ──────────────────────────────────────────────────────────────────────────────

const ShieldIcon = (): React.ReactElement => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
)

const bannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  backgroundColor: '#fff5f5',
  borderBottom: '1px solid #fecaca',
  color: '#991b1b',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '13px',
  fontWeight: 500,
}

export interface ProtectedBannerProps {
  /**
   * Whether the banner is visible.
   * Typically tied to zone === 'protected'.
   */
  visible?: boolean
  /** Override the banner message. */
  message?: string
  className?: string
}

export function ProtectedBanner({
  visible = true,
  message = 'This conversation is ad-free and private',
  className,
}: ProtectedBannerProps): React.ReactElement | null {
  if (!visible) return null

  return (
    <div
      role="banner"
      aria-label="Protected conversation notice"
      className={className}
      style={bannerStyle}
    >
      <ShieldIcon />
      <span>{message}</span>
    </div>
  )
}
