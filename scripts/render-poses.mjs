import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../public/poses");
mkdirSync(outDir, { recursive: true });

const defs = `
  <defs>
    <radialGradient id="fur" cx="36%" cy="30%" r="72%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="62%" stop-color="#f4f4f2"/>
      <stop offset="100%" stop-color="#e4e4e0"/>
    </radialGradient>
    <radialGradient id="nose" cx="34%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#5a5a5a"/>
      <stop offset="42%" stop-color="#1c1c1c"/>
      <stop offset="100%" stop-color="#070707"/>
    </radialGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7f8fa"/>
      <stop offset="100%" stop-color="#d5dae2"/>
    </linearGradient>
  </defs>`;

function eyeOpen(cx, cy, r = 7.5) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#161616"/>`;
}

function eyeShut(cx, cy) {
  return `<path d="M${cx - 9} ${cy}c4 6 14 6 18 0" fill="none" stroke="#161616" stroke-width="3.2" stroke-linecap="round"/>`;
}

function limb(d) {
  return `<path d="${d}" fill="none" stroke="#161616" stroke-width="16" stroke-linecap="round"/>`;
}

function hand(x, y) {
  return `<circle cx="${x}" cy="${y}" r="11" fill="#161616"/>`;
}

function foot(x, y, rx = 26) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="13" fill="#161616"/>`;
}

function shadow() {
  return `<ellipse cx="180" cy="424" rx="78" ry="11" fill="#1c1915" opacity="0.12"/>`;
}

function ears() {
  return `
  <path d="M150 178 C146 124 128 86 148 74 C166 86 174 128 170 178 Z" fill="url(#fur)"/>
  <path d="M186 172 C208 120 242 82 258 94 C260 116 226 146 204 176 Z" fill="url(#fur)"/>`;
}

function body() {
  return `
  <path d="M96 292
           C86 196 112 132 168 128
           C230 122 286 186 274 292
           C264 392 112 404 96 292 Z" fill="url(#fur)"/>
  <ellipse cx="142" cy="210" rx="34" ry="20" fill="#ffffff" opacity="0.5"/>`;
}

function sideFigure({ eye, leftArm, leftHand, rightArm, rightHand, laptop = "", waveMarks = "" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 460">
  ${defs}
  ${shadow()}
  <ellipse cx="72" cy="328" rx="26" ry="24" fill="url(#fur)"/>
  ${ears()}
  ${body()}
  ${eye}
  <circle cx="274" cy="206" r="42" fill="url(#nose)"/>
  <ellipse cx="256" cy="190" rx="14" ry="9" fill="#ffffff" opacity="0.4"/>
  ${limb(leftArm)}
  ${limb(rightArm)}
  ${laptop}
  ${hand(...leftHand)}
  ${hand(...rightHand)}
  ${waveMarks}
  ${foot(146, 400, 24)}
  ${foot(210, 404, 26)}
</svg>`;
}

function laptop(tilt = -8) {
  return `
  <g transform="translate(132 286)">
    <rect x="18" y="58" width="168" height="16" rx="5" fill="#b7bdc6"/>
    <rect x="62" y="70" width="80" height="6" rx="2" fill="#8e96a2"/>
    <g transform="rotate(${tilt} 102 58)">
      <rect x="22" y="-58" width="150" height="104" rx="10" fill="url(#lid)" stroke="#c5cbd4" stroke-width="2"/>
      <rect x="32" y="-48" width="130" height="82" rx="6" fill="#eef1f5"/>
      <path d="M86 -14c14 1 24 9 30 9-8 7-20 9-30 7-9-3-16-9-16-9s7-6 16-7z" fill="#8d97a3"/>
      <circle cx="114" cy="-8" r="1.5" fill="#8d97a3"/>
    </g>
  </g>`;
}

const poses = {
  "idle-stand.svg": sideFigure({
    eye: eyeOpen(214, 196),
    leftArm: "M118 268 C100 304 102 348 120 362",
    leftHand: [122, 370],
    rightArm: "M228 274 C246 308 242 346 224 360",
    rightHand: [220, 368],
  }),
  "idle-blink.svg": sideFigure({
    eye: eyeShut(214, 198),
    leftArm: "M118 270 C102 306 104 346 120 360",
    leftHand: [122, 368],
    rightArm: "M228 276 C244 308 240 344 224 358",
    rightHand: [220, 366],
  }),
  "idle-soft.svg": sideFigure({
    eye: eyeOpen(214, 198, 7),
    leftArm: "M114 264 C90 298 92 344 116 360",
    leftHand: [118, 368],
    rightArm: "M232 270 C256 300 254 342 232 358",
    rightHand: [228, 366],
  }),
  "work-1.svg": sideFigure({
    eye: eyeOpen(214, 198),
    laptop: laptop(-8),
    leftArm: "M124 286 C138 324 156 348 168 338",
    leftHand: [172, 332],
    rightArm: "M236 288 C224 326 206 350 192 338",
    rightHand: [188, 332],
  }),
  "work-2.svg": sideFigure({
    eye: eyeOpen(212, 196),
    laptop: laptop(-10),
    leftArm: "M128 276 C146 236 176 228 196 252",
    leftHand: [204, 258],
    rightArm: "M234 290 C220 328 200 350 186 338",
    rightHand: [182, 332],
  }),
  "work-3.svg": sideFigure({
    eye: eyeShut(214, 198),
    laptop: laptop(-7),
    leftArm: "M122 292 C140 332 162 352 176 340",
    leftHand: [180, 334],
    rightArm: "M240 280 C250 312 226 344 204 336",
    rightHand: [198, 330],
  }),
  "alert-wave.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 460">
  ${defs}
  ${shadow()}
  <ellipse cx="78" cy="330" rx="26" ry="24" fill="url(#fur)"/>
  <path d="M132 176 C128 122 108 82 128 70 C148 84 156 128 152 176 Z" fill="url(#fur)"/>
  <path d="M196 172 C218 118 252 80 268 94 C270 116 236 146 214 174 Z" fill="url(#fur)"/>
  <path d="M88 292 C78 196 108 140 176 134 C246 128 292 190 278 292 C268 396 104 408 88 292 Z" fill="url(#fur)"/>
  <ellipse cx="176" cy="188" rx="40" ry="20" fill="#ffffff" opacity="0.45"/>
  ${eyeOpen(148, 186)}
  ${eyeOpen(214, 184)}
  <circle cx="182" cy="214" r="42" fill="url(#nose)"/>
  <ellipse cx="164" cy="198" rx="14" ry="9" fill="#ffffff" opacity="0.4"/>
  ${limb("M118 268 C96 300 98 340 120 356")}
  ${hand(122, 364)}
  ${limb("M236 230 C286 196 312 132 274 92")}
  ${hand(270, 84)}
  <path d="M292 74c12-6 22-4 30 4M300 98c14 0 22 8 24 16" fill="none" stroke="#161616" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
  ${foot(146, 400)}
  ${foot(214, 400, 28)}
</svg>`,
};

for (const [name, svg] of Object.entries(poses)) {
  writeFileSync(join(outDir, name), svg.trim() + "\n");
}

console.log(`wrote ${Object.keys(poses).length} poses to ${outDir}`);
