import { useState } from "react";

interface SpeakButtonProps {
  text: string;
  size?: "sm" | "md";
}

export default function SpeakButton({ text, size = "md" }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card flip / parent click handlers
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    // Explicitly pick a Japanese voice so iOS doesn't fall back to the
    // system-language voice (e.g. Chinese) when lang alone is insufficient.
    const japaneseVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("ja"));
    if (japaneseVoice) utterance.voice = japaneseVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const padding = size === "sm" ? "p-1" : "p-1.5";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={handleSpeak}
      className={`${padding} rounded-full transition-colors tap-active flex-shrink-0 ${
        speaking
          ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30"
          : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      aria-label="播放發音"
    >
      <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    </button>
  );
}
