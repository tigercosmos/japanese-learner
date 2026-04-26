# Japanese Learner - System Design

## Overview

A Quizlet-like flashcard web app for learning Japanese vocabulary and grammar. Built with React 19 + TypeScript + Vite + Tailwind CSS v4. Data stored as JSON files, progress persisted in browser localStorage. Deployed to GitHub Pages.

---

## 1. Project Structure

```
japanese-learner/
├── data/
│   ├── n5_vocab.json
│   ├── n4_vocab.json
│   ├── n3_vocab.json
│   ├── grammar-n5.json
│   ├── grammar-n4.json
│   └── grammar-n3.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.tsx              # Centered container, nav bar
│   │   ├── DatasetCard.tsx         # Dataset selector card on homepage
│   │   ├── Flashcard.tsx           # Flip card component
│   │   ├── ProgressBar.tsx         # Session progress indicator
│   │   ├── RatingButtons.tsx       # 不會 / 還好 / 記住了
│   │   ├── SessionSummary.tsx      # End-of-session stats
│   │   ├── ModeSelector.tsx        # Test mode picker (supports grouped modes for mix)
│   │   ├── FilterBar.tsx           # Category/level filter
│   │   ├── GrammarHighlight.tsx    # Render bracket-marked grammar
│   │   ├── Furigana.tsx            # Hiragana ruby above kanji (gated by showFurigana setting)
│   │   ├── LearnCard.tsx           # Full-content card for learning mode
│   │   ├── ItemForm.tsx            # Form for vocab/grammar items (with type selector for mix)
│   │   ├── ConfirmDialog.tsx       # Delete confirmation modal
│   │   ├── DatasetStats.tsx        # Stats section for SetupPage
│   │   └── StatsBar.tsx            # Mastery bar on DatasetCard
│   ├── pages/
│   │   ├── HomePage.tsx            # Dataset browsing + filters
│   │   ├── SetupPage.tsx           # Choose test mode before session
│   │   ├── StudyPage.tsx           # Active flashcard session
│   │   ├── LearnSetupPage.tsx      # Choose learn plan (全部學習 / 分天計畫)
│   │   ├── LearnPage.tsx           # Learning mode (browse cards)
│   │   ├── DatasetCreatePage.tsx   # Create new dataset
│   │   ├── DatasetEditPage.tsx     # List/manage items in a dataset
│   │   ├── ItemEditPage.tsx        # Add or edit a single item
│   │   ├── SettingsPage.tsx        # Dark mode, swipe assist, furigana toggles
│   │   └── AboutPage.tsx           # About page
│   ├── hooks/
│   │   ├── useDatasets.ts          # Load and merge JSON + custom datasets
│   │   ├── useStudySession.ts      # Session state, card queue, rating
│   │   ├── useProgress.ts          # Read/write localStorage progress
│   │   ├── useDatasetCrud.ts       # CRUD operations for datasets/items
│   │   ├── useStudyPlan.ts         # Daily learning plan management
│   │   ├── useKeyboard.ts          # Keyboard shortcuts
│   │   ├── useSwipe.ts             # Touch/mouse drag gestures
│   │   ├── useSettings.ts          # Settings hook
│   │   ├── useGoogleSync.ts         # Google Drive sync hook
│   │   └── useDarkMode.ts          # Dark mode state
│   ├── lib/
│   │   ├── sm2.ts                  # SM-2 spaced repetition algorithm
│   │   ├── shuffle.ts              # Fisher-Yates shuffle
│   │   ├── grammar.ts              # Parse bracket markers in sentences
│   │   ├── flashcard.ts            # Build front/back card content per mode
│   │   ├── furigana.ts             # Lazy kuroshiro/kuromoji loader + ruby HTML conversion
│   │   ├── storage.ts              # localStorage helpers (progress, settings, custom data, sync)
│   │   ├── stats.ts                # Dataset statistics computation
│   │   ├── category.ts             # Shared category labels and colors
│   │   ├── studyPlan.ts            # Daily plan creation logic
│   │   └── google/
│   │       ├── syncTypes.ts        # Type definitions for Google Drive sync
│   │       ├── gis.ts              # Google Identity Services OAuth2 auth
│   │       ├── driveApi.ts         # Drive REST API v3 wrapper (raw fetch)
│   │       └── syncEngine.ts       # Pull/push orchestration + debouncer
│   └── types/
│       └── index.ts                # All TypeScript types/interfaces/constants
├── e2e/
│   ├── fixtures/                   # Test fixture data (test-vocab, test-grammar, test-mix)
│   ├── global-setup.ts             # Copy fixtures into data/ before tests
│   ├── global-teardown.ts          # Clean up fixtures after tests
│   ├── home.spec.ts
│   ├── learn.spec.ts
│   ├── manage.spec.ts
│   ├── mix.spec.ts
│   ├── mobile.spec.ts
│   ├── navigation.spec.ts
│   ├── pronunciation.spec.ts
│   ├── settings.spec.ts
│   ├── setup.spec.ts
│   ├── study.spec.ts
│   └── swipe.spec.ts
├── index.html
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 2. Data Schema

### 2.1 Category System

Three dataset categories are supported:

```ts
type Category = "vocabulary" | "grammar" | "mix";
```

- **vocabulary** — Items with `japanese`, `hiragana`, `simple_chinese`, `full_explanation`
- **grammar** — Items with `japanese`, `simple_chinese`, `full_explanation`, `examples[]`
- **mix** — Contains both vocab and grammar items in a single dataset

Item type detection for mix datasets uses `isVocabItem(item)` which checks `"hiragana" in item` — only vocabulary items have the `hiragana` field.

### 2.2 Vocabulary Dataset

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

### 2.3 Grammar Dataset

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
          "sentence": "{勉強|べんきょう}している【うちに】{眠|ねむ}くなった",
          "chinese": "讀書讀著讀著就睏了"
        }
      ]
    }
  ]
}
```

#### Sentence syntax

Two annotation forms are supported inside `examples[].sentence`:

- `【...】` — wraps the **grammar pattern** for highlight / fill-in rendering.
- `{kanji|reading}` — supplies a **manual hiragana reading** for the kanji
  word, used as a furigana ruby annotation when the user enables the toggle.
  This overrides the kuroshiro auto-reader, which fixes context-sensitive
  cases that a static dictionary gets wrong (e.g. 「方」 = かた vs ほう).
  Words without `{|}` annotations fall back to kuroshiro at render time.

The two forms can interleave or nest; e.g.
`{私|わたし}【は】{学生|がくせい}【です】。`

### 2.4 Mix Dataset

```jsonc
{
  "name": "N3 綜合",
  "category": "mix",
  "level": "N3",
  "data": [
    {
      "id": "mix-v1",
      "japanese": "勉強",
      "hiragana": "べんきょう",
      "simple_chinese": "學習",
      "full_explanation": "勉強する：學習、用功讀書"
    },
    {
      "id": "mix-g1",
      "japanese": "ている",
      "simple_chinese": "正在～",
      "full_explanation": "表示動作正在進行中。",
      "examples": [
        { "sentence": "本を読ん【ている】", "chinese": "正在看書" }
      ]
    }
  ]
}
```

Bracket notation: `【grammar part】` supports multiple brackets per sentence for multi-part grammar patterns.

---

## 3. Test Modes

### 3.1 Vocabulary Test Modes (`VOCAB_TEST_MODES`)

| Mode | Front (Question) | Back (Answer) |
|------|------------------|---------------|
| 漢字 → 中文 | Show kanji only | Chinese meaning |
| 假名 → 中文 | Show hiragana only | Chinese meaning |
| 中文 → 日文 | Show Chinese meaning | Japanese + hiragana |

### 3.2 Grammar Test Modes (`GRAMMAR_TEST_MODES`)

| Mode | Front (Question) | Back (Answer) |
|------|------------------|---------------|
| 文法 → 中文 | Show grammar pattern | Chinese meaning |
| 例句 → 中文 | Show example sentence with grammar **highlighted** | Chinese meaning |
| 中文 → 文法 | Show Chinese meaning | Japanese grammar |
| 填空 → 文法 | Show example sentence with grammar **blanked out** + Chinese translation | Japanese grammar |

### 3.3 Mix Test Modes (`MIX_TEST_MODES`)

Mix datasets support all 7 modes above, with each mode tagged with `group: "vocab" | "grammar"`. During study sessions, each item is only tested with applicable modes:

- Vocab items → vocab modes only (`VOCAB_MODE_VALUES`)
- Grammar items → grammar modes only (`GRAMMAR_MODE_VALUES`)

**Default modes:** `MIX_DEFAULT_MODES = ["kanji-to-chinese", "grammar-to-chinese"]`

### 3.4 Multi-Mode Sessions

When multiple modes are selected, each card is tested once per applicable mode. For mix datasets, inapplicable (item, mode) pairs are automatically skipped.

### 3.5 Mix SetupPage UI

- **Compact view (default):** Shows active mode pills + "進階設定" link
- **Advanced view:** Expands full ModeSelector with grouped sections (詞彙/文法) + "收起" button to collapse
- The "全部模式" toggle selects/deselects all modes; deselecting falls back to `MIX_DEFAULT_MODES`

---

## 4. SM-2 Spaced Repetition Algorithm

Based on Anki's implementation of SuperMemo SM-2.

### 4.1 Per-Card Progress State

```ts
interface CardProgress {
  cardId: string;
  datasetId: string;
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
  interval = 1

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
3. For mix datasets in multi-mode, filter to applicable (item, mode) pairs
4. Shuffle the filtered cards (Fisher-Yates)
5. Limit session size (e.g., 20 cards per session, configurable)
6. Cards rated "不會" are re-queued at the end of the current session

---

## 5. Routes & Navigation

```
/                                → HomePage (browse datasets, filter by category/level)
/study/:datasetId                → SetupPage (mode + session config)
/study/:datasetId/session        → StudyPage (flashcard test session)
/learn/:datasetId                → LearnSetupPage (choose 全部學習 or 分天計畫)
/learn/:datasetId/session        → LearnPage (browse cards with full content)
/manage/new                      → DatasetCreatePage (create new dataset)
/manage/:datasetId               → DatasetEditPage (list/manage items)
/manage/:datasetId/item          → ItemEditPage (add new item)
/manage/:datasetId/item/:itemId  → ItemEditPage (edit existing item)
/settings                        → SettingsPage (dark mode, swipe assist)
/about                           → AboutPage
```

### 5.1 User Flow

```
HomePage
  ├── See all datasets, filter by category (vocabulary/grammar/mix) and level
  ├── Each dataset shows: name, level, category badge, card count, mastery bar
  ├── Click dataset → SetupPage
  └── "+ 新增學習集" → DatasetCreatePage

SetupPage
  ├── Show available test modes for this dataset type
  │   ├── vocabulary/grammar: direct ModeSelector
  │   └── mix: compact pills with "進階設定" toggle for grouped ModeSelector
  ├── Session size selector (10/20/30/all)
  ├── "學習模式（瀏覽全部卡片）" → LearnSetupPage
  ├── "隨機複習（全部卡片）" → StudyPage (random session)
  ├── "開始複習（待複習）" → StudyPage (due cards only)
  └── "管理" link → DatasetEditPage

LearnSetupPage
  ├── "全部學習" — browse all cards at once
  ├── "分天計畫" — split cards across multiple days
  └── "開始學習" → LearnPage

LearnPage
  ├── Progress bar at top
  ├── Full card content (no flip), navigation buttons
  ├── Edit/delete buttons per card
  ├── Keyboard: ← previous, → next
  └── End: "瀏覽完成" with options to start exam or restart

StudyPage
  ├── Progress bar + mode label at top
  ├── Flashcard in center, tap/click to flip
  ├── After flip, show 3 rating buttons
  ├── Swipe gestures alternative
  ├── "不會" cards re-appear later in session
  └── All cards done → SessionSummary (inline)
```

---

## 6. UI / Layout

### 6.1 Responsive Design

- **Mobile**: Full width with padding, touch-optimized
- **Desktop**: Centered container, max-width ~640px
- Shared `Layout` wrapper handles this automatically

### 6.2 Key UI Components

- **Flashcard**: Card with flip animation (CSS 3D transform). Front shows question, back shows answer. Tap anywhere to flip.
- **Rating Buttons**: Three buttons at bottom. Color coded: red (不會), yellow (還好), green (記住了). Only visible after card is flipped.
- **Grammar Highlight**: Renders `【bracket】` content with colored background highlight. In blank mode, replaces with `____` placeholder.
- **Progress Bar**: Thin bar at top showing current position in session, with optional mode label for multi-mode sessions.
- **ModeSelector**: Chip-based mode picker. Supports `grouped` prop for mix datasets (visual 詞彙/文法 section labels) and `defaultModes` prop for fallback behavior.
- **ItemForm**: Form for adding/editing items. For mix datasets, includes a type selector (詞彙/文法) that toggles between vocab and grammar fields.

### 6.3 Navigation Bar

- Simple top bar with app title "日語學習卡" and back button when inside a session
- Dark mode toggle button and settings gear icon on the right
- Minimal — the focus is on the cards

---

## 7. localStorage Schema

Key prefix: `jp-learner:`

```
jp-learner:progress         → { [cardId: string]: CardProgress }
jp-learner:settings         → { defaultSessionSize: number, showSwipeAssist: boolean, showFurigana: boolean }
jp-learner:custom-data      → { datasets: { [datasetId: string]: Dataset } }
jp-learner:test-modes:*     → saved test mode selections per category
jp-learner:study-plan:*     → daily learning plans per dataset
```

---

## 8. Dataset Management (CRUD)

### 8.1 Data Storage Strategy

- New localStorage key: `jp-learner:custom-data`
- Stores a `CustomDataStore` with a `datasets` record of user-managed datasets
- **Built-in datasets** (from `data/*.json`): remain unchanged until modified. When a user edits/adds/deletes items in a built-in dataset, the entire dataset is copied to localStorage. From that point on, the local copy is used instead of the built-in one.
- **Custom datasets**: entirely user-created, stored only in localStorage
- A "還原預設" (reset to default) option is available for modified built-in datasets

### 8.2 Category Support

- Users can create datasets of any category: vocabulary, grammar, or mix
- Mix datasets allow adding both vocab and grammar items via a type selector in the item form
- Items in mix datasets show type badges (詞/文) on the edit page

### 8.3 Integration Points

- **HomePage**: "+ 新增學習集" button above dataset list; edit icon on each DatasetCard
- **SetupPage**: "管理" link next to dataset name header
- **LearnPage**: edit and delete buttons below each card during browsing

---

## 9. Settings

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| 深色模式 | CSS class toggle | system | Toggle dark/light theme |
| 滑動提示 | `showSwipeAssist` | `true` | Show color overlay + label text on card during swipe gestures |
| 日文標假名 | `showFurigana` | `false` | Render hiragana ruby above kanji in Japanese sentences (kuroshiro + kuromoji, lazy-loaded) |

---

## 10. Testing

### 10.1 Unit Tests (Vitest)

Tests live alongside source in `src/**/*.test.ts(x)` and `src/**/__tests__/*.test.ts(x)`:
- SM-2 algorithm, grammar parsing, flashcard building, shuffle, storage, stats
- Mix category: type guards, mode filtering, card building, multi-mode stats
- Hooks: useDatasetCrud (including mix), useSwipe, useSettings

### 10.2 E2E Tests (Playwright)

Tests in `e2e/`. Global setup copies fixture data (`test-vocab.json`, `test-grammar.json`, `test-mix.json`) from `e2e/fixtures/` into `data/` before tests.

Test suites: home, learn, manage, mix, mobile, navigation, pronunciation, settings, setup, study, swipe.

---

## 11. Google Drive Sync

### 11.1 Overview

Client-side Google Drive sync using Google Identity Services (GIS) OAuth2 token flow. No backend required — all auth and API calls happen in the browser via raw `fetch()` to Drive API v3.

### 11.2 Architecture

```
SettingsPage → SyncSection UI → useGoogleSync hook → syncEngine.ts → driveApi.ts → GIS auth (gis.ts)
```

### 11.3 Drive Folder Structure

```
Google Drive Root/
  Japanese Learner/
    progress.json        ← jp-learner:progress
    custom-data.json     ← jp-learner:custom-data
    settings.json        ← jp-learner:settings
    test-modes.json      ← jp-learner:test-mode
    study-plans.json     ← all jp-learner:study-plan-* keys consolidated
```

### 11.4 Sync Behavior

- **Auto-pull on app load** (if connected): download from cloud → overwrite local → page reload
- **Auto-push on data change** (if connected): debounced 30s push after any localStorage write
- **Manual sync from cloud**: pull → reload
- **Manual push to cloud**: push current local data
- **First connect**: pull (empty cloud) → push (upload local as initial state)
- **Conflict resolution**: cloud wins (cloud overwrites local on pull)

### 11.5 Auth & Token Management

- GIS script loaded lazily (only on first sync interaction)
- OAuth2 browser flow: no refresh tokens; on expiry, user clicks sign-in again (consent remembered)
- Auth state persisted to `jp-learner:google-auth` in localStorage
- Sync metadata (folderId, fileIds) persisted to `jp-learner:sync-meta`

### 11.6 Environment Setup

Requires `VITE_GOOGLE_CLIENT_ID` environment variable. See `.env.example`.

## 12. Progressive Web App (PWA)

The app is installable to iOS/Android/desktop home screens. Implemented with `vite-plugin-pwa` (Workbox under the hood).

### 12.1 Manifest & Registration
- Manifest is generated at build time from `vite.config.ts` (`VitePWA` plugin): `name`, `short_name`, `theme_color: #2563eb`, `background_color: #ffffff`, `display: standalone`, `start_url`/`scope` scoped to `/japanese-learner/`, `orientation: portrait`, `lang: zh-Hant`.
- Icons: `pwa-192x192.png`, `pwa-512x512.png`, and a `pwa-maskable-512x512.png` (maskable purpose) for Android adaptive icons.
- Service worker: `registerType: 'autoUpdate'` — clients auto-update on next load. Registered in `src/main.tsx` via `registerSW({ immediate: true })` (types from `vite-plugin-pwa/client` added to `tsconfig.app.json`).
- Workbox precaches all build assets (`globPatterns: **/*.{js,css,html,svg,png,ico,json,woff2}`) with `navigateFallback: /japanese-learner/index.html` to serve SPA routes offline.

### 12.2 iOS Integration
- `index.html` declares `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=default`, `apple-mobile-web-app-title=日語卡`, and an `apple-touch-icon` link to `apple-touch-icon-180.png` (180×180, required by iOS).
- `Layout.tsx` applies `env(safe-area-inset-top/left/right/bottom)` padding so the sticky header and main content respect the notch/home-indicator in standalone mode.
- `index.css` adds `-webkit-tap-highlight-color: transparent`, `-webkit-text-size-adjust: 100%`, and `overscroll-behavior-y: none` for a cleaner standalone experience.
- iOS-only caveat: install happens via Safari Share → "Add to Home Screen" (no install prompt). localStorage may be evicted after ~7 days of no use; Google Drive Sync serves as an off-device backup.

### 12.3 Icon Pipeline
- Sources: `scripts/icons/icon.svg` (standard, rounded background) and `scripts/icons/icon-maskable.svg` (full-bleed for Android adaptive icons with ~80% safe zone).
- Regenerate with `scripts/icons/generate.sh` (uses macOS `sips`) — writes `favicon.svg`, `apple-touch-icon-180.png`, `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png` into `public/`.
