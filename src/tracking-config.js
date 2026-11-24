/** Durations, phase names, and copy. No timer behavior and no page access. */

export const PHASE = {
  idle: "idle",
  running: "running",
  alert: "alert",
};

export const PRESETS = [
  { id: "25", ms: 25 * 60 * 1000, labelKey: "min25" },
  { id: "45", ms: 45 * 60 * 1000, labelKey: "min45" },
  { id: "demo", ms: 10 * 1000, labelKey: "demo" },
];

export const DEFAULT_PRESET_ID = "25";

const COPY = {
  zh: {
    title: "氣脈陪練",
    min25: "25 分",
    min45: "45 分",
    demo: "10 秒",
    start: "開始",
    stop: "停止",
    dismiss: "知道了",
    running: "陪著",
    alertShort: "時間到",
    bubble: "這一輪滿了。起來活動一下。",
    notifyTitle: "氣脈陪練",
    notifyBody: "時間到了。起來動一動。",
    tabFlash: "⏰ 時間到 · 氣脈陪練",
    hint: "雙擊看山，立刻提醒",
    petLabel: "劉看山。雙擊可立刻提醒。",
    presetsLabel: "時長",
    langLabel: "語言",
    noscript: "這個計時需要 JavaScript。",
  },
  en: {
    title: "Qi Mai",
    min25: "25 min",
    min45: "45 min",
    demo: "10 sec",
    start: "Start",
    stop: "Stop",
    dismiss: "Got it",
    running: "With you",
    alertShort: "Time",
    bubble: "This round is full. Stand up and loosen your shoulders.",
    speak: "Time is up. Stand up and stretch.",
    notifyTitle: "Qi Mai",
    notifyBody: "Time is up. Stand up and stretch.",
    tabFlash: "⏰ Time · Qi Mai",
    hint: "Double-click Kanshan to alert",
    petLabel: "Kanshan. Double-click to alert now.",
    presetsLabel: "Length",
    langLabel: "Language",
    noscript: "This timer needs JavaScript.",
  },
};

export function getCopy(lang) {
  return COPY[lang] ?? COPY.zh;
}

export function presetById(id) {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
}
