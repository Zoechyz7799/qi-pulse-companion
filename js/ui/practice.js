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
  STAGE_POSES,
  applySession,
  buildCardPayload,
  listCollectedCards,
  loadProgress,
  poseUrl,
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

  const guideStage = root.querySelector("#guide-stage");
  const guidePose = root.querySelector("#guide-pose");
  const stageBadge = root.querySelector("#stage-badge");
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
  const memoryTitle = root.querySelector("#memory-title");
  const memoryGrid = root.querySelector("#memory-grid");

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
    memoryTitle.textContent = copy.memoryTitle;
    root.querySelector("#stat-today-label").textContent = copy.todayDuration;
    root.querySelector("#stat-interrupt-label").textContent = copy.interruptCount;
    root.querySelector(".progress-track")?.setAttribute("aria-label", copy.progress);
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
      paintGuide(state, copy);
    }

    cameraToggle.textContent = cam.active ? copy.closeCamera : copy.openCamera;
    cameraHint.textContent = friendlyCameraHint(copy, cam);
    paintPose();

    const today = progress.today;
    todayDuration.textContent = formatDuration(today.durationMs, copy);
    interruptCount.textContent = String(today.interrupts);

    if (state.screen === PRACTICE_SCREEN.done) {
      paintCardResult(copy);
      paintMemory(copy);
    }
  }

  function paintGuide(state, copy) {
    const seg = state.segment;
    const stage = stageOf(state.phase);
    const clip = STAGE_POSES[state.phase] || seg.pose || "idle.webp";
    const src = poseUrl(clip);
    if (guidePose.getAttribute("src") !== src) guidePose.src = src;
    guideStage.dataset.phase = state.phase;
    guideStage.dataset.stage = stage;
    guideStage.classList.toggle("is-inhale", state.phase === PRACTICE_PHASE.breathe && state.phaseProgress < 0.5);
    guideStage.classList.toggle("is-exhale", state.phase === PRACTICE_PHASE.breathe && state.phaseProgress >= 0.5);
    stageBadge.textContent = stageBadgeText(copy, stage);
    segmentLabel.textContent = seg.title[lang] || seg.title.zh;
    cueLabel.textContent = seg.cue[lang] || seg.cue.zh;
    phaseLabel.textContent = phaseText(copy, state.phase);
    const breathing = state.phase === PRACTICE_PHASE.breathe;
    breathLabel.hidden = !breathing;
    if (breathing) {
      breathLabel.textContent = breathHint(copy, state.phaseProgress);
      breathLabel.dataset.breath = state.phaseProgress < 0.5 ? "in" : "out";
    }
    progressFill.style.width = `${Math.round(state.phaseProgress * 100)}%`;
  }

  function friendlyCameraHint(copy, cam) {
    if (cam.active) return copy.cameraOnHint;
    if (cam.phase !== "error") return copy.cameraOffHint;
    const raw = String(cam.error || "").toLowerCase();
    if (raw.includes("notallowed") || raw.includes("permission") || raw.includes("denied")) {
      return copy.cameraDenied;
    }
    if (raw.includes("notreadable") || raw.includes("trackstart") || raw.includes("busy") || raw.includes("in use")) {
      return copy.cameraBusy;
    }
    return copy.cameraError;
  }

  function paintPose() {
    const copy = getCopy(lang);
    if (!lastPose) {
      poseReadout.textContent = "";
      return;
    }
    if (lastPose.error) {
      poseReadout.textContent = copy.cameraError;
      return;
    }
    if (!lastPose.detected) {
      poseReadout.textContent = copy.poseMissing;
      return;
    }
    poseReadout.textContent =
      lang === "en"
        ? `Following · ${lastPose.score}%`
        : `跟著練 · ${lastPose.score}%`;
  }

  function paintCardResult(copy) {
    if (!cardPayload) {
      cardResult.innerHTML = `<p class="card-meta">${lang === "en" ? "No card this round." : "本輪尚無招式卡。"}</p>`;
      downloadBtn.hidden = true;
      return;
    }
    downloadBtn.hidden = false;
    const kindLabel = cardPayload.kind === "complete" ? copy.cardComplete : copy.cardFragment;
    const points = (cardPayload.points || [])
      .map((p) => `<li>${escapeHtml(p)}</li>`)
      .join("");
    cardResult.className = `card-result is-${cardPayload.kind}`;
    cardResult.innerHTML = `
      <div class="tech-card is-${escapeHtml(cardPayload.kind)}">
        <div class="tech-card-art">
          <img src="${escapeHtml(poseUrl(cardPayload.image))}" alt="" draggable="false" />
        </div>
        <div class="tech-card-body">
          <p class="card-meta">${escapeHtml(kindLabel)} · ${escapeHtml(SAMPLE_SET.title[lang] || SAMPLE_SET.title.zh)}</p>
          <h3>${escapeHtml(cardPayload.title)}</h3>
          <p>${escapeHtml(cardPayload.cue)}</p>
          <p class="tech-label">${escapeHtml(copy.cardPoints)}</p>
          <ul class="tech-points">${points}</ul>
          <p class="tech-label">${escapeHtml(copy.cardSource)}</p>
          <p class="tech-field">${escapeHtml(cardPayload.source)}</p>
          <p class="tech-label">${escapeHtml(copy.cardEffect)}</p>
          <p class="tech-field">${escapeHtml(cardPayload.effect)}</p>
        </div>
      </div>
      <div class="card-canvas-wrap"><canvas id="card-canvas" width="640" height="400" aria-hidden="true"></canvas></div>
    `;
    drawCardCanvas(root.querySelector("#card-canvas"), cardPayload, kindLabel, copy);
  }

  function paintMemory(copy) {
    const items = listCollectedCards(progress, SAMPLE_SET, lang);
    if (!items.length) {
      memoryGrid.innerHTML = `<p class="card-meta">${escapeHtml(copy.memoryEmpty)}</p>`;
      return;
    }
    memoryGrid.innerHTML = items
      .map((item) => {
        const kind = item.kind === "complete" ? copy.cardComplete : copy.cardFragment;
        return `
          <article class="memory-card is-${escapeHtml(item.kind)}">
            <img src="${escapeHtml(poseUrl(item.image))}" alt="" draggable="false" />
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(kind)}</span>
            </div>
          </article>
        `;
      })
      .join("");
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

function stageOf(phase) {
  if (phase === PRACTICE_PHASE.prep) return "rise";
  if (phase === PRACTICE_PHASE.rest) return "close";
  return "hold";
}

function stageBadgeText(copy, stage) {
  if (stage === "rise") return copy.stageRise;
  if (stage === "close") return copy.stageClose;
  return copy.stageHold;
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

function drawCardCanvas(canvas, payload, kindLabel, copy) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  if (payload.kind === "complete") {
    grad.addColorStop(0, "#dff3ea");
    grad.addColorStop(0.55, "#f7f1e4");
    grad.addColorStop(1, "#e7f6ef");
  } else {
    grad.addColorStop(0, "#f3f6f4");
    grad.addColorStop(1, "#efe8dc");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const img = new Image();
  img.onload = () => {
    ctx.save();
    ctx.globalAlpha = payload.kind === "complete" ? 0.92 : 0.78;
    ctx.drawImage(img, w - 250, 40, 200, 200);
    ctx.restore();
    paintCardText(ctx, payload, kindLabel, copy, w, h);
  };
  img.onerror = () => paintCardText(ctx, payload, kindLabel, copy, w, h);
  img.src = poseUrl(payload.image);
  paintCardText(ctx, payload, kindLabel, copy, w, h);
}

function paintCardText(ctx, payload, kindLabel, copy, w, h) {
  ctx.fillStyle = "#2f6f5e";
  ctx.font = "700 28px Nunito, sans-serif";
  ctx.fillText(kindLabel, 36, 52);
  ctx.fillStyle = "#1c2a26";
  ctx.font = "700 40px Nunito, sans-serif";
  wrapText(ctx, payload.title, 36, 110, w - 300, 46);
  ctx.fillStyle = "#5a6b64";
  ctx.font = "500 22px Nunito, sans-serif";
  wrapText(ctx, payload.cue, 36, 180, w - 300, 30);
  ctx.fillStyle = "#2f6f5e";
  ctx.font = "600 20px Nunito, sans-serif";
  ctx.fillText(copy.cardEffect, 36, h - 70);
  ctx.fillStyle = "#1c2a26";
  ctx.font = "500 20px Nunito, sans-serif";
  wrapText(ctx, payload.effect, 36, h - 40, w - 72, 26);
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
