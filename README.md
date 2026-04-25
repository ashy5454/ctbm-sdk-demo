<div align="center">

# 🛡️ CTBM — Conversation-Type-Based Monetization

**An ethical, AI-powered SDK for classifying chat intent and dynamically rendering commerce without compromising user safety.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Demo-Next.js_14-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/AI-Provider_Agnostic-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## What is CTBM?

CTBM (Conversation-Type-Based Monetization) is an enterprise-grade TypeScript SDK and React library designed for AI companions and mental health chat apps. It ensures that users are never served advertisements, product placements, or upselling when they are discussing sensitive, vulnerable, or emotional topics.

It works by running every message through a **4-Layer Hybrid Classification Pipeline**, routing the conversation into one of three strict zones:
- 🔴 **Protected**: User is in distress. Strict lockdown. No commerce allowed.
- 🟡 **Neutral**: General chat. Assistant can ask for permission to show products (CCI Prompt).
- 🟢 **Commerce**: User has explicit purchase intent. Products can be rendered dynamically.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **4-Layer Classification** | Keywords → Affect Lexicon → LLM → Trajectory Bias |
| 🛡️ **Enterprise Hardened** | Built-in exponential backoff, rate limit handling, and auto-timeouts |
| 🔌 **Provider Agnostic** | Drop in OpenAI, Anthropic, or Gemini via lightweight native `fetch` |
| ⚡ **Zero Dependencies** | `@ctbm/core` has no heavy external SDK requirements |
| 🧩 **React Integration** | Drop-in `@ctbm/react` hooks and components (`<ZoneBadge />`, `<CCIPrompt />`) |
| 🎮 **Split-Screen Playground** | Full Next.js 14 demo app showing real-time classification debugging |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core SDK** | TypeScript, ESM/CJS (tsup), Vitest |
| **React Hooks** | React 18+ Context & Component Library |
| **Playground Demo** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| **AI Integration** | `gemini-2.5-flash` (or `gpt-4o-mini`, `claude-3-haiku`) |

---

## 📁 Repository Structure

This repository contains both the core SDK monorepo and a full-stack Next.js demo playground.

```text
ai-researcher-assistant/
├── ctbm/                     # The SDK Monorepo
│   ├── packages/
│   │   ├── core/             # Classification pipeline, router, and types
│   │   ├── react/            # React hooks and pre-built UI components
│   │   └── storage/          # Memory and state persistence adapters
│   └── package.json          # npm workspaces
│
├── ctbm demo/                # The Next.js 14 Playground
│   ├── app/
│   │   ├── api/              # Classify, Chat, and Product generation routes
│   │   ├── playground/       # Split-screen live debugging view
│   │   └── onboarding/       # 3-step interactive explainer
│   ├── components/           # shadcn/ui and custom Zone components
│   └── .env.local            # API keys
```

---

## ⚡ Quick Start

### 1. Run the Next.js Demo Playground

The fastest way to see CTBM in action is to run the visual playground.

```bash
# 1. Navigate to the demo directory
cd "ctbm demo"

# 2. Install dependencies
npm install

# 3. Add your API Key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 4. Start the server
npm run dev
```

Open `http://localhost:3000` to interact with the real-time split-screen debugger.

---

### 2. Use the SDK in your own project

```bash
cd ctbm
npm install
npm run build
```

```typescript
import { classify, CTBMConfig } from '@ctbm/core';

const config: CTBMConfig = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY,
  thresholds: { protected: 0.35, neutral: 0.55, commerce: 0.75 },
  timeoutFallbackZone: 'protected' // Enterprise safety fallback
};

const result = await classify("I'm feeling really anxious about my debt.", history, config);

if (result.zone === 'protected') {
  console.log("Entering protected mode. Commerce disabled.");
  console.log("Decision was made by:", result.decisionLayer);
}
```

---

## 🏗️ The 4-Layer Architecture

1. **Keyword Guard (O(1) Sync)**: Checks hardcoded distress terms. If triggered, skips LLM entirely.
2. **Affect Lexicon (Sync)**: Uses the AFINN sentiment dictionary. Negative sentiment mathematically biases the final score towards `Protected`.
3. **LLM Evaluation (Async)**: Makes a fast `json_object` call to the AI provider to judge nuance and context. Features exponential backoff and timeouts.
4. **Trajectory Bias (Sync)**: Examines the last 3 messages. If the user was recently in distress, the system resists switching to `Commerce` too quickly.

---

## 🧪 Testing

The core package maintains a strict test suite covering the 4-layer architecture, edge cases, rate limiting, and API timeouts.

```bash
cd ctbm
npm install
npm test
```

---

## 🤝 Contributing

Contributions are welcome! If you're adding a new AI provider or improving the affect lexicon, please ensure `npm test` passes before submitting a PR.

---

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

<div align="center">
Built for a safer, more ethical AI web.
</div>
