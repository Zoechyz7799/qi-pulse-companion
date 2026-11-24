import { createPoseWorker } from "./pose-worker.js";
import {
  DEFAULT_PRESET_ID,
  ENCOURAGEMENTS,
  ENCOURAGEMENT_MS,
  PHASE,
  getCopy,
  pickEncouragement,
  presetById,
  PRESETS,
} from "./tracking-config.js";
import { createTracker, formatClock } from "./tracker.js";

const clockEl = document.querySelector("#clock");
const statusEl = document.querySelector("#status");
const hintEl = document.querySelector("#hint");
const encourageEl = document.querySelector("#encourage");
const encourageText = document.querySelector("#encourage-text");
const primaryEl = document.querySelector("#primary");
const presetsEl = document.querySelector("#presets");
const petEl = document.querySelector("#pet");
const langZh = document.querySelector("#lang-zh");
const langEn = document.querySelector("#lang-en");

const tracker = createTracker();
const pose = createPoseWorker(petEl);

const LINE_KEY = "qimai-line";

let lang = loadLang();
let line = "";
let boxOpen = false;
let selectedId = DEFAULT_PRESET_ID;
let deadlineTimer = 0;
let flashTimer = 0;
let flashOn = false;
let hideTimer = 0;

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
  hideEncouragement();
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
  hintEl.textContent = copy.hint;
  hintEl.hidden = state.phase !== PHASE.idle;
  statusEl.textContent =
    state.phase === PHASE.running ? copy.running : state.phase === PHASE.alert ? copy.alertShort : "";

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

  if (!flashTimer) document.title = formatClock(state.displayMs);
}

function raiseAlert() {
  const copy = getCopy(lang);
  pose.replayAlert();
  startFlash(copy);
  const spoken = showEncouragement();
  notify(copy, spoken);
}

function quietAlert() {
  stopFlash();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  document.title = formatClock(tracker.getState().displayMs);
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
    document.title = flashOn ? copy.tabFlash : formatClock(tracker.getState().displayMs);
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
  if (boxOpen) showEncouragement();
  else if (lang === "zh" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

function applyLanguage() {
  const copy = getCopy(lang);
  document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
  langZh.setAttribute("aria-pressed", lang === "zh" ? "true" : "false");
  langEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  presetsEl.setAttribute("aria-label", copy.presetsLabel);
  document.querySelector(".lang").setAttribute("aria-label", copy.langLabel);
  const noscript = document.querySelector(".noscript");
  if (noscript) noscript.textContent = copy.noscript;
}

function refreshLine() {
  const lines = ENCOURAGEMENTS[lang] ?? ENCOURAGEMENTS.zh;
  let previous = "";
  try {
    previous = sessionStorage.getItem(LINE_KEY) || "";
  } catch {
    previous = line;
  }
  line = pickEncouragement(lines, previous);
  try {
    sessionStorage.setItem(LINE_KEY, line);
  } catch {
    /* private mode */
  }
}

function showEncouragement() {
  refreshLine();
  encourageText.textContent = line;
  encourageEl.classList.add("is-on");
  encourageEl.setAttribute("aria-hidden", "false");
  boxOpen = true;
  clearTimeout(hideTimer);
  hideTimer = window.setTimeout(hideEncouragement, ENCOURAGEMENT_MS);
  if (lang === "en") speak(line);
  else if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  return line;
}

function hideEncouragement() {
  clearTimeout(hideTimer);
  hideTimer = 0;
  boxOpen = false;
  encourageEl.classList.remove("is-on");
  encourageEl.setAttribute("aria-hidden", "true");
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

function notify(copy, body) {
  if (!("Notification" in window)) return;
  const show = () => {
    if (Notification.permission !== "granted") return;
    try {
      new Notification(copy.notifyTitle, { body, silent: true });
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
