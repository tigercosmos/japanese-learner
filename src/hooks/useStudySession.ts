import { useState, useCallback, useMemo } from "react";
import type {
  DataItem,
  VocabItem,
  GrammarItem,
  TestMode,
  Rating,
  FlashcardContent,
  SessionResult,
} from "../types";
import type { LoadedDataset } from "./useDatasets";
import { useProgress } from "./useProgress";
import { isDue } from "../lib/sm2";
import { shuffle } from "../lib/shuffle";
import { buildVocabCard, buildGrammarCard } from "../lib/flashcard";

interface StudyCard {
  item: DataItem;
  flashcard: FlashcardContent;
  exampleIndex?: number;
}

export function useStudySession(
  dataset: LoadedDataset | undefined,
  mode: TestMode,
  sessionSize: number,
) {
  const { progress, rateCard } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<{ cardId: string; rating: Rating }[]>([]);
  const [requeue, setRequeue] = useState<StudyCard[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Build the initial card queue
  const initialCards: StudyCard[] = useMemo(() => {
    if (!dataset) return [];

    // Filter due cards and new cards
    const dueItems = dataset.data.filter((item) => isDue(progress[item.id]));
    const shuffled = shuffle(dueItems);
    const selected = shuffled.slice(0, sessionSize);

    return selected.map((item) => {
      const flashcard = buildCard(item, dataset.category, mode);
      return { item, flashcard };
    });
  // Only compute once on mount (deps intentionally exclude progress to avoid re-shuffle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset?.id, mode, sessionSize]);

  // Combined queue: initial cards + requeued cards
  const allCards = useMemo(() => [...initialCards, ...requeue], [initialCards, requeue]);

  const currentCard = allCards[currentIndex] as StudyCard | undefined;
  const totalCards = allCards.length;

  const flip = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const rate = useCallback(
    (rating: Rating) => {
      if (!currentCard || !dataset) return;

      const cardId = currentCard.item.id;
      rateCard(cardId, dataset.id, rating);
      setResults((prev) => [...prev, { cardId, rating }]);

      // Re-queue "again" cards
      if (rating === "again") {
        setRequeue((prev) => [...prev, currentCard]);
      }

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex >= allCards.length + (rating === "again" ? 1 : 0)) {
        // Check if this was the last card considering potential requeue
        if (nextIndex >= totalCards + (rating === "again" ? 1 : 0)) {
          setIsComplete(true);
        }
      }

      setCurrentIndex(nextIndex);
      setIsFlipped(false);
    },
    [currentCard, dataset, currentIndex, allCards.length, totalCards, rateCard],
  );

  // Check completion whenever currentIndex changes
  const isSessionComplete = isComplete || (currentIndex >= allCards.length && allCards.length > 0);

  const sessionResult: SessionResult = useMemo(() => {
    const good = results.filter((r) => r.rating === "good").length;
    const hard = results.filter((r) => r.rating === "hard").length;
    const again = results.filter((r) => r.rating === "again").length;
    return { total: results.length, good, hard, again, cards: results };
  }, [results]);

  return {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isSessionComplete,
    sessionResult,
    flip,
    rate,
  };
}

function buildCard(
  item: DataItem,
  category: "vocabulary" | "grammar",
  mode: TestMode,
): FlashcardContent {
  if (category === "vocabulary") {
    return buildVocabCard(item as VocabItem, mode as import("../types").VocabTestMode);
  } else {
    const grammarItem = item as GrammarItem;
    const exampleIndex =
      grammarItem.examples?.length > 0
        ? Math.floor(Math.random() * grammarItem.examples.length)
        : 0;
    return buildGrammarCard(
      grammarItem,
      mode as import("../types").GrammarTestMode,
      exampleIndex,
    );
  }
}
