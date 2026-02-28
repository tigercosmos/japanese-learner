# Japanese Learner - Development Plan

## Overview

A Quizlet-like flashcard web app for learning Japanese vocabulary and grammar. Built with React + TypeScript + Vite + Tailwind CSS. Data stored as JSON files, progress persisted in browser localStorage.

---

## 1. Project Setup

- Initialize Vite project with React + TypeScript template
- Install dependencies: `react-router-dom`, `tailwindcss`
- Configure Tailwind CSS
- Set up project directory structure:

```
japanese-learner/
├── public/
├── data/
│   ├── vocab-n3.json
│   └── grammar-n3.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.tsx              # Centered container, nav bar
│   │   ├── DatasetCard.tsx         # Dataset selector card
│   │   ├── Flashcard.tsx           # Flip card component
│   │   ├── ProgressBar.tsx         # Session progress indicator
│   │   ├── RatingButtons.tsx       # 不會 / 還好 / 記住了
│   │   ├── SessionSummary.tsx      # End-of-session stats
│   │   ├── ModeSelector.tsx        # Test mode picker
│   │   ├── FilterBar.tsx           # Category/level filter
│   │   └── GrammarHighlight.tsx    # Render bracket-marked grammar
│   ├── pages/
│   │   ├── HomePage.tsx            # Dataset browsing + filters
│   │   ├── SetupPage.tsx           # Choose test mode before session
│   │   ├── StudyPage.tsx           # Active flashcard session
│   │   └── SummaryPage.tsx         # Session results
│   ├── hooks/
│   │   ├── useDatasets.ts          # Load and filter JSON datasets
│   │   ├── useStudySession.ts      # Session state, card queue, rating
│   │   └── useProgress.ts         # Read/write localStorage progress
│   ├── lib/
│   │   ├── sm2.ts                  # SM-2 spaced repetition algorithm
│   │   ├── shuffle.ts              # Fisher-Yates shuffle
│   │   ├── grammar.ts              # Parse bracket markers in sentences
│   │   └── storage.ts              # localStorage helpers
│   └── types/
│       └── index.ts                # All TypeScript types/interfaces
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 2. Data Schema

### 2.1 Vocabulary Dataset

```jsonc
{
  "name": "N3 詞彙",
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

### 2.2 Grammar Dataset

```jsonc
{
  "name": "N3 文法",
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
    },
    {
      "id": "grammar-n3-002",
      "japanese": "～から～にかけて",
      "simple_chinese": "從～到～",
      "full_explanation": "表示從某範圍到另一範圍...",
      "examples": [
        {
          "sentence": "東京【から】大阪【にかけて】雨が降るでしょう",
          "chinese": "從東京到大阪一帶會下雨吧"
        }
      ]
    }
  ]
}
```

Bracket notation: `【grammar part】` supports multiple brackets per sentence for multi-part grammar patterns.

---

## 3. Test Modes

### 3.1 Vocabulary Test Modes

| Mode | Front (Question) | Back (Answer) |
|------|------------------|---------------|
| 漢字 → 中文 | Show kanji only | Chinese meaning |
| 假名 → 中文 | Show hiragana only | Chinese meaning |
| 中文 → 日文 | Show Chinese meaning | Japanese + hiragana (+ optional full explanation) |

User picks one mode per session during setup.

### 3.2 Grammar Test Modes

| Mode | Front (Question) | Back (Answer) |
|------|------------------|---------------|
| 文法 → 中文 | Show grammar pattern | Chinese meaning |
| 例句 → 中文 | Show example sentence with grammar **highlighted** | Chinese meaning |
| 中文 → 文法 | Show Chinese meaning | Japanese grammar (+ optional full explanation) |
| 填空 → 文法 | Show example sentence with grammar **blanked out** + Chinese translation | Japanese grammar (+ optional full explanation) |

---

## 4. SM-2 Spaced Repetition Algorithm

Based on Anki's implementation of SuperMemo SM-2.

### 4.1 Per-Card Progress State

```ts
interface CardProgress {
  cardId: string;
  datasetId: string;       // which dataset this card belongs to
  easeFactor: number;      // default 2.5, min 1.3
  interval: number;        // days until next review
  repetitions: number;     // consecutive correct count
  nextReview: string;      // ISO date string
  lastRating: number;      // last quality rating
}
```

### 4.2 Rating Mapping

| Button | Label | Quality (q) |
|--------|-------|-------------|
| 不會 | Again | 1 |
| 還好 | Hard | 3 |
| 記住了 | Good | 5 |

### 4.3 Algorithm Logic

```
If q < 3 (Again):
  repetitions = 0
  interval = 1 (review tomorrow / next session)

If q >= 3 (Hard or Good):
  if repetitions == 0: interval = 1
  else if repetitions == 1: interval = 6
  else: interval = round(interval * easeFactor)
  repetitions += 1

Update ease factor:
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = max(1.3, easeFactor)

nextReview = today + interval days
```

### 4.4 Session Card Selection

1. Load all cards from the selected dataset
2. Filter cards due for review (nextReview <= today) + new cards (no progress yet)
3. Shuffle the filtered cards (Fisher-Yates)
4. Limit session size (e.g., 20 cards per session, configurable)
5. Cards rated "不會" are re-queued at the end of the current session

---

## 5. Navigation & Routes

```
/                           → HomePage (browse datasets, filter by category/level)
/study/:datasetId           → SetupPage (choose test mode, session size)
/study/:datasetId/session   → StudyPage (active flashcard session)
/study/:datasetId/summary   → SummaryPage (session results)
```

### 5.1 User Flow

```
HomePage
  ├── See all datasets, filter by category (vocabulary/grammar) and level (N5-N1)
  ├── Each dataset shows: name, level, card count, due count
  └── Click dataset → SetupPage

SetupPage
  ├── Show available test modes for this dataset type
  ├── Session size slider (10/20/30/all due)
  └── Start → StudyPage

StudyPage
  ├── Progress bar at top (e.g., 3/20)
  ├── Flashcard in center, tap/click to flip
  ├── After flip, show 3 rating buttons at bottom
  ├── Rating advances to next card with animation
  ├── "不會" cards re-appear later in session
  └── All cards done → SummaryPage

SummaryPage
  ├── Stats: total reviewed, 記住了 / 還好 / 不會 counts
  ├── List of cards rated 不會 for quick review
  ├── "再來一次" (Study Again) button
  └── "回首頁" (Back to Home) button
```

---

## 6. UI / Layout

### 6.1 Responsive Design

- **Mobile**: Full width with padding
- **Desktop**: Centered container, max-width ~640px (roughly 1/2 screen on 1280px+)
- Shared layout wrapper handles this automatically

### 6.2 Key UI Components

- **Flashcard**: Card with flip animation (CSS 3D transform). Front shows question, back shows answer. Tap anywhere to flip.
- **Rating Buttons**: Three buttons fixed at bottom. Color coded: red (不會), yellow (還好), green (記住了). Only visible after card is flipped.
- **Grammar Highlight**: Renders 【bracket】 content with colored background highlight. In blank mode, replaces with `____` placeholder.
- **Progress Bar**: Thin bar at top showing current position in session.

### 6.3 Navigation Bar

- Simple top bar with app title "日語學習卡" and back button when inside a session
- Dark mode toggle button and settings gear icon on the right
- Minimal — the focus is on the cards

---

## 7. localStorage Schema

Key prefix: `jp-learner:`

```
jp-learner:progress         → { [cardId: string]: CardProgress }
jp-learner:settings         → { defaultSessionSize: number, showSwipeAssist: boolean }
```

---

## 8. Implementation Order

### Phase 1: Foundation
1. Project scaffolding (Vite + React + TS + Tailwind + React Router)
2. TypeScript types for all data structures
3. Layout component with responsive centered container
4. React Router setup with all routes

### Phase 2: Data & Core Logic
5. Sample JSON datasets (1 vocabulary + 1 grammar, ~5 items each for testing)
6. Dataset loading hook (`useDatasets`)
7. SM-2 algorithm implementation (`sm2.ts`)
8. localStorage helpers and progress hook (`useProgress`)
9. Grammar bracket parser (`grammar.ts`)
10. Shuffle utility

### Phase 3: Pages & Components
11. HomePage — dataset listing with category/level filters
12. DatasetCard component
13. SetupPage — mode selection + session config
14. Flashcard component with flip animation
15. StudyPage — session logic, card queue, rating flow
16. RatingButtons component
17. GrammarHighlight component (highlight + blank modes)
18. SummaryPage — session results

### Phase 4: Polish
19. Progress bar during session
20. Flip and slide animations
21. Re-queue "不會" cards logic
22. Mobile touch interactions and responsive fine-tuning
23. Edge cases: empty datasets, all cards mastered, no due cards

---

## 9. Sample Data for Development

Create minimal test data during Phase 2:

- `data/vocab-n3.json` — 5 vocabulary items
- `data/grammar-n3.json` — 5 grammar items (including multi-bracket patterns)

These serve as both development fixtures and format documentation.

---

## 10. Learning Mode (Phase 5)

A read-only browsing mode that shows cards one-by-one with full content visible (no flip, no rating). Designed for initial learning before testing.

### 10.1 Route

```
/learn/:datasetId           → LearnPage (browse cards sequentially)
```

### 10.2 User Flow

```
SetupPage
  ├── "學習模式" button (alongside 開始測驗)
  └── Click → LearnPage

LearnPage
  ├── Progress bar at top (e.g., 2 / 5)
  ├── Full card content displayed (no flip):
  │   ├── Vocabulary: japanese + hiragana + chinese + full_explanation
  │   └── Grammar: japanese + chinese + full_explanation + all examples (highlighted)
  ├── Navigation: ← 上一張 / 下一張 → buttons
  ├── Keyboard: Left arrow = previous, Right arrow = next
  └── End: shows "學習完成" with back options
```

### 10.3 Card Layout (Learning Mode)

**Vocabulary card** — single view, no flip:
- Top: Japanese kanji (large)
- Middle: hiragana reading
- Below: Chinese meaning (bold)
- Bottom: full explanation

**Grammar card** — single view, no flip:
- Top: Grammar pattern (large)
- Middle: Chinese meaning (bold)
- Below: full explanation
- Examples section: each example shows sentence (with grammar highlighted) + Chinese translation

---

## 11. Review All / Random Mode (Phase 5)

When all cards in a dataset are already learned (due = 0), users should still be able to study.

### 11.1 Session Types

The SetupPage passes a `sessionType` to the StudyPage via location.state:

| sessionType | Behavior |
|-------------|----------|
| `"due"` (default) | Only due/new cards. Current behavior. |
| `"random"` | All cards, shuffled randomly, ignoring due dates. Still updates SM-2 progress. |

### 11.2 Changes to SetupPage

- Always show both buttons:
  - "開始測驗" — uses `"due"` session type (only due cards)
  - "隨機複習" — uses `"random"` session type (all cards, shuffled)
- When due cards = 0, the "開始測驗" button is disabled with hint text.

### 11.3 Changes to useStudySession

- Accept `sessionType` parameter.
- When `sessionType === "random"`:
  - Ignore `isDue()` filter, include all cards.
  - Still shuffle and limit by sessionSize.
  - Still track session results for summary display.
  - Still update SM-2 progress (ratings count).

---

## 12. Statistics (Phase 5)

### 12.1 Dataset Statistics on DatasetCard (HomePage)

Each DatasetCard shows a mastery progress bar:

- **已學習**: number of cards that have been rated at least once
- **熟練度**: progress bar showing percentage of cards with `repetitions >= 3` (well-learned)

### 12.2 Dataset Statistics on SetupPage

A stats section displayed on SetupPage (above mode selection):

| Stat | Description |
|------|-------------|
| 總卡片數 | Total cards in dataset |
| 已學習 | Cards with at least one review |
| 待複習 | Cards currently due |
| 已熟練 | Cards with repetitions >= 3 |

### 12.3 Implementation

- Stats are computed from `ProgressStore` in localStorage.
- A utility function `getDatasetStats(dataset, progress)` returns all stat values.
- `DatasetMeta` type extended with `learnedCards` and `masteredCards` fields.

### 12.4 New Files

```
src/lib/stats.ts                # getDatasetStats() utility
src/components/StatsBar.tsx     # Mastery bar on DatasetCard
src/components/DatasetStats.tsx # Stats section for SetupPage
src/components/LearnCard.tsx    # Full-content card for learning mode
src/pages/LearnPage.tsx         # Learning mode page
```

---

## 13. Updated Route Map

```
/                                → HomePage
/study/:datasetId                → SetupPage (mode + session config)
/study/:datasetId/session        → StudyPage (flashcard test session)
/learn/:datasetId                → LearnSetupPage (choose learn mode)
/learn/:datasetId/session        → LearnPage (browse cards with full content)
/settings                        → SettingsPage (dark mode, swipe assist toggles)
```

---

## 14. Settings Page (Phase 6)

A dedicated settings page accessible via a gear icon in the header navigation bar.

### 14.1 Route

```
/settings → SettingsPage
```

### 14.2 Settings

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| 深色模式 | (dark mode via CSS class) | system | Toggle dark/light theme |
| 滑動提示 | `showSwipeAssist` | `true` | Show color overlay + label text on card during swipe gestures |

### 14.3 Swipe Assist Behavior

When **enabled** (default):
- Swiping a card shows a colored overlay (green/red/yellow) with a text label (記住了/不會/還好)
- Mobile hint text "← 不會 · ↓ 還好 · → 記住了" is shown below the card

When **disabled**:
- Swiping still works — cards move with drag and trigger ratings normally
- The color overlay and text label are hidden
- The mobile hint text is hidden

### 14.4 Files

```
src/pages/SettingsPage.tsx       # Settings page with toggle rows
src/hooks/useSettings.ts         # React hook wrapping loadSettings/saveSettings
```
