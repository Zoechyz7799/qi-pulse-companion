import { createPoseWorker } from "./pose-worker.js";
import {
  DEFAULT_PRESET_ID,
  PHASE,
  getCopy,
  presetById,
  PRESETS,
} from "./tracking-config.js";
import { createTracker, formatClock } from "./tracker.js";

const clockEl = document.querySelector("#clock");
const statusEl = document.querySelector("#status");
const hintEl = document.querySelector("#hint");
const bubbleEl = document.querySelector("#bubble");
const bubbleText = document.querySelector("#bubble-text");
const primaryEl = document.querySelector("#primary");
const presetsEl = document.querySelector("#presets");
const titleEl = document.querySelector("#app-title");
const petEl = document.querySelector("#pet");
const langZh = document.querySelector("#lang-zh");
const langEn = document.querySelector("#lang-en");

const tracker = createTracker();
const pose = createPoseWorker(petEl);

let lang = loadLang();
let selectedId = DEFAULT_PRESET_ID;
let deadlineTimer = 0;
let flashTimer = 0;
let flashOn = false;

tracker.arm(presetById(selectedId));

const presetButtons = PRESETS.map((preset) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.dataset.preset = preset.id;
  button.addEventListener("click", () => {
    if (tracker.getState().phase !== PHASE.idle) return;
    selectedId = preset.id;
    tracker.arm(preset);
    render(tracker.getState());
  });
  presetsEl.append(button);
  return button;
});

langZh.addEventListener("click", () => setLang("zh"));
langEn.addEventListener("click", () => setLang("en"));

primaryEl.addEventListener("click", () => {
  const state = tracker.getState();
  if (state.phase === PHASE.idle) {
    if (lang === "en") unlockSpeech();
    warmNotify();
    const started = tracker.start(presetById(selectedId));
    armDeadline(started.state);
    render(started.state);
    return;
  }
  if (state.phase === PHASE.running) {
    clearTimeout(deadlineTimer);
    const stopped = tracker.stop();
    stopFlash();
    render(stopped.state);
    return;
  }
  clearTimeout(deadlineTimer);
  const dismissed = tracker.dismiss();
  quietAlert();
  render(dismissed.state);
});

petEl.addEventListener("dblclick", (event) => {
  event.preventDefault();
  if (lang === "en") unlockSpeech();
  clearTimeout(deadlineTimer);
  tracker.triggerAlert();
  render(tracker.getState());
  raiseAlert();
});

window.setInterval(() => {
  if (document.hidden) return;
  if (tracker.getState().phase === PHASE.running) sync();
}, 250);

document.addEventListener("visibilitychange", () => {
  sync();
});

window.addEventListener("pagehide", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
});

applyLanguage();
render(tracker.getState());

function sync(at = Date.now()) {
  const event = tracker.tick(at);
  const state = tracker.getState(at);
  render(state);
  if (event?.type === "completed") {
    clearTimeout(deadlineTimer);
    raiseAlert();
  }
}

function render(state) {
  const copy = getCopy(lang);
  clockEl.textContent = formatClock(state.displayMs);
  titleEl.textContent = copy.title;
  hintEl.textContent = copy.hint;
  hintEl.hidden = state.phase !== PHASE.idle;
  statusEl.textContent =
    state.phase === PHASE.running ? copy.running : state.phase === PHASE.alert ? copy.alertShort : "";

  if (state.phase === PHASE.alert) bubbleText.textContent = copy.bubble;
  else bubbleText.textContent = "";
  bubbleEl.classList.toggle("is-on", state.phase === PHASE.alert);

  primaryEl.textContent =
    state.phase === PHASE.running ? copy.stop : state.phase === PHASE.alert ? copy.dismiss : copy.start;

  for (const button of presetButtons) {
    const preset = presetById(button.dataset.preset);
    button.textContent = copy[preset.labelKey];
    const selected = preset.id === (state.presetId ?? selectedId);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
    button.disabled = state.phase !== PHASE.idle;
  }

  pose.setPhase(state.phase);
  pose.setLabel(copy.petLabel);

  if (state.phase === PHASE.running) {
    document.title = `${formatClock(state.displayMs)} · ${copy.title}`;
  } else if (state.phase === PHASE.idle) {
    document.title = copy.title;
  }
}

function raiseAlert() {
  const copy = getCopy(lang);
  pose.replayAlert();
  startFlash(copy);
  if (lang === "en") speak(copy.speak);
  else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  notify(copy);
}

function quietAlert() {
  stopFlash();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.title = getCopy(lang).title;
}

function armDeadline(state) {
  clearTimeout(deadlineTimer);
  if (state.phase !== PHASE.running || state.startedAt == null) return;
  const endsAt = state.startedAt + state.durationMs;
  deadlineTimer = window.setTimeout(() => sync(Date.now()), Math.max(0, endsAt - Date.now()));
}

function startFlash(copy) {
  if (flashTimer) return;
  const paint = () => {
    flashOn = !flashOn;
    document.title = flashOn ? copy.tabFlash : copy.title;
  };
  paint();
  flashTimer = window.setInterval(paint, 900);
}

function stopFlash() {
  clearInterval(flashTimer);
  flashTimer = 0;
  flashOn = false;
}

function setLang(next) {
  if (next === lang) return;
  const wasAlert = tracker.getState().phase === PHASE.alert;
  lang = next;
  try {
    localStorage.setItem("qimai-lang", lang);
  } catch {
    /* private mode */
  }
  applyLanguage();
  if (wasAlert && flashTimer) {
    stopFlash();
    startFlash(getCopy(lang));
  }
  render(tracker.getState());
  if (wasAlert && lang === "en") speak(getCopy(lang).speak);
  if (lang === "zh" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

function applyLanguage() {
  const copy = getCopy(lang);
  document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
  document.title = copy.title;
  langZh.setAttribute("aria-pressed", lang === "zh" ? "true" : "false");
  langEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  presetsEl.setAttribute("aria-label", copy.presetsLabel);
  document.querySelector(".lang").setAttribute("aria-label", copy.langLabel);
  const noscript = document.querySelector(".noscript");
  if (noscript) noscript.textContent = copy.noscript;
}

function loadLang() {
  try {
    const saved = localStorage.getItem("qimai-lang");
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* ignore */
  }
  return "zh";
}

function speak(text) {
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

function unlockSpeech() {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(" ");
  utterance.volume = 0;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

function warmNotify() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  Notification.requestPermission().catch(() => {});
}

function notify(copy) {
  if (!("Notification" in window)) return;
  const show = () => {
    if (Notification.permission !== "granted") return;
    try {
      new Notification(copy.notifyTitle, { body: copy.notifyBody, silent: true });
    } catch {
      /* constructor can reject when the page is hidden */
    }
  };
  if (Notification.permission === "granted") {
    show();
    return;
  }
  if (Notification.permission !== "default") return;
  Notification.requestPermission().then(show).catch(() => {});
}
