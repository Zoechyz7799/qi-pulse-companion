/**
 * Wushu three-technique set + card progress helpers.
 * Progress is persisted via localStorage.
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
  id: "wushu-three",
  title: Object.freeze({ zh: "武術三式", en: "Wushu Three" }),
  segments: Object.freeze([
    Object.freeze({
      id: "ready-fists",
      title: Object.freeze({ zh: "并步對拳", en: "Ready Stance & Twin Fists" }),
      cue: Object.freeze({
        zh: "雙腳並立與肩同寬，雙手握拳收於腰間，目視前方。",
        en: "Feet together under the shoulders; fists at the waist; eyes forward.",
      }),
      points: Object.freeze([
        Object.freeze({
          zh: "雙腳並立與肩同寬，雙手握拳收於腰間，目視前方。",
          en: "Feet together under the shoulders; fists at the waist; eyes forward.",
        }),
      ]),
      source: Object.freeze({ zh: "長拳基本功", en: "Changquan fundamentals" }),
      effect: Object.freeze({
        zh: "穩定下盤，喚醒肩背。",
        en: "Steadies the base and wakes the shoulders and back.",
      }),
      pose: "idle.webp",
      durationsMs: Object.freeze({ prep: 3000, hold: 5000, breathe: 6000, rest: 2000 }),
    }),
    Object.freeze({
      id: "heroic-block",
      title: Object.freeze({ zh: "馬步架掌", en: "Heroic Overhead Block" }),
      cue: Object.freeze({
        zh: "馬步站穩，一手上架護頭，一手下按，核心收緊。",
        en: "Hold horse stance; one palm guards overhead, the other presses down; core tight.",
      }),
      points: Object.freeze([
        Object.freeze({
          zh: "馬步站穩，一手上架護頭，一手下按，核心收緊。",
          en: "Hold horse stance; one palm guards overhead, the other presses down; core tight.",
        }),
      ]),
      source: Object.freeze({ zh: "長拳/少林基本功", en: "Changquan / Shaolin basics" }),
      effect: Object.freeze({
        zh: "開肩、強化核心穩定。",
        en: "Opens the shoulders and strengthens core stability.",
      }),
      pose: "laptop.webp",
      durationsMs: Object.freeze({ prep: 3000, hold: 6000, breathe: 6000, rest: 2000 }),
    }),
    Object.freeze({
      id: "bow-push",
      title: Object.freeze({ zh: "弓步推掌", en: "Bow-Stance Palm Push" }),
      cue: Object.freeze({
        zh: "前弓後蹬，雙手向前推掌，腰腹發力。",
        en: "Front knee bent, rear leg drives; both palms push forward from the waist.",
      }),
      points: Object.freeze([
        Object.freeze({
          zh: "前弓後蹬，雙手向前推掌，腰腹發力。",
          en: "Front knee bent, rear leg drives; both palms push forward from the waist.",
        }),
      ]),
      source: Object.freeze({ zh: "長拳/太極推手基礎", en: "Changquan / Taiji push-hands base" }),
      effect: Object.freeze({
        zh: "拉伸髖部與肩，釋放久坐張力。",
        en: "Stretches hips and shoulders; eases desk tension.",
      }),
      pose: "sway.webp",
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

export function fragmentCount(progress, set) {
  return set.segments.filter((seg) => progress.completedSegments[seg.id]).length;
}

export function isSetComplete(progress, set) {
  return set.segments.every((seg) => progress.completedSegments[seg.id]);
}

/**
 * Award fragment cards per practiced segment. Complete card only when all three are done.
 * Single-segment finish never yields a complete card.
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
    // Segment techniques are always fragments — never complete on their own.
    next.cards[cardId] = {
      fragment: true,
      complete: false,
      earnedAt: Date.now(),
    };
  }

  if (isSetComplete(next, set)) {
    next.cards[`${set.id}:SET`] = {
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
 * @param {ProgressStore} [progress]
 */
export function buildCardPayload(set, segmentId, lang, cardState, progress) {
  const segment = set.segments.find((s) => s.id === segmentId);
  const isSet = segmentId === "SET";
  const total = set.segments.length;
  const earned = progress ? fragmentCount(progress, set) : cardState.complete ? total : 1;
  const title = isSet
    ? set.title[lang] || set.title.zh
    : segment?.title[lang] || segment?.title.zh || segmentId;
  const cue = isSet
    ? lang === "en"
      ? "All three techniques practiced — the set card is complete."
      : "三式皆練完，整套招式卡完成。"
    : segment?.cue[lang] || segment?.cue.zh || "";
  const points = isSet
    ? set.segments.map((s) => s.title[lang] || s.title.zh)
    : (segment?.points || []).map((p) => p[lang] || p.zh);
  const source = isSet
    ? lang === "en"
      ? "Changquan fundamentals · full set"
      : "長拳基本功 · 整套"
    : segment?.source[lang] || segment?.source.zh || "";
  const effect = isSet
    ? lang === "en"
      ? "Steadies the base, opens the shoulders, eases desk tension."
      : "穩定下盤、開肩、釋放久坐張力。"
    : segment?.effect[lang] || segment?.effect.zh || "";
  const image = isSet ? "wave.webp" : segment?.pose || "idle.webp";
  // Complete only for the SET card after all three (or full-set finish → all three marked).
  const kind = isSet && cardState.complete ? "complete" : "fragment";
  const kindLabel =
    kind === "complete"
      ? lang === "en"
        ? "Complete card"
        : "完整卡"
      : lang === "en"
        ? `Fragment ${Math.max(1, Math.min(earned, total))}/${total}`
        : `碎片卡 ${Math.max(1, Math.min(earned, total))}/${total}`;

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
    kindLabel,
    fragmentIndex: Math.max(1, Math.min(earned, total)),
    fragmentTotal: total,
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
    items.push(buildCardPayload(set, seg.id, lang, state, progress));
  }
  const setKey = `${set.id}:SET`;
  if (progress.cards[setKey]?.complete) {
    items.push(buildCardPayload(set, "SET", lang, progress.cards[setKey], progress));
  }
  return items;
}

/**
 * Pick the end-of-round card: Complete SET only when all three are done; else fragment.
 * @param {ProgressStore} progress
 * @param {MoveSet} set
 * @param {string[]} segmentIds
 * @param {'zh'|'en'} lang
 */
export function endCardForSession(progress, set, segmentIds, lang) {
  if (isSetComplete(progress, set) && progress.cards[`${set.id}:SET`]?.complete) {
    return buildCardPayload(set, "SET", lang, progress.cards[`${set.id}:SET`], progress);
  }
  const lastId = segmentIds.at(-1);
  if (!lastId) return null;
  const state = progress.cards[`${set.id}:${lastId}`] || { fragment: true, complete: false };
  return buildCardPayload(set, lastId, lang, state, progress);
}

export function poseUrl(file) {
  return `./public/poses/${file}`;
}
