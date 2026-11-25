/**
 * Contest-derived 健身气功·易筋經 twelve-stance practice set + card progress.
 * Source sequence: Zoechyz7799/qihuang-yiyuan courses.js (D.lessons).
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

const SOURCE = Object.freeze({
  zh: "健身气功·易筋经 · 国家体育总局",
  en: "Health Qigong · Yi Jin Jing · General Administration of Sport of China",
});

const DUR = Object.freeze({ prep: 4000, hold: 6000, breathe: 6000, rest: 3000 });

/**
 * @param {object} spec
 * @returns {Segment}
 */
function move(spec) {
  return Object.freeze({
    id: spec.id,
    title: Object.freeze(spec.title),
    cue: Object.freeze(spec.cue),
    points: Object.freeze(spec.points.map((p) => Object.freeze(p))),
    source: Object.freeze(spec.source || SOURCE),
    effect: Object.freeze(spec.effect),
    pose: spec.pose,
    durationsMs: Object.freeze({ ...DUR }),
  });
}

/** @type {MoveSet} */
export const SAMPLE_SET = Object.freeze({
  id: "yijinjing-12",
  title: Object.freeze({ zh: "健身气功·易筋经十二势", en: "Health Qigong · Yi Jin Jing (12 Forms)" }),
  segments: Object.freeze([
    move({
      id: "wei1",
      title: { zh: "韦驮献杵第一势", en: "Wei Tuo Presents the Pestle I" },
      cue: {
        zh: "合掌静立。从安静的站立开始，留意肩膀是否放松。",
        en: "Standing prayer palms. Begin quietly and notice if the shoulders can soften.",
      },
      points: [
        { zh: "松肩，回到舒适的起始位置。", en: "Soften the shoulders; return to a comfortable start." },
        { zh: "两手缓缓来到胸前，轻轻合掌；腋下留出空间。", en: "Bring the hands to the chest and join the palms lightly; leave space under the arms." },
        { zh: "保持肩膀放松，手掌轻合，自然呼吸。", en: "Keep the shoulders soft and palms lightly joined; breathe naturally." },
      ],
      effect: {
        zh: "安定心神，唤醒肩背，为整套练习做好预备。",
        en: "Settles the mind, wakes the upper back, and prepares the whole set.",
      },
      pose: "idle.webp",
    }),
    move({
      id: "wei2",
      title: { zh: "韦驮献杵第二势", en: "Wei Tuo Presents the Pestle II" },
      cue: {
        zh: "展臂平撑。展开双臂，感受身体两侧的空间。",
        en: "Open the arms level with the shoulders and feel the space at your sides.",
      },
      points: [
        { zh: "两手回到胸前，自然呼吸。", en: "Return the hands to the chest; breathe naturally." },
        { zh: "双臂慢慢向两侧展开，与肩大致同高，避免耸肩。", en: "Open the arms to the sides near shoulder height; avoid shrugging." },
        { zh: "保持两侧舒展，缓缓收回双手。", en: "Keep both sides open, then draw the hands back slowly." },
      ],
      effect: {
        zh: "打开胸廓与肩带，缓解久坐缩肩。",
        en: "Opens the chest and shoulder girdle after long sitting.",
      },
      pose: "sway.webp",
    }),
    move({
      id: "wei3",
      title: { zh: "韦驮献杵第三势", en: "Wei Tuo Presents the Pestle III" },
      cue: {
        zh: "双掌上托。托举时留意向上伸展，收回时体会放松。",
        en: "Lift both palms overhead; notice the upward length, then the soft return.",
      },
      points: [
        { zh: "双手准备向上托举。", en: "Prepare to lift both palms upward." },
        { zh: "双掌慢慢举到头顶上方；站姿可轻提脚跟，先保持平衡。", en: "Raise the palms above the crown; heels may lift lightly if balance allows." },
        { zh: "脚跟轻落，双手缓缓收回。", en: "Lower the heels and draw the hands back slowly." },
      ],
      effect: {
        zh: "延展侧腰与肩臂，提升呼吸空间。",
        en: "Lengthens the side body and arms; widens the breath.",
      },
      pose: "ball.webp",
    }),
    move({
      id: "star",
      title: { zh: "摘星换斗势", en: "Plucking Stars / Moving the Dipper" },
      cue: {
        zh: "左右摘星。左右交替时，观察两边动作节奏是否一致。",
        en: "Alternate sides as if plucking stars; match the rhythm left and right.",
      },
      points: [
        { zh: "一手向上伸展，另一手轻放身后；轻缓转动，避免挺腹。", en: "One arm reaches up, the other rests lightly behind; turn gently without thrusting the belly." },
        { zh: "放松回正，准备换侧。", en: "Release back to center, then switch sides." },
        { zh: "换另一侧向上伸展，再缓缓回到正中。", en: "Reach on the other side, then return slowly to center." },
      ],
      effect: {
        zh: "协调左右侧链，活动肩胸与脊柱旋转。",
        en: "Balances both sides and mobilizes the shoulders and spine.",
      },
      pose: "sway.webp",
    }),
    move({
      id: "pull",
      title: { zh: "倒拽九牛尾势", en: "Pulling Nine Oxen by Their Tails" },
      cue: {
        zh: "前后牵引。名字有力量感，练习时仍需要松柔。",
        en: "Front-back traction: keep the power soft and even.",
      },
      points: [
        { zh: "一脚前出成舒适弓步，双臂前后牵引；保留余力。", en: "Step into a comfortable bow stance; draw the arms front and back without forcing." },
        { zh: "松肩回到起始位置。", en: "Soften the shoulders and return to start." },
        { zh: "换侧弓步，缓缓转动双臂。", en: "Switch sides and rotate the arms slowly." },
      ],
      effect: {
        zh: "稳定下肢，疏通肩臂前后力线。",
        en: "Steadies the legs and clears front–back arm lines.",
      },
      pose: "laptop.webp",
    }),
    move({
      id: "push",
      title: { zh: "出爪亮翅势", en: "Showing Talons and Spreading Wings" },
      cue: {
        zh: "舒展推掌。向前推出，再缓缓收回。",
        en: "Push the palms forward, then draw them back with ease.",
      },
      points: [
        { zh: "双手来到胸前，松肩，自然吸气。", en: "Bring the hands to the chest; soften the shoulders on the inhale." },
        { zh: "双掌缓缓向前推开，推掌时松肩，避免屏气用力。", en: "Push the palms forward softly; do not hold the breath." },
        { zh: "保持舒适的前伸，再缓缓收回双掌。", en: "Stay in a comfortable reach, then retract the palms." },
      ],
      effect: {
        zh: "伸展胸背，释放肩颈紧绷。",
        en: "Opens the chest and back; eases neck and shoulder tension.",
      },
      pose: "wave.webp",
    }),
    move({
      id: "knife",
      title: { zh: "九鬼拔马刀势", en: "Nine Ghosts Drawing Swords" },
      cue: {
        zh: "绕臂展肩。先记住路线，再体会手臂与躯干的配合。",
        en: "Circle the arms to open the shoulders; learn the path, then the torso link.",
      },
      points: [
        { zh: "一手绕到头后，另一手轻贴背部；手臂到舒适位置即可。", en: "One arm arcs behind the head, the other rests on the back; stay in a comfortable range." },
        { zh: "松肩回正，准备换侧；转头幅度放小。", en: "Soften back to center; keep the head turn small." },
        { zh: "换侧缓缓绕臂，轻轻放下双臂。", en: "Circle on the other side, then lower both arms." },
      ],
      effect: {
        zh: "活动肩袖与上背，改善僵硬转体。",
        en: "Mobilizes the rotator cuff and upper back.",
      },
      pose: "ball.webp",
    }),
    move({
      id: "squat",
      title: { zh: "三盘落地势", en: "Three Plates Falling to the Ground" },
      cue: {
        zh: "起落有序。升起与落下都有节奏，先找适合自己的蹲起幅度。",
        en: "Rise and sink with rhythm; choose a squat depth that stays steady.",
      },
      points: [
        { zh: "双脚适当分开，双臂展开。", en: "Feet apart, arms open." },
        { zh: "缓缓屈膝，双掌下按；膝盖沿脚尖方向。", en: "Bend the knees slowly as palms press down; knees track over the toes." },
        { zh: "稳定重心，缓缓起身，双手收回。", en: "Keep the center steady, then rise and draw the hands in." },
      ],
      effect: {
        zh: "强化下肢与核心，培养可控的起落节奏。",
        en: "Strengthens legs and core with controlled rise and sink.",
      },
      pose: "sleep.webp",
    }),
    move({
      id: "claw",
      title: { zh: "青龙探爪势", en: "Black Dragon Searching for Claws" },
      cue: {
        zh: "转身探掌。用手臂路径连接转身和回正。",
        en: "Turn and reach as a dragon’s claw; link the turn with the return.",
      },
      points: [
        { zh: "向一侧转体探掌，再缓缓向下划弧；重心保持稳定。", en: "Turn to one side and reach, then arc downward; keep the center steady." },
        { zh: "缓缓回正。", en: "Return slowly to center." },
        { zh: "换侧转体探掌，松肩回正。", en: "Repeat on the other side, then soften back to center." },
      ],
      effect: {
        zh: "活动腰胯旋转，疏通侧身与肩臂。",
        en: "Mobilizes waist rotation and the side body.",
      },
      pose: "sway.webp",
    }),
    move({
      id: "tiger",
      title: { zh: "卧虎扑食势", en: "Tiger Springing on Its Prey" },
      cue: {
        zh: "弓步俯身。前后重心变化更明显，先看清路线。",
        en: "Bow-stance fold forward; learn the weight shift before going deep.",
      },
      points: [
        { zh: "一脚前出，缓缓俯身向前下方伸手；幅度以稳定舒适为准。", en: "Step forward and fold toward the front corner within a stable range." },
        { zh: "松肩回到起始。", en: "Soften and return to start." },
        { zh: "换侧弓步，轻缓前伸。", en: "Switch sides and reach forward lightly." },
      ],
      effect: {
        zh: "锻炼前后重心转换，拉伸后链与肩。",
        en: "Trains front–back weight shift; lengthens the back line and shoulders.",
      },
      pose: "laptop.webp",
    }),
    move({
      id: "bow",
      title: { zh: "打躬势", en: "Bowing Down" },
      cue: {
        zh: "缓缓前屈。把一次前屈拆成缓慢的小过程，起身也留出时间。",
        en: "Fold forward in small, slow pieces; rise with the same patience.",
      },
      points: [
        { zh: "双手轻放头后，准备前屈。", en: "Rest the hands lightly behind the head." },
        { zh: "上体缓慢前屈，双肘自然展开；按舒适范围前屈。", en: "Fold the torso slowly with elbows soft; stay in a comfortable range." },
        { zh: "停留在舒适位置，慢慢起身回正。", en: "Pause where it feels easeful, then rise back to standing." },
      ],
      effect: {
        zh: "放松腰背与后侧肌群，带回安静收束。",
        en: "Releases the back body and returns to quiet close.",
      },
      pose: "sleep.webp",
    }),
    move({
      id: "tail",
      title: { zh: "掉尾势", en: "Swinging the Tail" },
      cue: {
        zh: "轻缓摆转。在整套接近结束时，继续把动作做得从容。",
        en: "Gentle side swings as the set closes — keep every move unhurried.",
      },
      points: [
        { zh: "缓缓前俯，双手下垂，轻向一侧摆转；幅度放小。", en: "Fold slightly, arms hanging, and sway gently to one side." },
        { zh: "慢慢回正。", en: "Return slowly to center." },
        { zh: "轻向另一侧摆转，慢慢起身，准备收势。", en: "Sway to the other side, then rise and prepare to close." },
      ],
      effect: {
        zh: "松解腰骶，平稳过渡到收势。",
        en: "Softens the low back and eases into the closing.",
      },
      pose: "wave.webp",
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
 * Award fragment cards per practiced segment. Complete card only when all moves are done.
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
      ? "All twelve forms practiced — the Yi Jin Jing set card is complete."
      : "十二势皆练完，易筋经整套招式卡完成。"
    : segment?.cue[lang] || segment?.cue.zh || "";
  const points = isSet
    ? set.segments.map((s) => s.title[lang] || s.title.zh)
    : (segment?.points || []).map((p) => p[lang] || p.zh);
  const source = isSet ? SOURCE[lang] || SOURCE.zh : segment?.source[lang] || segment?.source.zh || "";
  const effect = isSet
    ? lang === "en"
      ? "A full Yi Jin Jing pass: settle, open, lengthen, and close with ease."
      : "完整易筋经一遍：安定、开展、延展与从容收势。"
    : segment?.effect[lang] || segment?.effect.zh || "";
  const image = isSet ? "wave.webp" : segment?.pose || "idle.webp";
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
