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
    alertPractice: "要不要一起伸展一下",
    running: "陪著",
    alertShort: "時間到",
    expand: "展開",
    collapse: "收起",
    notifyTitle: "時間到",
    hint: "點看山進練習；雙擊立刻提醒",
    petLabel: "劉看山。點一下進練習，雙擊立刻提醒。",
    presetsLabel: "時長",
    langLabel: "語言",
    noscript: "這個頁面需要 JavaScript。",
    goPractice: "開始練習",
    dockActionsLabel: "快捷",
    practiceTitle: "練習",
    disclaimerTitle: "練習前請注意",
    disclaimerBody:
      "本練習僅供自我放鬆與伸展參考，非醫療建議。如有不適請立即停止並諮詢專業人士。\n\n攝像頭畫面僅在本機處理，不會上傳。可隨時關閉。",
    disclaimerSkip: "跳過",
    disclaimerAccept: "我了解了",
    chooseMode: "選擇練習方式",
    chooseSet: "選擇套路",
    modeSegment: "練這一段",
    modeFull: "連續練完整套",
    recommended: "推薦（未完成）",
    begin: "開始",
    phasePrep: "起",
    phaseHold: "停",
    phaseBreathe: "停",
    phaseRest: "收",
    stageRise: "起",
    stageHold: "停",
    stageClose: "收",
    breatheIn: "吸氣",
    breatheNatural: "自然呼吸",
    breatheOut: "呼氣",
    progress: "節奏",
    openCamera: "一鍵開啟本地攝像頭",
    closeCamera: "關閉攝像頭",
    cameraOffHint: "默認不開啟攝像頭。僅在你按下按鈕後才會請求權限。",
    cameraOnHint: "姿勢追蹤進行中。結束或離開頁面時會自動關閉。",
    cameraError: "攝像頭暫時用不了，沒關係——跟著看山的圖一起練就好。",
    cameraDenied: "沒有攝像頭權限也沒關係，繼續看圖引導即可。",
    cameraBusy: "攝像頭正被占用。你可以先跟著看山練習。",
    poseMissing: "還沒看到你，慢慢走進畫面就好。",
    coachOk: "達標",
    coachAdjust: "再調整",
    coachUnstable: "請調整位置，讓頭部、肩膀、肘部清晰可見",
    elbowEstimate: "肘部約 {deg}° · 攝像頭估算",
    interrupt: "中斷本次",
    finish: "完成",
    doneTitle: "本輪結束",
    todayDuration: "今日時長",
    interruptCount: "中斷次數",
    cardFragment: "碎片卡",
    cardComplete: "完整卡",
    cardPoints: "要點",
    cardSource: "出處",
    cardEffect: "功效 / 克制",
    memoryTitle: "回憶",
    memoryEmpty: "還沒有收集到招式卡。",
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
    alertPractice: "Let's practice",
    running: "With you",
    alertShort: "Time's up",
    expand: "Open",
    collapse: "Close",
    notifyTitle: "Time's up",
    hint: "Click Kanshan to practice; double-click to alert",
    petLabel: "Kanshan. Click to practice; double-click to alert now.",
    presetsLabel: "Length",
    langLabel: "Language",
    noscript: "This page needs JavaScript.",
    goPractice: "Practice",
    dockActionsLabel: "Shortcuts",
    practiceTitle: "Practice",
    disclaimerTitle: "Before you begin",
    disclaimerBody:
      "This practice is for gentle stretch and relaxation only, not medical advice. Stop if you feel discomfort and seek professional care.\n\nThe camera stays on this device. Nothing is uploaded. You can turn it off anytime.",
    disclaimerSkip: "Skip",
    disclaimerAccept: "I understand",
    chooseMode: "Choose a mode",
    chooseSet: "Choose a set",
    modeSegment: "This segment",
    modeFull: "Full set",
    recommended: "Suggested (incomplete)",
    begin: "Begin",
    phasePrep: "Rise",
    phaseHold: "Hold",
    phaseBreathe: "Hold",
    phaseRest: "Close",
    stageRise: "Rise",
    stageHold: "Hold",
    stageClose: "Close",
    breatheIn: "Inhale",
    breatheNatural: "Breathe naturally",
    breatheOut: "Exhale",
    progress: "Rhythm",
    openCamera: "Enable local camera",
    closeCamera: "Turn camera off",
    cameraOffHint: "Camera stays off by default. Permission is requested only when you press the button.",
    cameraOnHint: "Pose tracking is active. Tracks stop when you end or leave the page.",
    cameraError: "Camera isn't available right now — follow Kanshan's pictures instead.",
    cameraDenied: "No camera permission needed. Keep following the picture guide.",
    cameraBusy: "Camera is busy. You can still practice with Kanshan.",
    poseMissing: "Can't see you yet — ease into the frame when you're ready.",
    coachOk: "On target",
    coachAdjust: "Adjust again",
    coachUnstable: "Please adjust so your head, shoulders, and elbows are clearly visible",
    elbowEstimate: "Elbow ~{deg}° · camera estimate",
    interrupt: "Interrupt",
    finish: "Finish",
    doneTitle: "Round complete",
    todayDuration: "Today",
    interruptCount: "Interrupts",
    cardFragment: "Fragment",
    cardComplete: "Complete card",
    cardPoints: "Key points",
    cardSource: "Source",
    cardEffect: "Effect",
    memoryTitle: "Memory",
    memoryEmpty: "No collected cards yet.",
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

/**
 * Prefer natural zh-CN/zh-HK (~0.9–1.0) or en-US/en-GB (~0.9). Fail silently.
 * @param {string} text
 * @param {'zh'|'en'} [lang]
 */
export function speakText(text, lang = "zh") {
  if (!("speechSynthesis" in window) || !text) return;
  try {
    const utterance = new SpeechSynthesisUtterance(String(text));
    const voice = pickVoice(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === "en" ? "en-US" : "zh-CN";
    }
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech can be missing in headless sessions */
  }
}

/** @deprecated Prefer speakText(text, 'en') */
export function speakEnglish(text) {
  speakText(text, "en");
}

/**
 * @param {'zh'|'en'} lang
 */
export function unlockSpeech(lang = "en") {
  if (!("speechSynthesis" in window)) return;
  try {
    // Warm voices list (async on some browsers).
    window.speechSynthesis.getVoices();
    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    utterance.lang = lang === "en" ? "en-US" : "zh-CN";
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore */
  }
}

/**
 * @param {'zh'|'en'} lang
 * @returns {SpeechSynthesisVoice | null}
 */
function pickVoice(lang) {
  let voices = [];
  try {
    voices = window.speechSynthesis.getVoices() || [];
  } catch {
    return null;
  }
  if (!voices.length) return null;

  const prefer =
    lang === "en"
      ? ["en-US", "en-GB", "en_US", "en_GB", "en"]
      : ["zh-CN", "zh-HK", "zh-TW", "zh_CN", "zh_HK", "zh_TW", "cmn", "zh"];

  for (const code of prefer) {
    const hit = voices.find((v) => {
      const id = `${v.lang || ""}`.toLowerCase().replace("_", "-");
      const want = code.toLowerCase().replace("_", "-");
      return id === want || id.startsWith(`${want}-`) || id.startsWith(want);
    });
    if (hit) return hit;
  }

  if (lang === "en") {
    return voices.find((v) => /en/i.test(v.lang)) || null;
  }
  return voices.find((v) => /zh|cmn|chinese/i.test(`${v.lang} ${v.name}`)) || null;
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
