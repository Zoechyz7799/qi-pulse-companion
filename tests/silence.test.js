import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

function sourceFiles(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name === "dist" || name === "tests") continue;
    if (statSync(path).isDirectory()) sourceFiles(path, found);
    else if (/\.(js|html|css|mjs)$/.test(name)) found.push(path);
  }
  return found;
}

test("the page never asks for a camera or microphone", () => {
  const banned = [
    "getUserMedia",
    "mediaDevices",
    "getDisplayMedia",
    "MediaStream",
    "microphone",
    "camera",
    "webkitGetUserMedia",
  ];
  const files = sourceFiles(ROOT);
  assert.ok(files.some((file) => file.endsWith("tracker.js")));
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const word of banned) {
      if (text.includes(word)) hits.push(`${file} contains ${word}`);
    }
  }
  assert.deepEqual(hits, []);
});
