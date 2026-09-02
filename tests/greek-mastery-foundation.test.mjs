import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const curriculum = JSON.parse(readFileSync(new URL("../data/article-mastery.json", import.meta.url), "utf8"));
const worksheet = curriculum.worksheets[0];

test("all five purposeful navigation destinations exist", () => {
  for (const label of ["Today", "Path", "Practice", "Vocabulary", "Review"]) assert.match(page, new RegExp(`label: "${label}"`));
});

test("worksheet has safe mastery and correction gates", () => {
  assert.match(page, /score !== quiz\.length \|\| firstAttemptScore < worksheet\.masteryFirstAttempt/);
  assert.match(page, /Correct this item/);
  assert.match(page, /Repeat worksheet A1/);
  assert.match(page, /lessonCompleted: true, reviewDue: true/);
});

test("Greek orthography and full-form curriculum rules are preserved", () => {
  const combined = `${page}\n${JSON.stringify(curriculum)}`;
  assert.doesNotMatch(combined, /\bΚι\b/u);
  for (const item of ["το νερό", "το ψωμί", "το σπίτι"]) assert.match(combined, new RegExp(item));
});

test("worksheet A1 contains ten complete validated exercises", () => {
  assert.equal(worksheet.id, "ART-A1");
  assert.equal(worksheet.exercises.length, 10);
  assert.equal(worksheet.words.length, 3);
  assert.equal(new Set(worksheet.exercises.map((item) => item.id)).size, 10);
  for (const item of worksheet.exercises) {
    assert.ok(item.prompt);
    assert.ok(item.instruction);
    assert.ok(item.explanation);
    assert.equal(item.options.length, 3);
    assert.ok(item.options.includes(item.answer), `${item.id} answer must appear in its options`);
  }
});

test("offline installation metadata is present", () => {
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#123b66");
});
