import React from 'react'
import type { Zone } from '@ctbm/core'

// ──────────────────────────────────────────────────────────────────────────────
// Icons (inline SVGs — no external dependency)
// ──────────────────────────────────────────────────────────────────────────────

const ShieldIcon = (): React.ReactElement => (
  <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
)

const CircleIcon = (): React.ReactElement => (
  <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
)

const TagIcon = (): React.ReactElement => (
  <svg
    aria-hidden="true"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ flexShrink: 0 }}
  >
    <path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9a2 2 0 002.82 0l7-7a2 2 0 000-2.84zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z" />
  </svg>
)

// ──────────────────────────────────────────────────────────────────────────────
// Zone config
// ──────────────────────────────────────────────────────────────────────────────

const ZONE_CONFIG = {
  protected: {
    label: 'Safe Space',
    disclosure: null,
    icon: ShieldIcon,
    style: {
      backgroundColor: '#fff0f0',
      color: '#c0392b',
      border: '1px solid #f5c6c6',
    } as React.CSSProperties,
  },
  neutral: {
    label: 'Neutral',
    disclosure: null,
    icon: CircleIcon,
    style: {
      backgroundColor: '#f4f4f4',
      color: '#555555',
      border: '1px solid #ddd',
    } as React.CSSProperties,
  },
  commerce: {
    label: 'Commerce',
    disclosure: 'Product suggestions may include affiliate links',
    icon: TagIcon,
    style: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
      border: '1px solid #bbf7d0',
    } as React.CSSProperties,
  },
} as const satisfies Record<Zone, unknown>

// ──────────────────────────────────────────────────────────────────────────────
// ZoneBadge
// ──────────────────────────────────────────────────────────────────────────────

export interface ZoneBadgeProps {
  zone: Zone
  /** Show the disclosure text below the pill. Defaults to true for commerce. */
  showDisclosure?: boolean
  className?: string
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 10px',
  borderRadius: '9999px',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  letterSpacing: '0.01em',
  userSelect: 'none',
}

const disclosureStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '4px',
  fontSize: '10px',
  color: '#888',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

export function ZoneBadge({
  zone,
  showDisclosure = true,
  className,
}: ZoneBadgeProps): React.ReactElement {
  const cfg = ZONE_CONFIG[zone]
  const Icon = cfg.icon

  return (
    <div className={className} style={{ display: 'inline-block' }}>
      <span
        role="status"
        aria-label={`Conversation zone: ${cfg.label}`}
        style={{ ...pillStyle, ...cfg.style }}
      >
        <Icon />
        {cfg.label}
      </span>
      {showDisclosure && cfg.disclosure && (
        <span style={disclosureStyle}>{cfg.disclosure}</span>
      )}
    </div>
  )
}
