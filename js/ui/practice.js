/**
 * Practice page UI layer. Wires practiceFSM + cameraFSM + cards + locale.
 */

import {
  createPracticeFSM,
  PRACTICE_MODE,
  PRACTICE_PHASE,
  PRACTICE_SCREEN,
} from "../core/practiceFSM.js";
import { createCameraFSM } from "../core/cameraFSM.js";
import {
  SAMPLE_SET,
  applySession,
  buildCardPayload,
  loadProgress,
  saveProgress,
} from "../data/cards.js";
import {
  cancelSpeech,
  getCopy,
  loadLang,
  saveLang,
  speakEnglish,
  unlockSpeech,
} from "../locale.js";
import { createPoseTracker } from "../../pose-worker.js";

export function bootPractice(root = document) {
  const langZh = root.querySelector("#lang-zh");
  const langEn = root.querySelector("#lang-en");
  const titleEl = root.querySelector("#practice-title");
  const screens = {
    disclaimer: root.querySelector("#screen-disclaimer"),
    choose: root.querySelector("#screen-choose"),
    active: root.querySelector("#screen-active"),
    done: root.querySelector("#screen-done"),
  };

  const disclaimerTitle = root.querySelector("#disclaimer-title");
  const disclaimerBody = root.querySelector("#disclaimer-body");
  const disclaimerSkip = root.querySelector("#disclaimer-skip");
  const disclaimerAccept = root.querySelector("#disclaimer-accept");

  const chooseTitle = root.querySelector("#choose-title");
  const modeSegmentBtn = root.querySelector("#mode-segment");
  const modeFullBtn = root.querySelector("#mode-full");
  const segmentRecommend = root.querySelector("#segment-recommend");
  const beginBtn = root.querySelector("#begin");

  const guideFigure = root.querySelector("#guide-figure");
  const progressFill = root.querySelector("#progress-fill");
  const phaseLabel = root.querySelector("#phase-label");
  const breathLabel = root.querySelector("#breath-label");
  const cueLabel = root.querySelector("#cue-label");
  const segmentLabel = root.querySelector("#segment-label");
  const interruptBtn = root.querySelector("#interrupt");
  const finishBtn = root.querySelector("#finish");

  const cameraHint = root.querySelector("#camera-hint");
  const cameraToggle = root.querySelector("#camera-toggle");
  const cameraPreview = root.querySelector("#camera-preview");
  const poseReadout = root.querySelector("#pose-readout");

  const doneTitle = root.querySelector("#done-title");
  const todayDuration = root.querySelector("#today-duration");
  const interruptCount = root.querySelector("#interrupt-count");
  const cardResult = root.querySelector("#card-result");
  const downloadBtn = root.querySelector("#download-card");
  const backHome = root.querySelector("#back-home");

  let lang = loadLang();
  let progress = loadProgress();
  let selectedMode = PRACTICE_MODE.segment;
  let lastPose = null;
  let cardPayload = null;
  let tickTimer = 0;

  const practice = createPracticeFSM({
    set: SAMPLE_SET,
    isComplete: (id) => Boolean(progress.completedSegments[id]),
  });

  const poseTracker = createPoseTracker({
    video: cameraPreview,
    onPose: (pose) => {
      lastPose = pose;
      paintPose();
    },
  });

  const camera = createCameraFSM({
    onStream: async (stream) => {
      cameraPreview.classList.add("is-on");
      await poseTracker.attach(stream);
    },
    onStop: async () => {
      await poseTracker.detach();
      cameraPreview.classList.remove("is-on");
      lastPose = null;
      paintPose();
    },
  });

  langZh.addEventListener("click", () => setLang("zh"));
  langEn.addEventListener("click", () => setLang("en"));
  disclaimerSkip.addEventListener("click", () => {
    practice.skipDisclaimer();
    render();
  });
  disclaimerAccept.addEventListener("click", () => {
    practice.acceptDisclaimer();
    render();
  });
  modeSegmentBtn.addEventListener("click", () => {
    selectedMode = PRACTICE_MODE.segment;
    const state = practice.getState();
    practice.selectMode(PRACTICE_MODE.segment, state.recommendedIndex);
    render();
  });
  modeFullBtn.addEventListener("click", () => {
    selectedMode = PRACTICE_MODE.full;
    practice.selectMode(PRACTICE_MODE.full, 0);
    render();
  });
  beginBtn.addEventListener("click", () => {
    if (lang === "en") unlockSpeech();
    practice.selectMode(selectedMode, practice.getState().segmentIndex);
    practice.begin();
    armTick();
    render();
    speakCue();
  });
  interruptBtn.addEventListener("click", () => {
    const event = practice.interrupt();
    clearInterval(tickTimer);
    persistSession(event.state);
    void camera.stop();
    render();
  });
  finishBtn.addEventListener("click", () => {
    const event = practice.finishEarly();
    clearInterval(tickTimer);
    persistSession(event.state);
    void camera.stop();
    render();
  });
  cameraToggle.addEventListener("click", async () => {
    const state = camera.getState();
    if (state.active || state.phase === "requesting") {
      await camera.stop();
    } else {
      await camera.start({ video: { facingMode: "user" }, audio: false });
    }
    render();
  });
  downloadBtn.addEventListener("click", () => downloadCard());
  window.addEventListener("pagehide", () => {
    camera.hardStop();
    cancelSpeech();
  });
  window.addEventListener("beforeunload", () => {
    camera.hardStop();
  });

  applyLanguage();
  render();

  function armTick() {
    clearInterval(tickTimer);
    tickTimer = window.setInterval(() => {
      const event = practice.tick();
      render();
      if (event?.type === "phase" || event?.type === "segment") speakCue();
      if (event?.type === "completed") {
        clearInterval(tickTimer);
        persistSession(event.state);
        void camera.stop();
        render();
      }
    }, 200);
  }

  function persistSession(state) {
    progress = applySession(progress, SAMPLE_SET, state.completedSegmentIds, {
      durationMs: state.elapsedMs,
      interrupts: state.interrupts,
      finished: state.finished,
    });
    saveProgress(progress);
    const lastId = state.completedSegmentIds.at(-1);
    if (lastId) {
      const cardState = progress.cards[`${SAMPLE_SET.id}:${lastId}`] || {
        fragment: true,
        complete: false,
      };
      cardPayload = buildCardPayload(SAMPLE_SET, lastId, lang, cardState);
    } else if (state.finished) {
      cardPayload = buildCardPayload(SAMPLE_SET, "SET", lang, {
        fragment: false,
        complete: true,
      });
    } else {
      cardPayload = null;
    }
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    saveLang(lang);
    applyLanguage();
    if (cardPayload) {
      cardPayload = buildCardPayload(
        SAMPLE_SET,
        cardPayload.segmentId,
        lang,
        progress.cards[`${SAMPLE_SET.id}:${cardPayload.segmentId}`] || {
          fragment: cardPayload.kind === "fragment",
          complete: cardPayload.kind === "complete",
        },
      );
    }
    render();
    if (lang === "en" && practice.getState().screen === PRACTICE_SCREEN.active) {
      speakCue();
    } else {
      cancelSpeech();
    }
  }

  function applyLanguage() {
    const copy = getCopy(lang);
    document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
    langZh.setAttribute("aria-pressed", lang === "zh" ? "true" : "false");
    langEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
    titleEl.textContent = copy.practiceTitle;
    document.title = `${copy.practiceTitle} · ${copy.brand}`;
    disclaimerTitle.textContent = copy.disclaimerTitle;
    disclaimerBody.textContent = copy.disclaimerBody;
    disclaimerSkip.textContent = copy.disclaimerSkip;
    disclaimerAccept.textContent = copy.disclaimerAccept;
    chooseTitle.textContent = copy.chooseMode;
    modeSegmentBtn.querySelector(".mode-label").textContent = copy.modeSegment;
    modeFullBtn.querySelector(".mode-label").textContent = copy.modeFull;
    beginBtn.textContent = copy.begin;
    interruptBtn.textContent = copy.interrupt;
    finishBtn.textContent = copy.finish;
    doneTitle.textContent = copy.doneTitle;
    downloadBtn.textContent = copy.downloadCard;
    backHome.textContent = copy.backHome;
    root.querySelector("#stat-today-label").textContent = copy.todayDuration;
    root.querySelector("#stat-interrupt-label").textContent = copy.interruptCount;
  }

  function render() {
    const copy = getCopy(lang);
    const state = practice.getState();
    const cam = camera.getState();

    for (const [name, el] of Object.entries(screens)) {
      el.hidden = state.screen !== name;
    }

    const rec = SAMPLE_SET.segments[state.recommendedIndex];
    segmentRecommend.textContent = rec
      ? `${copy.recommended}: ${rec.title[lang] || rec.title.zh}`
      : "";
    modeSegmentBtn.setAttribute("aria-pressed", selectedMode === PRACTICE_MODE.segment ? "true" : "false");
    modeFullBtn.setAttribute("aria-pressed", selectedMode === PRACTICE_MODE.full ? "true" : "false");

    if (state.screen === PRACTICE_SCREEN.active && state.segment) {
      const seg = state.segment;
      segmentLabel.textContent = seg.title[lang] || seg.title.zh;
      cueLabel.textContent = seg.cue[lang] || seg.cue.zh;
      phaseLabel.textContent = phaseText(copy, state.phase);
      breathLabel.textContent =
        state.phase === PRACTICE_PHASE.breathe
          ? breathHint(copy, state.phaseProgress)
          : "";
      progressFill.style.width = `${Math.round(state.phaseProgress * 100)}%`;
      guideFigure.dataset.phase = state.phase;
    }

    cameraToggle.textContent = cam.active ? copy.closeCamera : copy.openCamera;
    cameraHint.textContent = cam.active
      ? copy.cameraOnHint
      : cam.phase === "error"
        ? `${copy.cameraError}: ${cam.error || ""}`
        : copy.cameraOffHint;
    paintPose();

    const today = progress.today;
    todayDuration.textContent = formatDuration(today.durationMs, copy);
    interruptCount.textContent = String(today.interrupts);

    if (state.screen === PRACTICE_SCREEN.done) {
      paintCardResult(copy);
    }
  }

  function paintPose() {
    if (!lastPose) {
      poseReadout.textContent = "";
      return;
    }
    if (lastPose.error) {
      poseReadout.textContent = lastPose.error;
      return;
    }
    if (!lastPose.detected) {
      poseReadout.textContent = lang === "en" ? "No pose" : "未偵測到姿勢";
      return;
    }
    poseReadout.textContent =
      lang === "en"
        ? `Pose ${lastPose.score}% · nose (${lastPose.nose.x}, ${lastPose.nose.y})`
        : `姿勢 ${lastPose.score}% · 鼻尖 (${lastPose.nose.x}, ${lastPose.nose.y})`;
  }

  function paintCardResult(copy) {
    if (!cardPayload) {
      cardResult.innerHTML = `<p class="card-meta">${lang === "en" ? "No card this round." : "本輪尚無招式卡。"}</p>`;
      downloadBtn.hidden = true;
      return;
    }
    downloadBtn.hidden = false;
    const kindLabel = cardPayload.kind === "complete" ? copy.cardComplete : copy.cardFragment;
    cardResult.innerHTML = `
      <h3>${escapeHtml(cardPayload.title)}</h3>
      <p class="card-meta">${escapeHtml(kindLabel)} · ${escapeHtml(SAMPLE_SET.title[lang] || SAMPLE_SET.title.zh)}</p>
      <p>${escapeHtml(cardPayload.cue)}</p>
      <div class="card-canvas-wrap"><canvas id="card-canvas" width="560" height="360" aria-hidden="true"></canvas></div>
    `;
    drawCardCanvas(root.querySelector("#card-canvas"), cardPayload, kindLabel);
  }

  function speakCue() {
    if (lang !== "en") {
      cancelSpeech();
      return;
    }
    const state = practice.getState();
    if (!state.segment) return;
    const copy = getCopy(lang);
    const text = `${state.segment.title.en}. ${phaseText(copy, state.phase)}. ${state.segment.cue.en}`;
    speakEnglish(text);
  }

  function downloadCard() {
    const canvas = root.querySelector("#card-canvas");
    if (!canvas || !cardPayload) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qi-pulse-${cardPayload.segmentId}.png`;
    a.click();
  }
}

function phaseText(copy, phase) {
  if (phase === PRACTICE_PHASE.prep) return copy.phasePrep;
  if (phase === PRACTICE_PHASE.hold) return copy.phaseHold;
  if (phase === PRACTICE_PHASE.breathe) return copy.phaseBreathe;
  return copy.phaseRest;
}

function breathHint(copy, progress) {
  return progress < 0.5 ? copy.breatheIn : copy.breatheOut;
}

function formatDuration(ms, copy) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return `${s} ${copy.secondsUnit}`;
  return `${m} ${copy.minutesUnit} ${s} ${copy.secondsUnit}`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function drawCardCanvas(canvas, payload, kindLabel) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#e7f3ee");
  grad.addColorStop(1, "#f4efe6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#2f6f5e";
  ctx.font = "700 36px Nunito, sans-serif";
  ctx.fillText(payload.kind === "complete" ? "氣脈" : "碎片", 36, 64);
  ctx.fillStyle = "#1c2a26";
  ctx.font = "700 42px Nunito, sans-serif";
  wrapText(ctx, payload.title, 36, 130, w - 72, 48);
  ctx.fillStyle = "#5a6b64";
  ctx.font = "500 24px Nunito, sans-serif";
  wrapText(ctx, payload.cue, 36, 220, w - 72, 34);
  ctx.fillStyle = "#2f6f5e";
  ctx.font = "600 22px Nunito, sans-serif";
  ctx.fillText(kindLabel, 36, h - 36);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = String(text).split("");
  let line = "";
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}
