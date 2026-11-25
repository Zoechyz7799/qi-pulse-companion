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
      durationsMs: Object.freeze({ prep: 3000, hold: 5000, breathe: 6000, rest: 2000 }),
    }),
    Object.freeze({
      id: "seg-reach",
      title: Object.freeze({ zh: "向上延展", en: "Upward reach" }),
      cue: Object.freeze({
        zh: "雙手緩緩上舉，肋側拉開，視線可隨手。",
        en: "Reach up slowly; lengthen the side body; eyes may follow the hands.",
      }),
      durationsMs: Object.freeze({ prep: 3000, hold: 6000, breathe: 6000, rest: 2000 }),
    }),
    Object.freeze({
      id: "seg-fold",
      title: Object.freeze({ zh: "前屈放鬆", en: "Forward fold" }),
      cue: Object.freeze({
        zh: "膝微彎，軀幹鬆垂，頭部放鬆。",
        en: "Soft knees; fold forward; let the head hang heavy.",
      }),
      durationsMs: Object.freeze({ prep: 3000, hold: 5000, breathe: 5000, rest: 2000 }),
    }),
  ]),
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
    next.cards[cardId] = {
      fragment: true,
      complete: Boolean(prev.complete) || Boolean(session.finished),
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
      ? "Full set complete"
      : "整套完成"
    : segment?.cue[lang] || segment?.cue.zh || "";
  return {
    setId: set.id,
    segmentId,
    title,
    cue,
    kind: cardState.complete ? "complete" : "fragment",
    lang,
  };
}
