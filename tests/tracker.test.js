import assert from "node:assert/strict";
import test from "node:test";
import { ENCOURAGEMENTS, PRESETS, getCopy, pickEncouragement, presetById } from "../src/tracking-config.js";
import { createTracker, formatClock } from "../src/tracker.js";

test("encouragements avoid repeating the line that is already showing", () => {
  assert.equal(ENCOURAGEMENTS.zh.length, 9);
  assert.equal(ENCOURAGEMENTS.en.length, 9);
  assert.equal(ENCOURAGEMENTS.zh.at(-1), "你就是自己的太陽，照亮著一切。");
  assert.equal(ENCOURAGEMENTS.en.at(-1), "You are your own sun, illuminating everything.");
  assert.equal(
    pickEncouragement(ENCOURAGEMENTS.zh, "你做得很好，繼續保持！", () => 0),
    "每一次練習都是進步。",
  );
  assert.equal(pickEncouragement(["只有一句"], "只有一句", () => 0.9), "只有一句");
});

test("english time-up copy says Time's up", () => {
  assert.equal(getCopy("en").alertShort, "Time's up");
  assert.equal(getCopy("en").tabFlash, "⏰ Time's up");
  assert.equal(getCopy("en").notifyTitle, "Time's up");
});

test("presets include 25 min, 45 min, and a 10 second demo", () => {
  assert.equal(presetById("25").ms, 25 * 60 * 1000);
  assert.equal(presetById("45").ms, 45 * 60 * 1000);
  assert.equal(presetById("demo").ms, 10 * 1000);
  assert.equal(PRESETS.length, 3);
});

test("formatClock rounds up to the next second and clamps at zero", () => {
  assert.equal(formatClock(10_000), "00:10");
  assert.equal(formatClock(1), "00:01");
  assert.equal(formatClock(0), "00:00");
  assert.equal(formatClock(25 * 60 * 1000), "25:00");
  assert.equal(formatClock(-20), "00:00");
});

test("a sparse tick still finishes on the wall clock", () => {
  let clock = 1_000;
  const tracker = createTracker({ now: () => clock });
  tracker.start(presetById("demo"), clock);

  clock = 1_000 + 9_000;
  assert.equal(tracker.tick(clock), null);
  assert.equal(tracker.getState(clock).phase, "running");
  assert.equal(tracker.getState(clock).remainingMs, 1_000);

  clock = 1_000 + 10_000;
  const event = tracker.tick(clock);
  assert.equal(event.type, "completed");
  assert.equal(event.state.phase, "alert");
  assert.equal(event.state.displayMs, 0);

  clock = 1_000 + 30_000;
  assert.equal(tracker.tick(clock), null);
  assert.equal(tracker.getState(clock).phase, "alert");
});

test("there is no pause: a long gap does not add time back", () => {
  const tracker = createTracker();
  assert.equal("pause" in tracker, false);
  const started = tracker.start(presetById("25"), 0);
  assert.equal(started.state.phase, "running");
  const later = tracker.getState(20 * 60 * 1000);
  assert.equal(later.phase, "running");
  assert.equal(later.remainingMs, 5 * 60 * 1000);
});

test("double-click alert is immediate and can fire again", () => {
  const tracker = createTracker({ now: () => 50 });
  tracker.arm(presetById("25"));
  const first = tracker.triggerAlert(50);
  assert.equal(first.type, "manual");
  assert.equal(first.state.phase, "alert");
  const again = tracker.triggerAlert(80);
  assert.equal(again.type, "manual");
  assert.equal(again.state.phase, "alert");
});

test("stop and dismiss return to the armed length without alerting", () => {
  const tracker = createTracker();
  tracker.start(presetById("45"), 0);
  const stopped = tracker.stop();
  assert.equal(stopped.type, "stopped");
  assert.equal(stopped.state.phase, "idle");
  assert.equal(stopped.state.displayMs, 45 * 60 * 1000);
  assert.equal(tracker.tick(60_000), null);

  tracker.start(presetById("demo"), 0);
  tracker.tick(10_000);
  const dismissed = tracker.dismiss();
  assert.equal(dismissed.state.phase, "idle");
  assert.equal(dismissed.state.displayMs, 10_000);
});

test("arm is ignored while a session is running", () => {
  const tracker = createTracker();
  tracker.arm(presetById("25"));
  tracker.start(presetById("25"), 0);
  const armed = tracker.arm(presetById("demo"));
  assert.equal(armed.ok, false);
  assert.equal(tracker.getState(1_000).presetId, "25");
  assert.equal(tracker.getState(1_000).remainingMs, 25 * 60 * 1000 - 1_000);
});
