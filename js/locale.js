/**
 * zh / en copy and language helpers. localStorage key: qimai-lang.
 */

const STORAGE_KEY = "qimai-lang";

export const ENCOURAGEMENTS = Object.freeze({
  zh: Object.freeze([
    "你做得很好，繼續保持！",
    "每一次練習都是進步。",
    "慢慢來，你正在變得更好。",
    "今天的你比昨天更有力量。",
    "深呼吸，感受當下的平靜。",
    "你已經很棒了，繼續加油！",
    "堅持下去，改變正在發生。",
    "你的努力正在被看見。",
    "你就是自己的太陽，照亮著一切。",
  ]),
  en: Object.freeze([
    "You're doing great, keep it up!",
    "Every practice is progress.",
    "Take it slow, you're getting better.",
    "Today's you is stronger than yesterday's.",
    "Take a deep breath, feel the calm of this moment.",
    "You're already amazing, keep going!",
    "Keep going, change is happening.",
    "Your effort is being seen.",
    "You are your own sun, illuminating everything.",
  ]),
});

const COPY = Object.freeze({
  zh: Object.freeze({
    brand: "氣脈陪練",
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
    hint: "雙擊看山，立刻提醒",
    petLabel: "劉看山。雙擊可立刻提醒。",
    presetsLabel: "時長",
    langLabel: "語言",
    noscript: "這個頁面需要 JavaScript。",
    goPractice: "開始練習",
    practiceTitle: "練習",
    disclaimerTitle: "練習前請注意",
    disclaimerBody:
      "本練習僅供自我放鬆與伸展參考，非醫療建議。如有不適請立即停止並諮詢專業人士。",
    disclaimerSkip: "跳過",
    disclaimerAccept: "我了解了",
    chooseMode: "選擇練習方式",
    modeSegment: "練這一段",
    modeFull: "連續練完整套",
    recommended: "推薦（未完成）",
    begin: "開始",
    phasePrep: "準備",
    phaseHold: "保持",
    phaseBreathe: "呼吸",
    phaseRest: "休息",
    breatheIn: "吸氣",
    breatheOut: "呼氣",
    progress: "進度",
    openCamera: "一鍵開啟本地攝像頭",
    closeCamera: "關閉攝像頭",
    cameraOffHint: "默認不開啟攝像頭。僅在你按下按鈕後才會請求權限。",
    cameraOnHint: "姿勢追蹤進行中。結束或離開頁面時會自動關閉。",
    cameraError: "無法開啟攝像頭",
    interrupt: "中斷本次",
    finish: "完成",
    doneTitle: "本輪結束",
    todayDuration: "今日時長",
    interruptCount: "中斷次數",
    cardFragment: "碎片卡",
    cardComplete: "完整卡",
    downloadCard: "下載圖片",
    backHome: "回桌寵",
    nextSegment: "下一段",
    minutesUnit: "分",
    secondsUnit: "秒",
  }),
  en: Object.freeze({
    brand: "Qi-Pulse",
    tabFlash: "⏰ Time's up",
    min25: "25 min",
    min45: "45 min",
    demo: "10 sec",
    start: "Start",
    stop: "Stop",
    dismiss: "Got it",
    running: "With you",
    alertShort: "Time's up",
    expand: "Open",
    collapse: "Close",
    notifyTitle: "Time's up",
    hint: "Double-click Kanshan to alert now",
    petLabel: "Kanshan. Double-click to alert now.",
    presetsLabel: "Length",
    langLabel: "Language",
    noscript: "This page needs JavaScript.",
    goPractice: "Practice",
    practiceTitle: "Practice",
    disclaimerTitle: "Before you begin",
    disclaimerBody:
      "This practice is for gentle stretch and relaxation only, not medical advice. Stop if you feel discomfort and seek professional care.",
    disclaimerSkip: "Skip",
    disclaimerAccept: "I understand",
    chooseMode: "Choose a mode",
    modeSegment: "This segment",
    modeFull: "Full set",
    recommended: "Suggested (incomplete)",
    begin: "Begin",
    phasePrep: "Prep",
    phaseHold: "Hold",
    phaseBreathe: "Breathe",
    phaseRest: "Rest",
    breatheIn: "Inhale",
    breatheOut: "Exhale",
    progress: "Progress",
    openCamera: "Enable local camera",
    closeCamera: "Turn camera off",
    cameraOffHint: "Camera stays off by default. Permission is requested only when you press the button.",
    cameraOnHint: "Pose tracking is active. Tracks stop when you end or leave the page.",
    cameraError: "Could not open the camera",
    interrupt: "Interrupt",
    finish: "Finish",
    doneTitle: "Round complete",
    todayDuration: "Today",
    interruptCount: "Interrupts",
    cardFragment: "Fragment",
    cardComplete: "Complete card",
    downloadCard: "Download image",
    backHome: "Back to pet",
    nextSegment: "Next segment",
    minutesUnit: "min",
    secondsUnit: "sec",
  }),
});

export function getCopy(lang) {
  return COPY[lang] ?? COPY.zh;
}

export function loadLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* private mode */
  }
  return "zh";
}

export function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode */
  }
}

export function pickEncouragement(lines, previous = "", random = Math.random) {
  const choices = lines.filter((line) => line !== previous);
  const pool = choices.length > 0 ? choices : lines;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

export function speakEnglish(text) {
  if (!("speechSynthesis" in window) || !text) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.96;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech can be missing in headless sessions */
  }
}

export function unlockSpeech() {
  if (!("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore */
  }
}

export function cancelSpeech() {
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}
