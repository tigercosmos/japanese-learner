// ========== Dataset Types ==========

export interface VocabItem {
  id: string;
  japanese: string;
  hiragana: string;
  simple_chinese: string;
  full_explanation: string;
}

export interface GrammarExample {
  sentence: string; // Uses 【bracket】 notation for grammar parts
  chinese: string;
}

export interface GrammarItem {
  id: string;
  japanese: string;
  simple_chinese: string;
  full_explanation: string;
  examples: GrammarExample[];
}

export type DataItem = VocabItem | GrammarItem;

export interface Dataset<T extends DataItem = DataItem> {
  name: string;
  category: "vocabulary" | "grammar";
  level: string;
  data: T[];
}

export type VocabDataset = Dataset<VocabItem>;
export type GrammarDataset = Dataset<GrammarItem>;

// ========== Test Mode Types ==========

export type VocabTestMode = "kanji-to-chinese" | "hiragana-to-chinese" | "chinese-to-japanese" | "random";

export type GrammarTestMode =
  | "grammar-to-chinese"
  | "example-to-chinese"
  | "chinese-to-grammar"
  | "fill-in-grammar"
  | "random";

export type TestMode = VocabTestMode | GrammarTestMode;

export const VOCAB_TEST_MODES: { value: VocabTestMode; label: string; description: string }[] = [
  { value: "kanji-to-chinese", label: "漢字 → 中文", description: "看漢字，回想中文意思" },
  { value: "hiragana-to-chinese", label: "假名 → 中文", description: "看假名，回想中文意思" },
  { value: "chinese-to-japanese", label: "中文 → 日文", description: "看中文，回想日文寫法" },
  { value: "random", label: "隨機", description: "每張卡片隨機選擇模式" },
];

export const GRAMMAR_TEST_MODES: { value: GrammarTestMode; label: string; description: string }[] = [
  { value: "grammar-to-chinese", label: "文法 → 中文", description: "看文法句型，回想中文意思" },
  { value: "example-to-chinese", label: "例句 → 中文", description: "看例句（標記文法），回想中文意思" },
  { value: "chinese-to-grammar", label: "中文 → 文法", description: "看中文意思，回想日文文法" },
  { value: "fill-in-grammar", label: "填空 → 文法", description: "看挖空例句和中文翻譯，回想文法" },
  { value: "random", label: "隨機", description: "每張卡片隨機選擇模式" },
];

// ========== Flashcard Types ==========

export interface FlashcardContent {
  front: {
    primary: string;
    secondary?: string;
  };
  back: {
    primary: string;
    secondary?: string;
    detail?: string;
  };
}

// ========== SM-2 Progress Types ==========

export type Rating = "again" | "hard" | "good";

export const RATING_CONFIG: Record<Rating, { label: string; quality: number; color: string }> = {
  again: { label: "不會", quality: 1, color: "bg-red-500 hover:bg-red-600" },
  hard: { label: "還好", quality: 3, color: "bg-amber-500 hover:bg-amber-600" },
  good: { label: "記住了", quality: 5, color: "bg-emerald-500 hover:bg-emerald-600" },
};

export interface CardProgress {
  cardId: string;
  datasetId: string;
  easeFactor: number;    // default 2.5, min 1.3
  interval: number;      // days until next review
  repetitions: number;   // consecutive correct count
  nextReview: string;    // ISO date string
  lastRating: Rating;
}

export interface ProgressStore {
  [cardId: string]: CardProgress;
}

export interface SessionResult {
  total: number;
  good: number;
  hard: number;
  again: number;
  cards: { cardId: string; rating: Rating }[];
}

// ========== Dataset Metadata (for listing) ==========

export type SessionType = "due" | "random";

export interface DatasetMeta {
  id: string;             // filename-derived identifier
  name: string;
  category: "vocabulary" | "grammar";
  level: string;
  totalCards: number;
  dueCards: number;
  learnedCards: number;   // cards reviewed at least once
  masteredCards: number;  // cards with repetitions >= 3
}
