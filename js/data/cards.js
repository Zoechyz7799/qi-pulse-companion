/**
 * Sample move-set / card structure. Content is placeholder.
 * Progress is persisted separately via localStorage helpers.
 */

/** @typedef {{ zh: string, en: string }} Localized */

/**
 * @typedef {object} Segment
 * @property {string} id
 * @property {Localized} title
 * @property {Localized} cue
 * @property {Localized[]} points
 * @property {Localized} source
 * @property {Localized} effect
 * @property {string} pose
 * @property {{ prep: number, hold: number, breathe: number, rest: number }} durationsMs
 */

/**
 * @typedef {object} MoveSet
 * @property {string} id
 * @property {Localized} title
 * @property {Segment[]} segments
 */

/** @type {MoveSet} */
export const SAMPLE_SET = Object.freeze({
  id: "set-demo-1",
  title: Object.freeze({ zh: "氣脈舒展·示例", en: "Qi Stretch · Sample" }),
  segments: Object.freeze([
    Object.freeze({
      id: "seg-open",
      title: Object.freeze({ zh: "開場站立", en: "Standing open" }),
      cue: Object.freeze({
        zh: "雙腳與肩同寬，肩鬆、頂心上提。",
        en: "Feet under shoulders; soften the shoulders, lift the crown.",
      }),
      points: Object.freeze([
        Object.freeze({ zh: "腳掌均勻著地", en: "Weight even through both feet" }),
        Object.freeze({ zh: "肩胛輕微下沉", en: "Softly drop the shoulder blades" }),
        Object.freeze({ zh: "視線平遠", en: "Gaze soft and level" }),
      ]),
      source: Object.freeze({ zh: "氣脈陪練 · 基礎架", en: "Qi-Pulse · foundation stance" }),
      effect: Object.freeze({
        zh: "安定氣息，鬆開肩頸緊繃。",
        en: "Settles the breath; eases neck and shoulder tension.",
      }),
      pose: "idle.webp",
      durationsMs: Object.freeze({ prep: 3000, hold: 5000, breathe: 6000, rest: 2000 }),
    }),
    Object.freeze({
      id: "seg-reach",
      title: Object.freeze({ zh: "向上延展", en: "Upward reach" }),
      cue: Object.freeze({
        zh: "雙手緩緩上舉，肋側拉開，視線可隨手。",
        en: "Reach up slowly; lengthen the side body; eyes may follow the hands.",
      }),
      points: Object.freeze([
        Object.freeze({ zh: "肘微彎不鎖死", en: "Keep a soft bend in the elbows" }),
        Object.freeze({ zh: "肋骨向兩側展開", en: "Widen the ribs sideways" }),
        Object.freeze({ zh: "腳跟仍紮地", en: "Heels stay rooted" }),
      ]),
      source: Object.freeze({ zh: "氣脈陪練 · 伸展線", en: "Qi-Pulse · lengthening line" }),
      effect: Object.freeze({
        zh: "拉開側腰，舒緩久坐壓迫。",
        en: "Opens the side body after long sitting.",
      }),
      pose: "sway.webp",
      durationsMs: Object.freeze({ prep: 3000, hold: 6000, breathe: 6000, rest: 2000 }),
    }),
    Object.freeze({
      id: "seg-fold",
      title: Object.freeze({ zh: "前屈放鬆", en: "Forward fold" }),
      cue: Object.freeze({
        zh: "膝微彎，軀幹鬆垂，頭部放鬆。",
        en: "Soft knees; fold forward; let the head hang heavy.",
      }),
      points: Object.freeze([
        Object.freeze({ zh: "膝蓋允許彎曲", en: "Knees may stay bent" }),
        Object.freeze({ zh: "脊柱逐節下放", en: "Release the spine vertebra by vertebra" }),
        Object.freeze({ zh: "下巴鬆、頸後長", en: "Jaw soft, nape long" }),
      ]),
      source: Object.freeze({ zh: "氣脈陪練 · 放鬆收", en: "Qi-Pulse · soft close" }),
      effect: Object.freeze({
        zh: "釋放腰背，帶回安靜收束。",
        en: "Releases the back and returns to quiet close.",
      }),
      pose: "sleep.webp",
      durationsMs: Object.freeze({ prep: 3000, hold: 5000, breathe: 5000, rest: 2000 }),
    }),
  ]),
});

/** Stage pose clips for 起 / 停 / 收 guidance. */
export const STAGE_POSES = Object.freeze({
  prep: "idle.webp",
  hold: "laptop.webp",
  breathe: "sway.webp",
  rest: "wave.webp",
});

export const PROGRESS_KEY = "qimai-progress";
export const SETTINGS_KEY = "qimai-settings";

/**
 * @typedef {object} ProgressStore
 * @property {Record<string, boolean>} completedSegments
 * @property {Record<string, { fragment: boolean, complete: boolean, earnedAt?: number }>} cards
 * @property {{ date: string, durationMs: number, interrupts: number }} today
 */

/** @returns {ProgressStore} */
export function emptyProgress() {
  return {
    completedSegments: {},
    cards: {},
    today: { date: todayKey(), durationMs: 0, interrupts: 0 },
  };
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** @returns {ProgressStore} */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    const base = emptyProgress();
    const today = parsed?.today?.date === todayKey() ? parsed.today : base.today;
    return {
      completedSegments: { ...base.completedSegments, ...(parsed.completedSegments || {}) },
      cards: { ...base.cards, ...(parsed.cards || {}) },
      today,
    };
  } catch {
    return emptyProgress();
  }
}

/** @param {ProgressStore} progress */
export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* private mode */
  }
}

/**
 * Mark segments complete and award fragment / complete cards.
 * @param {ProgressStore} progress
 * @param {MoveSet} set
 * @param {string[]} segmentIds
 * @param {{ durationMs: number, interrupts: number, finished: boolean }} session
 */
export function applySession(progress, set, segmentIds, session) {
  const next = {
    completedSegments: { ...progress.completedSegments },
    cards: { ...progress.cards },
    today: { ...progress.today },
  };

  if (next.today.date !== todayKey()) {
    next.today = { date: todayKey(), durationMs: 0, interrupts: 0 };
  }
  next.today.durationMs += Math.max(0, session.durationMs || 0);
  next.today.interrupts += Math.max(0, session.interrupts || 0);

  for (const id of segmentIds) {
    next.completedSegments[id] = true;
    const cardId = `${set.id}:${id}`;
    const prev = next.cards[cardId] || { fragment: false, complete: false };
    const fullSegment = Boolean(session.finished);
    next.cards[cardId] = {
      fragment: true,
      complete: Boolean(prev.complete) || fullSegment,
      earnedAt: Date.now(),
    };
  }

  const allDone = set.segments.every((seg) => next.completedSegments[seg.id]);
  if (allDone) {
    const setCardId = `${set.id}:SET`;
    next.cards[setCardId] = {
      fragment: false,
      complete: true,
      earnedAt: Date.now(),
    };
    // Fragments glow into a complete set card — mark each segment complete.
    for (const seg of set.segments) {
      const cardId = `${set.id}:${seg.id}`;
      const prev = next.cards[cardId] || { fragment: true, complete: false };
      next.cards[cardId] = { ...prev, fragment: true, complete: true, earnedAt: Date.now() };
    }
  }

  return next;
}

/**
 * @param {MoveSet} set
 * @param {string} segmentId
 * @param {'zh'|'en'} lang
 * @param {{ fragment: boolean, complete: boolean }} cardState
 */
export function buildCardPayload(set, segmentId, lang, cardState) {
  const segment = set.segments.find((s) => s.id === segmentId);
  const isSet = segmentId === "SET";
  const title = isSet
    ? set.title[lang] || set.title.zh
    : segment?.title[lang] || segment?.title.zh || segmentId;
  const cue = isSet
    ? lang === "en"
      ? "Fragments gathered — the set glows complete."
      : "碎片齊聚，整套招式卡發光完成。"
    : segment?.cue[lang] || segment?.cue.zh || "";
  const points = isSet
    ? set.segments.map((s) => s.title[lang] || s.title.zh)
    : (segment?.points || []).map((p) => p[lang] || p.zh);
  const source = isSet
    ? lang === "en"
      ? "Qi-Pulse · full set"
      : "氣脈陪練 · 整套"
    : segment?.source[lang] || segment?.source.zh || "";
  const effect = isSet
    ? lang === "en"
      ? "Whole-set ease: breath, length, and soft close."
      : "整套舒展：呼吸、延展與柔和收束。"
    : segment?.effect[lang] || segment?.effect.zh || "";
  const image = isSet ? "wave.webp" : segment?.pose || "idle.webp";
  const kind = cardState.complete || isSet ? "complete" : "fragment";
  return {
    setId: set.id,
    segmentId,
    title,
    cue,
    points,
    source,
    effect,
    image,
    kind,
    lang,
  };
}

/**
 * @param {ProgressStore} progress
 * @param {MoveSet} set
 * @param {'zh'|'en'} lang
 */
export function listCollectedCards(progress, set, lang) {
  const items = [];
  for (const seg of set.segments) {
    const key = `${set.id}:${seg.id}`;
    const state = progress.cards[key];
    if (!state) continue;
    items.push(buildCardPayload(set, seg.id, lang, state));
  }
  const setKey = `${set.id}:SET`;
  if (progress.cards[setKey]) {
    items.push(buildCardPayload(set, "SET", lang, progress.cards[setKey]));
  }
  return items;
}

export function poseUrl(file) {
  return `./public/poses/${file}`;
}
