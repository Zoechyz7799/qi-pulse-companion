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
  applySession,
  breathForPhase,
  buildCardPayload,
  endCardForSession,
  getSet,
  listCollectedCards,
  loadProgress,
  loadSelectedSetId,
  poseUrl,
  saveProgress,
  saveSelectedSetId,
  stageForPhase,
} from "../data/cards.js";
import {
  cancelSpeech,
  getCopy,
  loadLang,
  saveLang,
  speakText,
  unlockSpeech,
} from "../locale.js";
import { angle as jointAngle } from "../core/coach.js";
import { createPoseTracker } from "../../pose-worker.js";

/** Kanshan guide clips for 起 / 停 / 收 (+ brief 達標). */
const KANSHAN_STAGE = Object.freeze({
  rise: "idle.webp",
  hold: "sway.webp",
  close: "wave.webp",
  done: "ball.webp",
});

const STICK_BONES = Object.freeze([
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [0, 11],
  [0, 12],
]);

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

  const chooseSetTitle = root.querySelector("#choose-set-title");
  const setYijinBtn = root.querySelector("#set-yijin");
  const setWushuBtn = root.querySelector("#set-wushu");
  const setYijinLabel = root.querySelector("#set-yijin-label");
  const setWushuLabel = root.querySelector("#set-wushu-label");
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
  const cameraStage = root.querySelector("#camera-stage");
  const cameraPreview = root.querySelector("#camera-preview");
  const poseOverlay = root.querySelector("#pose-overlay");
  const poseAngle = root.querySelector("#pose-angle");
  const poseReadout = root.querySelector("#pose-readout");
  const cameraPrivacyChip = root.querySelector("#camera-privacy-chip");

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
  let activeCheck = "rest";
  let lastSpokenKey = "";
  let donePoseUntil = 0;
  let lastCoachReady = false;
  let activeSet = getSet(loadSelectedSetId());
  let practice = createPracticeFSM({
    set: activeSet,
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
      if (cameraStage) cameraStage.hidden = false;
      await poseTracker.attach(stream);
      // Re-apply current move check after a fresh landmarker attach.
      poseTracker.setCheck(activeCheck, "standing");
      syncOverlaySize();
    },
    onStop: async () => {
      await poseTracker.detach();
      cameraPreview.classList.remove("is-on");
      if (cameraStage) cameraStage.hidden = true;
      clearOverlay();
      lastPose = null;
      lastCoachReady = false;
      donePoseUntil = 0;
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
  setYijinBtn?.addEventListener("click", () => selectSet("yijin"));
  setWushuBtn?.addEventListener("click", () => selectSet("wushu-three"));
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
    unlockSpeech(lang);
    lastSpokenKey = "";
    donePoseUntil = 0;
    lastCoachReady = false;
    practice.selectMode(selectedMode, practice.getState().segmentIndex);
    practice.begin();
    armTick();
    render();
    speakCue();
  });
  window.addEventListener("resize", () => {
    if (camera.getState().active) syncOverlaySize();
  });
  interruptBtn.addEventListener("click", () => {
    const event = practice.interrupt();
    clearInterval(tickTimer);
    cancelSpeech();
    persistSession(event.state);
    void camera.stop();
    render();
  });
  finishBtn.addEventListener("click", () => {
    const event = practice.finishEarly();
    clearInterval(tickTimer);
    cancelSpeech();
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

  function selectSet(id) {
    const next = getSet(id);
    if (next.id === activeSet.id) {
      render();
      return;
    }
    activeSet = next;
    saveSelectedSetId(next.id);
    selectedMode = PRACTICE_MODE.segment;
    const screen = practice.getState().screen;
    practice = createPracticeFSM({
      set: activeSet,
      isComplete: (segId) => Boolean(progress.completedSegments[segId]),
    });
    // Set picker lives on the choose screen; keep the user there after switching.
    if (screen !== PRACTICE_SCREEN.disclaimer) {
      practice.skipDisclaimer();
    }
    render();
  }

  function persistSession(state) {
    progress = applySession(progress, activeSet, state.completedSegmentIds, {
      durationMs: state.elapsedMs,
      interrupts: state.interrupts,
      finished: state.finished,
    });
    saveProgress(progress);
    // Single segment → fragment only; complete SET only when all moves are done.
    cardPayload = endCardForSession(
      progress,
      activeSet,
      state.completedSegmentIds,
      lang,
    );
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    saveLang(lang);
    applyLanguage();
    if (cardPayload) {
      const key =
        cardPayload.segmentId === "SET"
          ? `${activeSet.id}:SET`
          : `${activeSet.id}:${cardPayload.segmentId}`;
      cardPayload = buildCardPayload(
        activeSet,
        cardPayload.segmentId,
        lang,
        progress.cards[key] || {
          fragment: cardPayload.kind === "fragment",
          complete: cardPayload.kind === "complete",
        },
        progress,
      );
    }
    render();
    if (practice.getState().screen === PRACTICE_SCREEN.active) {
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
    if (chooseSetTitle) chooseSetTitle.textContent = copy.chooseSet;
    if (setYijinLabel) {
      const yijin = getSet("yijin");
      setYijinLabel.textContent = yijin.title[lang] || yijin.title.zh;
    }
    if (setWushuLabel) {
      const wushu = getSet("wushu-three");
      setWushuLabel.textContent = wushu.title[lang] || wushu.title.zh;
    }
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

    setYijinBtn?.setAttribute("aria-pressed", activeSet.id === "yijin" ? "true" : "false");
    setWushuBtn?.setAttribute(
      "aria-pressed",
      activeSet.id === "wushu-three" ? "true" : "false",
    );
    const rec = activeSet.segments[state.recommendedIndex];
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
    if (cameraPrivacyChip) {
      cameraPrivacyChip.textContent =
        lang === "en"
          ? "The picture stays on this device. Nothing is uploaded or stored."
          : "畫面僅在本機處理，不會上傳或儲存。";
    }
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
    const stageSpec = stageForPhase(seg, state.phase);
    const stage = stageOf(state.phase);
    const showingDone = Date.now() < donePoseUntil;
    const clip = showingDone
      ? KANSHAN_STAGE.done
      : KANSHAN_STAGE[stage] || stageSpec?.clip || seg.pose || "idle.webp";
    const src = poseUrl(clip);
    if (guidePose.getAttribute("src") !== src) guidePose.src = src;
    guideStage.dataset.phase = state.phase;
    guideStage.dataset.stage = showingDone ? "done" : stage;
    guideStage.dataset.check = stageSpec?.check || "";
    guideStage.dataset.move = seg.id;
    guideStage.classList.toggle("is-inhale", stage === "rise" && !showingDone);
    guideStage.classList.toggle("is-exhale", stage === "close" && !showingDone);
    guideStage.classList.toggle("is-natural", stage === "hold" && !showingDone);
    guideStage.classList.toggle("is-done", showingDone);
    stageBadge.textContent = showingDone
      ? getCopy(lang).coachOk
      : stageBadgeText(copy, stage);
    segmentLabel.textContent = seg.title[lang] || seg.title.zh;
    const cue =
      (stageSpec?.cue && (stageSpec.cue[lang] || stageSpec.cue.zh)) ||
      seg.cue[lang] ||
      seg.cue.zh;
    cueLabel.textContent = cue;
    phaseLabel.textContent = phaseText(copy, state.phase);
    const breath = breathForPhase(state.phase);
    const breathText = breath[lang] || breath.zh;
    breathLabel.hidden = false;
    breathLabel.textContent = breathText;
    breathLabel.dataset.breath =
      stage === "rise" ? "in" : stage === "close" ? "out" : "natural";
    progressFill.style.width = `${Math.round(state.phaseProgress * 100)}%`;
    syncTrackerCheck(stageSpec?.check || "rest");
  }

  function syncTrackerCheck(check) {
    const next = check || "rest";
    if (next === activeCheck) return;
    activeCheck = next;
    poseTracker.setCheck(next, "standing");
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
    const camOn = camera.getState().active;
    if (cameraStage) cameraStage.hidden = !camOn;
    if (!camOn || !lastPose) {
      clearOverlay();
      if (poseAngle) {
        poseAngle.hidden = true;
        poseAngle.textContent = "";
      }
      poseReadout.textContent = "";
      poseReadout.dataset.status = "";
      return;
    }
    if (lastPose.error) {
      clearOverlay();
      if (poseAngle) poseAngle.hidden = true;
      poseReadout.dataset.status = "error";
      poseReadout.textContent = copy.cameraError;
      return;
    }

    const coach = lastPose.coach;
    const unstable =
      !lastPose.detected ||
      !lastPose.landmarks ||
      (coach &&
        (!coach.tracking ||
          coach.code === "missing" ||
          coach.code === "framing" ||
          coach.code === "geometry"));

    if (unstable) {
      clearOverlay();
      if (poseAngle) poseAngle.hidden = true;
      poseReadout.dataset.status = "unstable";
      poseReadout.textContent = copy.coachUnstable;
      lastCoachReady = false;
      return;
    }

    drawStickFigure(lastPose.landmarks, coach?.ready);
    const elbowDeg = estimateElbowDegrees(lastPose.landmarks);
    if (poseAngle) {
      if (elbowDeg != null) {
        poseAngle.hidden = false;
        poseAngle.textContent = copy.elbowEstimate.replace(
          "{deg}",
          String(Math.round(elbowDeg / 5) * 5),
        );
      } else {
        poseAngle.hidden = true;
        poseAngle.textContent = "";
      }
    }

    const ready = Boolean(coach?.ready);
    if (ready && !lastCoachReady) {
      donePoseUntil = Date.now() + 1400;
      const state = practice.getState();
      if (state.screen === PRACTICE_SCREEN.active) {
        paintGuide(state, copy);
      }
    }
    lastCoachReady = ready;

    const tip = ready
      ? copy.coachOk
      : coach?.message
        ? lang === "en"
          ? coachTipEn(coach)
          : coach.message
        : copy.coachAdjust;
    poseReadout.dataset.status = ready ? "ok" : "adjust";
    poseReadout.textContent = ready
      ? `✓ ${tip}`
      : `· ${tip}`;
  }

  function syncOverlaySize() {
    if (!poseOverlay) return;
    const stageW = cameraStage?.clientWidth || 0;
    const stageH = cameraStage?.clientHeight || 0;
    const vw = cameraPreview?.videoWidth || 0;
    const vh = cameraPreview?.videoHeight || 0;
    // Prefer stage box (video is visually hidden at 2×2); fall back to stream size.
    let w = stageW || vw || 640;
    let h = stageH || vh || 360;
    if (stageW && vw && vh) {
      // Match canvas pixel ratio to stream aspect inside the stage.
      h = Math.round(stageW * (vh / vw));
      w = stageW;
    }
    if (poseOverlay.width !== w) poseOverlay.width = w;
    if (poseOverlay.height !== h) poseOverlay.height = h;
  }

  function fillOverlayBackdrop(ctx, w, h) {
    ctx.fillStyle = "#15201c";
    ctx.fillRect(0, 0, w, h);
  }

  function clearOverlay() {
    if (!poseOverlay) return;
    const ctx = poseOverlay.getContext("2d");
    if (!ctx) return;
    fillOverlayBackdrop(ctx, poseOverlay.width || 640, poseOverlay.height || 360);
  }

  function drawStickFigure(landmarks, ready) {
    if (!poseOverlay || !landmarks) return;
    syncOverlaySize();
    const ctx = poseOverlay.getContext("2d");
    if (!ctx) return;
    const w = poseOverlay.width;
    const h = poseOverlay.height;
    // Opaque backdrop — never composite the live video underneath.
    fillOverlayBackdrop(ctx, w, h);
    // Pale green / white stick figure only (keypoints + limbs).
    const limb = ready ? "rgba(210, 245, 225, 0.95)" : "rgba(180, 230, 200, 0.88)";
    const joint = ready ? "#ffffff" : "rgba(236, 252, 244, 0.95)";
    ctx.lineWidth = Math.max(2.5, w * 0.01);
    ctx.strokeStyle = limb;
    ctx.fillStyle = joint;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(120, 200, 160, 0.35)";
    ctx.shadowBlur = 6;

    const pt = (id) => {
      const p = landmarks[id];
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
      // Mirror for selfie facing (matches hidden video transform).
      return { x: (1 - p.x) * w, y: p.y * h };
    };

    for (const [a, b] of STICK_BONES) {
      const pa = pt(a);
      const pb = pt(b);
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (const id of [0, 11, 12, 13, 14, 15, 16, 23, 24]) {
      const p = pt(id);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(3.5, w * 0.014), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function estimateElbowDegrees(landmarks) {
    if (!landmarks) return null;
    const aspect =
      cameraPreview.videoWidth && cameraPreview.videoHeight
        ? cameraPreview.videoWidth / cameraPreview.videoHeight
        : 4 / 3;
    const scaled = (p) =>
      p && Number.isFinite(p.x) && Number.isFinite(p.y)
        ? { x: p.x * aspect, y: p.y }
        : null;
    const left = jointAngle(
      scaled(landmarks[11]),
      scaled(landmarks[13]),
      scaled(landmarks[15]),
    );
    const right = jointAngle(
      scaled(landmarks[12]),
      scaled(landmarks[14]),
      scaled(landmarks[16]),
    );
    const vals = [left, right].filter((n) => Number.isFinite(n));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function paintCardResult(copy) {
    if (!cardPayload) {
      cardResult.innerHTML = `<p class="card-meta">${lang === "en" ? "No card this round." : "本輪尚無招式卡。"}</p>`;
      downloadBtn.hidden = true;
      return;
    }
    downloadBtn.hidden = false;
    const kindLabel = cardPayload.kindLabel || (cardPayload.kind === "complete" ? copy.cardComplete : copy.cardFragment);
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
          <p class="card-meta">${escapeHtml(kindLabel)} · ${escapeHtml(activeSet.title[lang] || activeSet.title.zh)}</p>
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
    const items = listCollectedCards(progress, activeSet, lang);
    if (!items.length) {
      memoryGrid.innerHTML = `<p class="card-meta">${escapeHtml(copy.memoryEmpty)}</p>`;
      return;
    }
    memoryGrid.innerHTML = items
      .map((item) => {
        const kind = item.kindLabel || (item.kind === "complete" ? copy.cardComplete : copy.cardFragment);
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
    const state = practice.getState();
    if (!state.segment || state.screen !== PRACTICE_SCREEN.active) {
      cancelSpeech();
      return;
    }
    const copy = getCopy(lang);
    const stage = stageOf(state.phase);
    // Speak only when Rise/Hold/Close (or segment) changes — no per-frame spam.
    // hold + breathe both map to Hold, so they share one spoken key.
    const key = `${state.segmentIndex}|${stage}|${lang}`;
    if (key === lastSpokenKey) return;
    lastSpokenKey = key;
    const breath = breathForPhase(state.phase);
    const stageWord = stageBadgeText(copy, stage);
    const breathWord = breath[lang] || breath.zh;
    speakText(`${stageWord}. ${breathWord}`, lang);
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

/** Short English tips for contest coach codes (messages stay zh in coach.js). */
function coachTipEn(coach) {
  const map = {
    ready: "Hold this shape a moment",
    missing: "Step into frame — head and shoulders visible",
    framing: "Adjust so head, shoulders, and elbows are clear",
    distance: "Move a little closer so shoulders read clearly",
    geometry: "Camera frame not ready yet",
    unsupported: "This step has no check — keep following the guide",
  };
  if (coach.ready) return map.ready;
  if (map[coach.code]) return map[coach.code];
  if (coach.message) return coach.message;
  return "Keep following the guide";
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
