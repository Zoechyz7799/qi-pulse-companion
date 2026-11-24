/**
 * Pet poses, image swaps, and motion.
 * Knows which picture to show for a phase. Does not know durations.
 */

import { PHASE } from "./tracking-config.js";

const SEQUENCES = {
  [PHASE.idle]: [
    { file: "idle-stand.svg", hold: 2600 },
    { file: "idle-blink.svg", hold: 140, cut: true },
    { file: "idle-stand.svg", hold: 2200, cut: true },
    { file: "idle-soft.svg", hold: 2400 },
    { file: "idle-blink.svg", hold: 140, cut: true },
  ],
  [PHASE.running]: [
    { file: "work-1.svg", hold: 460 },
    { file: "work-2.svg", hold: 420 },
    { file: "work-3.svg", hold: 400 },
    { file: "work-2.svg", hold: 380 },
  ],
  [PHASE.alert]: [{ file: "alert-wave.svg", hold: 0 }],
};

function poseUrl(file) {
  const base = import.meta.env.BASE_URL ?? "./";
  return `${base}poses/${file}`;
}

export function createPoseWorker(rig) {
  const images = [...rig.querySelectorAll(".pet-img")];
  let phase = PHASE.idle;
  let frameIndex = 0;
  let shown = images.findIndex((img) => img.classList.contains("is-on"));
  if (shown < 0) shown = 0;
  let timer = 0;
  let entered = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  for (const sequence of Object.values(SEQUENCES)) {
    for (const frame of sequence) {
      const preload = new Image();
      preload.src = poseUrl(frame.file);
    }
  }

  function showFrame(forceCut = false) {
    const sequence = SEQUENCES[phase];
    const frame = sequence[frameIndex % sequence.length];
    const src = poseUrl(frame.file);
    const current = images[shown];
    if (current.getAttribute("src") === src && current.classList.contains("is-on")) return;
    const cut = forceCut || frame.cut;
    if (cut) rig.classList.add("is-cut");
    const nextIndex = shown ^ 1;
    const next = images[nextIndex];
    next.src = src;
    next.classList.add("is-on");
    current.classList.remove("is-on");
    shown = nextIndex;
    if (cut) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => rig.classList.remove("is-cut"));
      });
    }
  }

  function schedule() {
    window.clearTimeout(timer);
    const sequence = SEQUENCES[phase];
    const frame = sequence[frameIndex % sequence.length];
    if (!frame || sequence.length < 2 || frame.hold <= 0) return;
    timer = window.setTimeout(() => {
      frameIndex = (frameIndex + 1) % sequence.length;
      showFrame();
      schedule();
    }, frame.hold);
  }

  function updateMotion(forcePeek) {
    rig.dataset.phase = phase;
    if (phase !== PHASE.idle) rig.classList.remove("is-floating");
    if (phase === PHASE.alert) {
      if (forcePeek) {
        rig.classList.remove("is-peek");
        void rig.offsetWidth;
      }
      rig.classList.add("is-peek");
      return;
    }
    rig.classList.remove("is-peek");
    if (phase === PHASE.idle && (entered || reduce)) rig.classList.add("is-floating");
  }

  function setPhase(next) {
    if (next === phase) return;
    phase = next;
    frameIndex = 0;
    updateMotion(next === PHASE.alert);
    showFrame(true);
    schedule();
  }

  function replayAlert() {
    phase = PHASE.alert;
    frameIndex = 0;
    updateMotion(true);
    showFrame(true);
    schedule();
  }

  function setLabel(text) {
    rig.setAttribute("aria-label", text);
  }

  rig.addEventListener("animationend", (event) => {
    if (event.target !== rig || event.animationName !== "crawl-in") return;
    entered = true;
    if (phase === PHASE.idle) rig.classList.add("is-floating");
  });

  if (reduce) {
    entered = true;
    rig.classList.add("is-floating");
  }

  showFrame();
  schedule();

  return { setPhase, replayAlert, setLabel };
}
