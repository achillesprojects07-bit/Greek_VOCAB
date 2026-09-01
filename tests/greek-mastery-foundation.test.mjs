import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));

test("all five purposeful navigation destinations exist", () => {
  for (const label of ["Today", "Path", "Practice", "Vocabulary", "Review"]) assert.match(page, new RegExp(`label: "${label}"`));
});

test("lesson has safe completion gates", () => {
  assert.match(page, /!allSubmitted \|\| score < 4 \|\| progress\.writing/);
  assert.match(page, /lessonCompleted: true, reviewDue: true/);
});

test("Greek orthography and full-form curriculum rules are preserved", () => {
  assert.doesNotMatch(page, /\bΚι\b/u);
  for (const item of ["ο λογαριασμός", "η είσοδος", "το μουσείο"]) assert.match(page, new RegExp(item));
});

test("offline installation metadata is present", () => {
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#123b66");
});
