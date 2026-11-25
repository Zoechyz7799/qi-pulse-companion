/**
 * Pose tracking worker helper for an active MediaStream.
 * Does not request the camera; only consumes a stream provided by cameraFSM.
 */

import { createPoseLandmarker, summarizePose } from "./vendor/mediapipe-pose.js";

/**
 * @param {object} options
 * @param {HTMLVideoElement} options.video
 * @param {(pose: ReturnType<typeof summarizePose>) => void} [options.onPose]
 */
export function createPoseTracker(options) {
  const video = options.video;
  const onPose = options.onPose ?? (() => {});
  let landmarker = null;
  let raf = 0;
  let running = false;
  let lastVideoTime = -1;

  async function attach(stream) {
    await detach();
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => {});
    try {
      landmarker = await createPoseLandmarker();
    } catch (err) {
      onPose({ detected: false, score: 0, nose: null, shoulders: null, error: String(err?.message || err) });
      landmarker = null;
    }
    running = true;
    loop();
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (!landmarker || video.readyState < 2) return;
    if (video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    try {
      const result = landmarker.detectForVideo(video, performance.now());
      onPose(summarizePose(result));
    } catch {
      onPose({ detected: false, score: 0, nose: null, shoulders: null });
    }
  }

  async function detach() {
    running = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    lastVideoTime = -1;
    video.pause?.();
    video.srcObject = null;
    if (landmarker) {
      try {
        landmarker.close?.();
      } catch {
        /* ignore */
      }
      landmarker = null;
    }
  }

  return { attach, detach };
}
