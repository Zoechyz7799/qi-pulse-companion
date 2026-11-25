/**
 * Yi Jin Jing: each of 12 moves has 起/停/收 stage visuals + coach checks.
 * Run: node --test tests/yjj-stages.test.js
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_SET, stageForPhase, POSE_CLIP, poseUrl } from "../js/data/cards.js";
import { supported } from "../js/core/coach.js";

const PHASES = ["prep", "hold", "breathe", "rest"];
const CLIPS = new Set(Object.values(POSE_CLIP));

describe("yijinjing-12 stages", () => {
  it("has twelve moves", () => {
    assert.equal(SAMPLE_SET.id, "yijinjing-12");
    assert.equal(SAMPLE_SET.segments.length, 12);
  });

  it("each move has prep/hold/breathe/rest with clip + check + cues", () => {
    for (const seg of SAMPLE_SET.segments) {
      assert.ok(Array.isArray(seg.stages), `${seg.id} stages`);
      assert.equal(seg.stages.length, 4, `${seg.id} four stages`);
      for (const phase of PHASES) {
        const st = stageForPhase(seg, phase);
        assert.ok(st, `${seg.id} ${phase}`);
        assert.ok(st.clip.endsWith(".webp"), `${seg.id} ${phase} clip`);
        assert.ok(CLIPS.has(st.clip) || st.clip === seg.pose, `${seg.id} known clip`);
        assert.ok(st.check, `${seg.id} ${phase} check`);
        assert.ok(st.cue?.zh && st.cue?.en, `${seg.id} ${phase} cue`);
        assert.ok(st.breath?.zh && st.breath?.en, `${seg.id} ${phase} breath`);
        assert.ok(poseUrl(st.clip).includes("/poses/"), "pose url");
      }
    }
  });

  it("coach supports every stage check target", () => {
    const set = new Set(supported);
    for (const seg of SAMPLE_SET.segments) {
      for (const st of seg.stages) {
        assert.ok(set.has(st.check), `${seg.id} check ${st.check}`);
      }
    }
  });

  it("guide clips differ across moves (not one global STAGE_POSES)", () => {
    const holdClips = SAMPLE_SET.segments.map(
      (seg) => stageForPhase(seg, "hold").clip,
    );
    const unique = new Set(holdClips);
    assert.ok(unique.size >= 4, `expected varied hold clips, got ${[...unique]}`);
  });
});
