/**
 * Thin MediaPipe Pose Landmarker loader (CDN). No UI.
 */

const VISION_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let visionPromise = null;
let landmarkerPromise = null;

async function loadVision() {
  if (!visionPromise) {
    visionPromise = import(VISION_CDN);
  }
  return visionPromise;
}

export async function createPoseLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const vision = await loadVision();
    const { FilesetResolver, PoseLandmarker } = vision;
    const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
    return PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  })();
  try {
    return await landmarkerPromise;
  } catch (err) {
    landmarkerPromise = null;
    throw err;
  }
}

/**
 * @param {import('@mediapipe/tasks-vision').PoseLandmarkerResult | null} result
 */
export function summarizePose(result) {
  const landmarks = result?.landmarks?.[0] || null;
  const worldLandmarks = result?.worldLandmarks?.[0] || null;
  if (!landmarks || landmarks.length < 25) {
    return {
      detected: false,
      score: 0,
      nose: null,
      shoulders: null,
      landmarks: null,
      worldLandmarks: null,
    };
  }
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const visible = landmarks.filter((p) => (p.visibility ?? 1) > 0.5).length;
  return {
    detected: true,
    score: Math.round((visible / landmarks.length) * 100),
    nose: { x: round(nose.x), y: round(nose.y) },
    shoulders: {
      left: { x: round(leftShoulder.x), y: round(leftShoulder.y) },
      right: { x: round(rightShoulder.x), y: round(rightShoulder.y) },
    },
    landmarks,
    worldLandmarks,
  };
}

function round(n) {
  return Math.round(Number(n) * 1000) / 1000;
}
