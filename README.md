# Japanese Learner (日語學習卡)

A flashcard web app for learning Japanese vocabulary and grammar, built for Traditional Chinese speakers. It features spaced repetition (SM-2 algorithm), multiple test modes, swipe gestures, and offline-capable progress tracking via localStorage.

**Live demo:** [https://tigercosmos.github.io/japanese-learner/](https://tigercosmos.github.io/japanese-learner/)

## Features

- **Spaced Repetition** - SM-2 algorithm (Anki-style) schedules cards based on your performance, surfacing difficult cards more often
- **Multiple Test Modes** - Vocabulary: Kanji-to-Chinese, Hiragana-to-Chinese, Chinese-to-Japanese. Grammar: Pattern-to-Chinese, Example-to-Chinese, Chinese-to-Grammar, Fill-in-the-blank
- **Learning Mode** - Browse cards sequentially with full content visible (no flipping, no rating) for initial study
- **Swipe Gestures** - Swipe left (don't know), down (hard), right (got it) as an alternative to tapping rating buttons; optional color overlay + text assist (toggleable in settings)
- **Keyboard Shortcuts** - Navigate and rate cards with keyboard for efficient desktop use
- **Settings Page** - Configure dark mode and swipe assist (color overlay + hint text during swipe)
- **Grammar Highlighting** - Bracket notation (e.g., `【grammar】`) renders grammar parts with colored highlights or blanks for fill-in mode
- **Dataset Filtering** - Filter datasets by category (vocabulary/grammar) and JLPT level
- **Progress Statistics** - Track learned, due, and mastered cards per dataset with visual progress bars
- **Random Review** - Review all cards in a shuffled order even when no cards are due
- **Offline-First** - All progress stored in browser localStorage; no backend required
- **Dark Mode** - Toggle between light and dark themes via header or settings page
- **Responsive Design** - Mobile-friendly with centered layout on desktop

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** for styling
- **React Router v7** for client-side routing
- **Vitest** for unit tests
- **Playwright** for end-to-end tests

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/tigercosmos/japanese-learner.git
cd japanese-learner
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://127.0.0.1:5173/japanese-learner/`.

### Build

```bash
npm run build
```

Outputs to `dist/`. Includes a `404.html` copy for GitHub Pages SPA support.

### Testing

```bash
npm run test          # Unit tests (Vitest)
npm run test:watch    # Unit tests in watch mode
npm run test:e2e      # End-to-end tests (Playwright)
npm run test:e2e:ui   # Playwright interactive UI mode
```

### Linting

```bash
npm run lint
```

## Project Structure

```
data/                   JSON datasets (vocab-n3.json, grammar-n3.json, etc.)
src/
  components/           Reusable UI components (Flashcard, RatingButtons, etc.)
  hooks/                Custom React hooks (useStudySession, useProgress, etc.)
  lib/                  Core logic (SM-2 algorithm, grammar parser, storage)
  pages/                Route-level page components (HomePage, SetupPage, StudyPage, LearnPage, SettingsPage)
  types/                TypeScript type definitions
e2e/                    Playwright end-to-end tests
```

## Data Format

Datasets are JSON files in the `data/` directory. Each file follows this structure:

**Vocabulary:**
```json
{
  "name": "N3 Vocabulary",
  "category": "vocabulary",
  "level": "N3",
  "data": [
    {
      "id": "vocab-n3-001",
      "japanese": "株式",
      "hiragana": "かぶしき",
      "simple_chinese": "股份",
      "full_explanation": "株式会社（かぶしきがいしゃ）：股份有限公司"
    }
  ]
}
```

**Grammar:**
```json
{
  "name": "N3 Grammar",
  "category": "grammar",
  "level": "N3",
  "data": [
    {
      "id": "grammar-n3-001",
      "japanese": "うちに",
      "simple_chinese": "在～過程中／趁～",
      "full_explanation": "表示在某狀態持續期間做某事...",
      "examples": [
        {
          "sentence": "勉強している【うちに】眠くなった",
          "chinese": "讀書讀著讀著就睏了"
        }
      ]
    }
  ]
}
```

Grammar examples use `【bracket】` notation to mark grammar points, supporting multiple brackets per sentence for multi-part patterns.

## SM-2 Algorithm

Cards are rated on a 3-point scale after each review:

| Button | Label | Effect |
|--------|-------|--------|
| Again  | 不會  | Reset repetitions, review again soon |
| Hard   | 還好  | Increase interval conservatively |
| Good   | 記住了 | Increase interval normally |

The algorithm adjusts ease factor and review intervals to optimize long-term retention. Cards rated "Again" are re-queued within the current session.

## License

MIT
