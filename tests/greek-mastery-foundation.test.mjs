import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
const curriculum = JSON.parse(readFileSync(new URL("../data/a1-foundations.json", import.meta.url), "utf8"));

test("all five purposeful navigation destinations exist", () => {
  for (const label of ["Today", "Path", "Practice", "Vocabulary", "Review"]) assert.match(page, new RegExp(`label: "${label}"`));
});

test("compact course drawer keeps earlier units and worksheets reachable", () => {
  assert.match(page, /aria-label="Open course menu"/);
  assert.match(page, /<Sheet/);
  assert.match(page, /aria-label="Select unit"/);
  assert.match(page, /aria-label="Select worksheet"/);
  assert.match(page, /curriculum\.units\.filter\(\(unit\) => unit\.unitNumber === selectedUnit\)/);
  assert.match(page, /disabled=\{!unlocked\}/);
});

test("deep-blue gradient theme keeps primary text dark and bold", () => {
  assert.match(styles, /--navy:#061f3f/);
  assert.match(styles, /--ink:#071425/);
  assert.match(styles, /background:linear-gradient\(180deg,#061f3f/);
  assert.match(styles, /h1,h2,h3,strong\{font-weight:800\}/);
  assert.match(styles, /\.course-menu-button/);
  assert.doesNotMatch(styles, /\.course-selector\{/);
});

test("today screen uses one aligned, responsive learning workspace", () => {
  assert.match(page, /className="topbar-inner"/);
  assert.match(page, /className="today-grid"/);
  assert.match(page, /className="progress-card"/);
  assert.match(page, /className="method-section"/);
  assert.doesNotMatch(page, /worksheets mastered<\/strong>/);
  assert.match(styles, /\.today-grid\{display:grid;grid-template-columns:/);
  assert.match(styles, /\.topbar-inner\{width:min\(1160px/);
  assert.match(styles, /@media\(max-width:760px\)\{\.today-grid\{grid-template-columns:1fr\}/);
});

test("five units contain 100 sequential worksheets and 1,000 exercises", () => {
  assert.equal(curriculum.totalUnits, 5);
  assert.equal(curriculum.totalWorksheets, 100);
  assert.equal(curriculum.totalExercises, 1000);
  assert.equal(curriculum.worksheets.length, 100);
  const exercises = curriculum.worksheets.flatMap((worksheet) => worksheet.exercises);
  assert.equal(exercises.length, 1000);
  assert.equal(new Set(exercises.map((exercise) => exercise.id)).size, 1000);
  curriculum.units.forEach((unit, unitIndex) => {
    assert.equal(unit.unitNumber, unitIndex + 1);
    assert.equal(unit.worksheets.length, 20);
    unit.worksheets.forEach((worksheet, worksheetIndex) => {
      assert.equal(worksheet.sequence, worksheetIndex + 1);
      assert.equal(worksheet.unitNumber, unit.unitNumber);
      assert.equal(worksheet.exercises.length, 10);
      assert.ok(worksheet.rule.length > 30);
      assert.equal(worksheet.ruleSteps.length, 3);
    });
  });
});

test("every exercise is complete, selectable and self-explaining", () => {
  for (const item of curriculum.worksheets.flatMap((worksheet) => worksheet.exercises)) {
    assert.ok(item.prompt, `${item.id} prompt`);
    assert.ok(item.instruction, `${item.id} instruction`);
    assert.ok(item.explanation, `${item.id} explanation`);
    assert.equal(item.options.length, 3, `${item.id} options`);
    assert.equal(new Set(item.options).size, 3, `${item.id} options must be unique`);
    assert.ok(item.options.includes(item.answer), `${item.id} answer must appear in options`);
  }
});

test("units 2 to 5 contain the required Greek grammar forms", () => {
  const text = JSON.stringify(curriculum);
  for (const form of ["είμαι", "είσαι", "είναι", "είμαστε", "είστε"]) assert.match(text, new RegExp(form));
  for (const form of ["Ναι, είμαι εδώ.", "Όχι, δεν είμαι εδώ.", "Είσαι εδώ;"]) assert.match(text, new RegExp(form));
  for (const lemma of ["μένω", "δουλεύω", "γράφω", "διαβάζω", "αγοράζω"]) assert.match(text, new RegExp(lemma));
  for (const lemma of ["έχω", "πάω", "λέω", "θέλω"]) assert.match(text, new RegExp(lemma));
  for (const badGloss of ["I be", "he be", "she work", "he live/stay", "she have", "he go"]) assert.doesNotMatch(text, new RegExp(`"${badGloss}"`));
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
  for (const item of ["το νερό", "το ψωμί", "το σπίτι", "η είσοδος", "ο καφές", "εγώ είμαι"]) assert.match(combined, new RegExp(item));
});

test("listening and installation metadata are present", () => {
  assert.match(page, /speechSynthesis/);
  assert.ok(curriculum.worksheets.flatMap((worksheet) => worksheet.exercises).some((item) => item.audioText));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#061f3f");
});
