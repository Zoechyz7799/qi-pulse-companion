/**
 * Wall-clock pomodoro state machine.
 * Remaining time is derived from startedAt, so a hidden tab does not pause it.
 * This module does not touch the DOM, notifications, or speech.
 */

import { PHASE } from "./tracking-config.js";

export function formatClock(ms) {
  const total = Math.max(0, Math.ceil(Number(ms) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createTracker(options = {}) {
  const now = options.now ?? (() => Date.now());
  let snapshot = {
    phase: PHASE.idle,
    presetId: null,
    durationMs: 0,
    startedAt: null,
  };

  function remainingMs(at) {
    if (snapshot.phase !== PHASE.running || snapshot.startedAt == null) return 0;
    return Math.max(0, snapshot.durationMs - (at - snapshot.startedAt));
  }

  function displayMs(at) {
    if (snapshot.phase === PHASE.running) return remainingMs(at);
    if (snapshot.phase === PHASE.alert) return 0;
    return snapshot.durationMs;
  }

  function view(at = now()) {
    return {
      phase: snapshot.phase,
      presetId: snapshot.presetId,
      durationMs: snapshot.durationMs,
      startedAt: snapshot.startedAt,
      remainingMs: snapshot.phase === PHASE.running ? remainingMs(at) : 0,
      displayMs: displayMs(at),
    };
  }

  function rest() {
    snapshot = {
      phase: PHASE.idle,
      presetId: snapshot.presetId,
      durationMs: snapshot.durationMs,
      startedAt: null,
    };
    return view();
  }

  return {
    getState(at) {
      return view(at);
    },

    arm(preset) {
      if (snapshot.phase !== PHASE.idle) return { ok: false, state: view() };
      snapshot = {
        phase: PHASE.idle,
        presetId: preset.id,
        durationMs: preset.ms,
        startedAt: null,
      };
      return { ok: true, state: view() };
    },

    start(preset, at = now()) {
      snapshot = {
        phase: PHASE.running,
        presetId: preset.id,
        durationMs: preset.ms,
        startedAt: at,
      };
      return { type: "started", state: view(at) };
    },

    stop() {
      return { type: "stopped", state: rest() };
    },

    dismiss() {
      return { type: "dismissed", state: rest() };
    },

    tick(at = now()) {
      if (snapshot.phase !== PHASE.running) return null;
      if (remainingMs(at) > 0) return null;
      snapshot = { ...snapshot, phase: PHASE.alert };
      return { type: "completed", state: view(at) };
    },

    triggerAlert(at = now()) {
      snapshot = { ...snapshot, phase: PHASE.alert };
      return { type: "manual", state: view(at) };
    },
  };
}
