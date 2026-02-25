import type { Rating } from "../types";
import { RATING_CONFIG } from "../types";

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  visible: boolean;
}

const ratings: Rating[] = ["again", "hard", "good"];

export default function RatingButtons({ onRate, visible }: RatingButtonsProps) {
  if (!visible) return null;

  return (
    <div className="flex gap-3 mt-6 animate-[slideIn_0.2s_ease-out]">
      {ratings.map((rating) => {
        const config = RATING_CONFIG[rating];
        return (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            className={`flex-1 py-3 rounded-xl text-white font-semibold text-base transition-all tap-active ${config.color}`}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
