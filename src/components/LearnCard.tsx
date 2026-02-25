import type { VocabItem, GrammarItem, DataItem } from "../types";
import GrammarHighlight from "./GrammarHighlight";

interface LearnCardProps {
  item: DataItem;
  category: "vocabulary" | "grammar";
}

function VocabLearnCard({ item }: { item: VocabItem }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      {/* Japanese */}
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-900">{item.japanese}</div>
        <div className="text-lg text-gray-500 mt-1">{item.hiragana}</div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Chinese meaning */}
      <div className="text-center">
        <div className="text-xl font-semibold text-blue-700">{item.simple_chinese}</div>
      </div>

      {/* Full explanation */}
      {item.full_explanation && (
        <>
          <div className="border-t border-gray-100" />
          <div className="text-sm text-gray-500 leading-relaxed">{item.full_explanation}</div>
        </>
      )}
    </div>
  );
}

function GrammarLearnCard({ item }: { item: GrammarItem }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      {/* Grammar pattern */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-900">{item.japanese}</div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Chinese meaning */}
      <div className="text-center">
        <div className="text-xl font-semibold text-blue-700">{item.simple_chinese}</div>
      </div>

      {/* Full explanation */}
      {item.full_explanation && (
        <>
          <div className="border-t border-gray-100" />
          <div className="text-sm text-gray-500 leading-relaxed">{item.full_explanation}</div>
        </>
      )}

      {/* Examples */}
      {item.examples && item.examples.length > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">例句</div>
            {item.examples.map((ex, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="text-base text-gray-900 leading-relaxed">
                  <GrammarHighlight sentence={ex.sentence} mode="highlight" />
                </div>
                <div className="text-sm text-gray-500 mt-1">{ex.chinese}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LearnCard({ item, category }: LearnCardProps) {
  if (category === "vocabulary") {
    return <VocabLearnCard item={item as VocabItem} />;
  }
  return <GrammarLearnCard item={item as GrammarItem} />;
}
