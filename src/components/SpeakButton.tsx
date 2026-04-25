import { useEffect, useRef, useState } from "react";

interface SpeakButtonProps {
  text: string;
  size?: "sm" | "md";
  /** Suffix appended to the aria-label so screen-reader users can distinguish multiple buttons on the same view. */
  label?: string;
}

// Known female Japanese voices across platforms.
// Apple: Kyoko. Windows: Haruka/Ayumi/Sayaka/Nanami/Aoi. Android: often labelled "ja-JP-female" or named female voices.
const FEMALE_NAMES = /kyoko|haruka|ayumi|sayaka|nanami|aoi|mizuki|female/i;
// Known male Japanese voices to avoid. "Google 日本語" is male on most Chrome installs.
const MALE_NAMES = /otoya|ichiro|hattori|ken|keita|takumi|google|male/i;

interface VoiceChoice {
  voice: SpeechSynthesisVoice | undefined;
  /** True when we fell back to a non-female voice; consumer should pitch-shift to feminize. */
  needsPitchBoost: boolean;
}

function pickFemaleJapaneseVoice(): VoiceChoice {
  const japaneseVoices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("ja"));
  if (japaneseVoices.length === 0) return { voice: undefined, needsPitchBoost: false };
  const female = japaneseVoices.find((v) => FEMALE_NAMES.test(v.name));
  if (female) return { voice: female, needsPitchBoost: false };
  const nonMale = japaneseVoices.find((v) => !MALE_NAMES.test(v.name));
  if (nonMale) return { voice: nonMale, needsPitchBoost: false };
  // Only male voices available — pitch-shift to feminize.
  return { voice: japaneseVoices[0], needsPitchBoost: true };
}

export default function SpeakButton({ text, size = "md", label }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const choiceRef = useRef<VoiceChoice>({ voice: undefined, needsPitchBoost: false });

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const update = () => {
      choiceRef.current = pickFemaleJapaneseVoice();
    };
    update();
    window.speechSynthesis.addEventListener?.("voiceschanged", update);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", update);
    };
  }, []);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card flip
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    // Explicitly pick a Japanese voice so iOS doesn't fall back to the
    // system-language voice (e.g. Chinese) when lang alone is insufficient.
    // Prefer a female voice; voices may load async, so re-check on click as a fallback.
    const choice = choiceRef.current.voice ? choiceRef.current : pickFemaleJapaneseVoice();
    if (choice.voice) utterance.voice = choice.voice;
    if (choice.needsPitchBoost) utterance.pitch = 1.5;
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
      aria-label={label ? `播放發音：${label}` : "播放發音"}
    >
      <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    </button>
  );
}
