import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const curriculum = JSON.parse(readFileSync(new URL("../data/article-mastery.json", import.meta.url), "utf8"));

test("all five purposeful navigation destinations exist", () => {
  for (const label of ["Today", "Path", "Practice", "Vocabulary", "Review"]) assert.match(page, new RegExp(`label: "${label}"`));
});

test("the article pack contains twenty sequential worksheets and 200 exercises", () => {
  assert.equal(curriculum.totalWorksheets, 20);
  assert.equal(curriculum.totalExercises, 200);
  assert.equal(curriculum.worksheets.length, 20);
  const exercises = curriculum.worksheets.flatMap((worksheet) => worksheet.exercises);
  assert.equal(exercises.length, 200);
  assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 200);
  curriculum.worksheets.forEach((worksheet, index) => {
    assert.equal(worksheet.id, `ART-A${index + 1}`);
    assert.equal(worksheet.sequence, index + 1);
    assert.equal(worksheet.exercises.length, 10);
    assert.ok(worksheet.rule.length > 30);
    assert.equal(worksheet.ruleSteps.length, 3);
  });
});

test("every exercise is complete, selectable and self-explaining", () => {
  for (const item of curriculum.worksheets.flatMap((worksheet) => worksheet.exercises)) {
    assert.ok(item.prompt, `${item.id} prompt`);
    assert.ok(item.instruction, `${item.id} instruction`);
    assert.ok(item.explanation, `${item.id} explanation`);
    assert.equal(item.options.length, 3, `${item.id} options`);
    assert.ok(item.options.includes(item.answer), `${item.id} answer must appear in options`);
  }
});

test("mastery, correction, locking and spaced-review gates are implemented", () => {
  assert.match(page, /Correct this item/);
  assert.match(page, /firstAttempt >= worksheet\.masteryFirstAttempt/);
  assert.match(page, /progress\.items\[worksheets\[index - 1\]\.id\]\?\.mastered/);
  assert.match(page, /reviewIntervals/);
  assert.deepEqual(curriculum.reviewIntervalsDays, [1, 3, 7, 21, 60]);
});

test("Greek orthography and full-form rules are preserved", () => {
  const combined = `${page}\n${JSON.stringify(curriculum)}`;
  assert.doesNotMatch(combined, /\bΚι\b/u);
  for (const item of ["το νερό", "το ψωμί", "το σπίτι", "η είσοδος", "ο καφές"]) assert.match(combined, new RegExp(item));
});

test("listening and installation metadata are present", () => {
  assert.match(page, /speechSynthesis/);
  assert.ok(curriculum.worksheets.flatMap((worksheet) => worksheet.exercises).some((item) => item.audioText));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#123b66");
});
