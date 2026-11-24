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

export const ENCOURAGEMENT_MS = 3500;

export const ENCOURAGEMENTS = {
  zh: [
    "你做得很好，繼續保持！",
    "每一次練習都是進步。",
    "慢慢來，你正在變得更好。",
    "今天的你比昨天更有力量。",
    "深呼吸，感受當下的平靜。",
    "你已經很棒了，繼續加油！",
    "堅持下去，改變正在發生。",
    "你的努力正在被看見。",
    "你就是自己的太陽，照亮著一切。",
  ],
  en: [
    "You're doing great, keep it up!",
    "Every practice is progress.",
    "Take it slow, you're getting better.",
    "Today's you is stronger than yesterday's.",
    "Take a deep breath, feel the calm of this moment.",
    "You're already amazing, keep going!",
    "Keep going, change is happening.",
    "Your effort is being seen.",
    "You are your own sun, illuminating everything.",
  ],
};

export function pickEncouragement(lines, previous = "", random = Math.random) {
  const choices = lines.filter((line) => line !== previous);
  const pool = choices.length > 0 ? choices : lines;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

const COPY = {
  zh: {
    tabFlash: "⏰ 時間到",
    min25: "25 分",
    min45: "45 分",
    demo: "10 秒",
    start: "開始",
    stop: "停止",
    dismiss: "知道了",
    running: "陪著",
    alertShort: "時間到",
    expand: "展開",
    collapse: "收起",
    notifyTitle: "時間到",
    hint: "雙擊看山，換一句鼓勵",
    petLabel: "劉看山。雙擊可立刻提醒。",
    presetsLabel: "時長",
    langLabel: "語言",
    noscript: "這個計時需要 JavaScript。",
  },
  en: {
    tabFlash: "⏰ Time's up",
    min25: "25 min",
    min45: "45 min",
    demo: "10 sec",
    start: "Start",
    stop: "Stop",
    dismiss: "Got it",
    running: "With you",
    alertShort: "Time's up",
    notifyTitle: "Time's up",
    expand: "Open",
    collapse: "Close",
    hint: "Double-click Kanshan for another line",
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
