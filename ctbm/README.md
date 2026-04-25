# ctbm — Conversation-Type-Based Monetization

[![npm](https://img.shields.io/npm/v/@ctbm/core?label=%40ctbm%2Fcore)](https://www.npmjs.com/package/@ctbm/core)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

**Developer infrastructure for ethical AI monetization.** `ctbm` classifies
each message in a conversation into one of three zones — `protected`, `neutral`,
or `commerce` — and routes your response logic accordingly. Commerce signals
never cross into protected conversations.

---

## Packages

| Package | Description |
|---|---|
| `@ctbm/core` | Classifier, router, memory, types |
| `@ctbm/react` | React hooks and UI components |
| `@ctbm/storage` | `StorageAdapter` interface + in-memory adapter |

---

## Install

```bash
npm install @ctbm/core
# or
pnpm add @ctbm/core
```

For React integrations:

```bash
npm install @ctbm/core @ctbm/react
```

---

## Quickstart (15 lines)

```typescript
import { classify, CTBMRouter } from '@ctbm/core'

const config = {
  provider: 'openai' as const,
  apiKey: process.env.OPENAI_API_KEY!,
}

const message = "I've been feeling really overwhelmed lately."
const result = await classify(message, [], config)

const response = await CTBMRouter.route(result.zone, {
  onProtected: () => 'I hear you. Would you like to talk about what's been going on?',
  onNeutral:   () => 'Sure, happy to help — what are you looking for?',
  onCommerce:  () => 'Here are some options that might help…',
})

console.log(result.zone)   // 'protected'
console.log(response)      // 'I hear you. Would you like to talk about…'
```

---

## The 4-Layer Pipeline

```
Message → [Layer 1: Keyword Guard] → PROTECTED (instant, no API call)
                ↓ (no keyword match)
         [Layer 2: Affect Score]  ← AFINN lexicon, synchronous
                ↓
         [Layer 3: LLM Scores]    ← Anthropic or OpenAI
                ↓
         [Layer 4: Trajectory]    ← last 3 message zones
                ↓
         Normalise + Thresholds → zone decision
```

---

## Memory Separation Example

The two-layer memory architecture ensures emotional context never leaks
into commerce responses.

```typescript
import { CTBMMemory } from '@ctbm/core'
import { MemoryStorageAdapter } from '@ctbm/storage'

const adapter = new MemoryStorageAdapter()
const memory = new CTBMMemory(adapter, 'user-abc')

// Classify and store
const result = await classify(message, history, config)
await memory.store(result.zone, message, result.signals)

// Retrieve context — cross-layer access is architecturally impossible
const { context, layerUsed } = await memory.getContextForZone(result.zone)
// Protected/Neutral → layerUsed: 'A'  (emotional context)
// Commerce         → layerUsed: 'B'  (behavioural signals only)

// Zone statistics
const stats = await memory.getZoneStats('user-abc')
console.log(stats.transitionRate) // % of sessions that moved protected → commerce
```

> **Architectural guarantee**: There is no `getLayerAForCommerce()` method.
> The separation is enforced by the type system, not just a runtime guard.

---

## Extending Protected Keywords for Domain-Specific Apps

The built-in keyword list covers general mental health and crisis terms.
For verticals with domain-specific sensitive language (legal, medical, financial),
extend the list per-config:

```typescript
const config = {
  provider: 'anthropic' as const,
  apiKey: process.env.ANTHROPIC_API_KEY!,

  // These fire Layer 1 immediately — no API call, no latency
  extendProtectedKeywords: [
    'malpractice',
    'wrongful termination',
    'Chapter 7',
    'custody battle',
    'overdraft',
    'debt collector',
  ],
}

const result = await classify(
  'I got a letter from a debt collector today',
  [],
  config,
)

console.log(result.zone)          // 'protected'
console.log(result.decisionLayer) // 'keyword'
console.log(result.processingMs)  // < 1ms (no API call made)
```

---

## The Asymmetric Threshold Philosophy

`ctbm` uses deliberately unequal thresholds for zone classification.
**Protected requires only 35% confidence to win; Commerce requires 75%.**
This asymmetry reflects a core ethical constraint: falsely labelling a
distressed user as a commerce target is far more harmful than missing a
revenue opportunity, so the system is biased toward caution, not conversion.

---

## React Integration

```tsx
import { CTBMProvider, useZone, ZoneBadge, ProtectedBanner, CCIPrompt } from '@ctbm/react'

function App() {
  return (
    <CTBMProvider config={{ provider: 'openai', apiKey: '...' }}>
      <ChatWindow />
    </CTBMProvider>
  )
}

function ChatHeader() {
  const zone = useZone()
  return (
    <header>
      <ProtectedBanner visible={zone === 'protected'} />
      <ZoneBadge zone={zone} />
    </header>
  )
}

function ChatFooter({ topic }: { topic: string }) {
  const zone = useZone()
  return (
    <CCIPrompt
      visible={zone === 'neutral'}
      topic={topic}
      onAccept={() => console.log('User accepted commerce suggestion')}
      onDismiss={() => console.log('User dismissed')}
    />
  )
}
```

---

## Running Tests

```bash
pnpm install
pnpm test
```

All tests use a mocked LLM client — no API keys needed for the test suite.

---

## Configuration Reference

```typescript
interface CTBMConfig {
  provider: 'anthropic' | 'openai'
  apiKey: string
  model?: string                      // default: claude-3-5-haiku / gpt-4o-mini

  thresholds?: {
    protected?: number                // default: 0.35 (low bar — safety first)
    neutral?: number                  // default: 0.55
    commerce?: number                 // default: 0.75 (high bar — earn it)
  }

  extendProtectedKeywords?: string[]  // domain-specific instant-guard terms
  extendCommerceKeywords?: string[]   // boost commerce signal (no short-circuit)
  onViolation?: (result) => void      // called on commerce leak in protected zone
}
```

---

## License

MIT © 2024
