import { readFileSync, writeFileSync } from "node:fs";

const articlePack = JSON.parse(readFileSync(new URL("../data/article-mastery.json", import.meta.url), "utf8"));
const PERSONS = [
  { pronoun: "εγώ", english: "I", person: "first-person singular" },
  { pronoun: "εσύ", english: "you", person: "second-person singular" },
  { pronoun: "αυτός", english: "he", person: "third-person singular" },
  { pronoun: "αυτή", english: "she", person: "third-person singular" },
  { pronoun: "εμείς", english: "we", person: "first-person plural" },
  { pronoun: "εσείς", english: "you (plural/polite)", person: "second-person plural" },
  { pronoun: "αυτοί", english: "they", person: "third-person plural" },
];

const VERBS = {
  είμαι: { english: "be", forms: ["είμαι", "είσαι", "είναι", "είναι", "είμαστε", "είστε", "είναι"], englishForms: ["I am", "you are", "he is", "she is", "we are", "you are (plural/polite)", "they are"] },
  μένω: { english: "live/stay", forms: ["μένω", "μένεις", "μένει", "μένει", "μένουμε", "μένετε", "μένουν"], englishForms: ["I live/stay", "you live/stay", "he lives/stays", "she lives/stays", "we live/stay", "you live/stay (plural/polite)", "they live/stay"] },
  δουλεύω: { english: "work", forms: ["δουλεύω", "δουλεύεις", "δουλεύει", "δουλεύει", "δουλεύουμε", "δουλεύετε", "δουλεύουν"], englishForms: ["I work", "you work", "he works", "she works", "we work", "you work (plural/polite)", "they work"] },
  γράφω: { english: "write", forms: ["γράφω", "γράφεις", "γράφει", "γράφει", "γράφουμε", "γράφετε", "γράφουν"], englishForms: ["I write", "you write", "he writes", "she writes", "we write", "you write (plural/polite)", "they write"] },
  διαβάζω: { english: "read/study", forms: ["διαβάζω", "διαβάζεις", "διαβάζει", "διαβάζει", "διαβάζουμε", "διαβάζετε", "διαβάζουν"], englishForms: ["I read/study", "you read/study", "he reads/studies", "she reads/studies", "we read/study", "you read/study (plural/polite)", "they read/study"] },
  αγοράζω: { english: "buy", forms: ["αγοράζω", "αγοράζεις", "αγοράζει", "αγοράζει", "αγοράζουμε", "αγοράζετε", "αγοράζουν"], englishForms: ["I buy", "you buy", "he buys", "she buys", "we buy", "you buy (plural/polite)", "they buy"] },
  έχω: { english: "have", forms: ["έχω", "έχεις", "έχει", "έχει", "έχουμε", "έχετε", "έχουν"], englishForms: ["I have", "you have", "he has", "she has", "we have", "you have (plural/polite)", "they have"] },
  πάω: { english: "go", forms: ["πάω", "πας", "πάει", "πάει", "πάμε", "πάτε", "πάνε"], englishForms: ["I go", "you go", "he goes", "she goes", "we go", "you go (plural/polite)", "they go"] },
  λέω: { english: "say / be called", forms: ["λέω", "λες", "λέει", "λέει", "λέμε", "λέτε", "λένε"], englishForms: ["I say / am called", "you say / are called", "he says / is called", "she says / is called", "we say / are called", "you say / are called (plural/polite)", "they say / are called"] },
  θέλω: { english: "want", forms: ["θέλω", "θέλεις", "θέλει", "θέλει", "θέλουμε", "θέλετε", "θέλουν"], englishForms: ["I want", "you want", "he wants", "she wants", "we want", "you want (plural/polite)", "they want"] },
};

function englishMeaning(lemma, personIndex, negative = false) {
  const affirmative = VERBS[lemma].englishForms[personIndex];
  if (!negative) return affirmative;
  if (lemma === "είμαι") return affirmative.replace(/ (am|are|is)/, " $1 not");
  const subject = PERSONS[personIndex].english;
  const helper = personIndex === 2 || personIndex === 3 ? "does not" : "do not";
  return `${subject} ${helper} ${VERBS[lemma].english}`;
}

function rotate(items, offset) {
  const n = offset % items.length;
  return items.slice(n).concat(items.slice(0, n));
}

function threeOptions(answer, candidates, offset = 0) {
  const unique = [...new Set([answer, ...candidates.filter(Boolean)])];
  if (unique.length < 3) throw new Error(`Not enough options for ${answer}`);
  return rotate(unique.slice(0, 3), offset);
}

function word(greek, english, family = "form") {
  return { greek, noun: greek.split(" ").at(-1), article: "", family, english };
}

function exercise(id, instruction, prompt, answer, candidates, explanation, audioText = null, kind = "form") {
  return { id, kind, audioText, instruction, prompt, options: threeOptions(answer, candidates, Number(id.split("-").at(-1))), answer, explanation };
}

function paradigmExercise({ unit, worksheet, item, lemma, mode = "fill", negative = false, question = false, listen = false }) {
  const verb = VERBS[lemma];
  const personIndex = (item + worksheet) % PERSONS.length;
  const person = PERSONS[personIndex];
  const form = verb.forms[personIndex];
  const prefix = negative ? "δεν " : "";
  const punctuation = question ? ";" : ".";
  const full = `${person.pronoun} ${prefix}${form}${punctuation}`;
  const id = `U${unit}-W${worksheet}-${String(item + 1).padStart(3, "0")}`;
  const formCandidates = [...new Set(verb.forms)].filter((candidate) => candidate !== form);

  if (mode === "meaning") {
    const answer = englishMeaning(lemma, personIndex, negative);
    const candidates = PERSONS.map((_, index) => englishMeaning(lemma, index, negative)).filter((value) => value !== answer);
    return exercise(id, listen ? "Listen, then choose the closest English meaning." : "Choose the closest English meaning.", listen ? "Audio item" : full, answer, candidates, `${person.pronoun} is ${person.english}; ${form} is the matching form of ${lemma}.`, listen ? full.replace(/[.;]$/, "") : null, "meaning");
  }
  if (mode === "sentence") {
    const candidates = formCandidates.map((candidate) => `${person.pronoun} ${prefix}${candidate}${punctuation}`);
    return exercise(id, listen ? "Listen, then choose the complete sentence." : "Choose the complete correct sentence.", listen ? "Audio item" : englishMeaning(lemma, personIndex, negative), full, candidates, `${person.pronoun} requires ${form}.`, listen ? full.replace(/[.;]$/, "") : null, question ? "question" : "sentence");
  }
  return exercise(id, listen ? `Listen, then choose the correct form of ${lemma}.` : `Choose the correct form of ${lemma}.`, listen ? "Audio item" : `${person.pronoun} ${negative ? "δεν " : ""}___${punctuation}`, form, formCandidates, `${person.pronoun} takes ${form}.`, listen ? full.replace(/[.;]$/, "") : null, question ? "question" : "conjugation");
}

function makeVerbUnit({ unitNumber, title, objective, lemmas, labels }) {
  const phases = [
    ["Singular: εγώ and εσύ", "Learn the first two singular forms before adding another person.", [0, 1], "fill"],
    ["Third-person singular", "Use the same third-person form with αυτός and αυτή.", [2, 3], "fill"],
    ["Contrast the singular forms", "Choose among first, second and third person singular.", [0, 1, 2, 3], "fill"],
    ["Plural: εμείς", "Attach the first-person plural ending to the verb stem.", [4], "fill"],
    ["Plural and polite εσείς", "Use the second-person plural form for several people or polite singular address.", [5], "fill"],
    ["Third-person plural", "Use the third-person plural form with αυτοί.", [6], "fill"],
    ["Contrast all persons", "Select the verb form that agrees with the grammatical person.", [0, 1, 2, 3, 4, 5, 6], "fill"],
    ["Recognize complete sentences", "Read the pronoun and verb together as one agreement pattern.", [0, 1, 2, 4, 5, 6], "sentence"],
    ["Meaning from person and form", "Connect the Greek person-and-verb combination to its English meaning.", [0, 1, 2, 4, 5, 6], "meaning"],
    ["Pronouns may be omitted", "Greek verb endings usually identify the person, so a pronoun is often unnecessary.", [0, 1, 2, 4, 5, 6], "fill"],
    ["Mixed singular retrieval", "Retrieve singular forms without following a fixed order.", [3, 1, 0, 2], "fill"],
    ["Mixed plural retrieval", "Retrieve plural forms without following a fixed order.", [6, 4, 5], "fill"],
    ["Singular and plural contrast", "Distinguish similar-looking forms across number.", [0, 4, 1, 5, 2, 6], "fill"],
    ["Controlled adult contexts", "Use the conjugation accurately before adding open-ended production.", [0, 1, 2, 4, 5, 6], "sentence"],
    ["Fast form recognition", "Build automaticity through repeated accurate retrieval.", [0, 1, 2, 4, 5, 6], "fill"],
    ["Listening: identify the form", "Hear the complete sentence, then match its grammatical person.", [0, 1, 2, 4, 5, 6], "meaning"],
    ["Listening: match the sentence", "Listen for both pronoun and verb ending.", [0, 1, 2, 4, 5, 6], "sentence"],
    ["Cumulative retrieval I", "Mix every form introduced in this unit.", [0, 1, 2, 3, 4, 5, 6], "fill"],
    ["Cumulative retrieval II", "Alternate form, sentence and meaning decisions.", [0, 1, 2, 4, 5, 6], "sentence"],
    ["Unit mastery assessment", "Demonstrate accurate recognition, recall and listening across the full unit.", [0, 1, 2, 3, 4, 5, 6], "mixed"],
  ];

  const worksheets = phases.map(([phaseTitle, rule, people, mode], index) => {
    const worksheetNumber = index + 1;
    const lemma = lemmas[index % lemmas.length];
    const chosen = VERBS[lemma];
    const personList = people;
    const exercises = Array.from({ length: 10 }, (_, item) => {
      const currentLemma = index >= 17 ? lemmas[(item + index) % lemmas.length] : lemma;
      const actualMode = mode === "mixed" ? ["fill", "sentence", "meaning"][item % 3] : mode;
      const personIndex = personList[item % personList.length];
      const shifted = (personIndex - ((item + worksheetNumber) % PERSONS.length) + PERSONS.length) % PERSONS.length;
      return paradigmExercise({ unit: unitNumber, worksheet: worksheetNumber, item: item + shifted, lemma: currentLemma, mode: actualMode, listen: index === 15 || index === 16 || index === 19 });
    });
    const focusPeople = [...new Set(personList)].slice(0, 6);
    return {
      id: `U${unitNumber}-W${worksheetNumber}`, code: `U${unitNumber}–W${worksheetNumber}`,
      unitNumber, unitTitle: title, sequence: worksheetNumber, estimatedMinutes: 6,
      masteryFirstAttempt: 9, title: `${phaseTitle}: ${lemma}`,
      rule: `${rule} Today the focus verb is ${lemma} (${chosen.english}).`,
      ruleSteps: ["Read the subject first.", "Retrieve the matching verb form.", "Say the correct pair aloud before selecting."],
      words: focusPeople.map((personIndex) => word(`${PERSONS[personIndex].pronoun} ${chosen.forms[personIndex]}`, chosen.englishForms[personIndex], labels || "conjugation")),
      knownWordCount: new Set(lemmas.slice(0, (index % lemmas.length) + 1)).size,
      exercises: exercises.map((item, itemIndex) => ({ ...item, id: `U${unitNumber}-W${worksheetNumber}-${String(itemIndex + 1).padStart(3, "0")}` })),
    };
  });
  return { unitNumber, title, objective, totalWorksheets: 20, totalExercises: 200, worksheets };
}

function makeUnit2() {
  const unit = makeVerbUnit({ unitNumber: 2, title: "είμαι and personal pronouns", objective: "Conjugate είμαι and match each form to its grammatical person.", lemmas: ["είμαι"], labels: "είμαι pattern" });
  unit.worksheets[9].rule = "Greek often omits subject pronouns because the verb ending identifies the person. Use the pronoun while learning the pattern, then recognize the verb alone.";
  return unit;
}

function makeUnit3() {
  const stages = [
    ["Affirmative statements", "A basic Greek statement can be subject + verb: Εγώ είμαι.", false, false],
    ["Negation with δεν", "Put δεν immediately before the verb: Εγώ δεν είμαι.", true, false],
    ["Contrast affirmative and negative", "The word δεν changes an affirmative statement into a negative one.", "mix", false],
    ["Yes–no questions", "A yes–no question can keep statement word order; voice and the Greek question mark show the question: Είσαι εδώ;", false, true],
    ["Negative yes–no questions", "Place δεν before the verb inside a question: Δεν είσαι εδώ;", true, true],
    ["Statements versus questions", "Greek uses a semicolon-shaped question mark (;) at the end of a direct question.", "mix", "mix"],
    ["Answer with ναι", "Use ναι for yes, followed by a complete known statement when useful.", false, true],
    ["Answer with όχι", "Use όχι for no; the following negative statement still needs δεν.", true, true],
    ["εγώ and εσύ contrasts", "Match first- and second-person forms inside statements and questions.", "mix", "mix"],
    ["Third-person contrasts", "Use είναι for αυτός and αυτή in statements, negatives and questions.", "mix", "mix"],
    ["Plural statements", "Use είμαστε, είστε and είναι with plural subjects.", false, false],
    ["Plural negatives", "The negative marker does not change: δεν comes before every plural verb form.", true, false],
    ["Plural questions", "Keep the correct plural verb and finish the question with (;).", false, true],
    ["Polite εσείς questions", "Use εσείς and είστε when addressing one person politely.", false, true],
    ["Short answers", "Ναι confirms; όχι rejects. Add a correct statement when clarity is needed.", "mix", "mix"],
    ["Listening: statement or question", "Listen for question intonation while also reading the punctuation.", "mix", "mix"],
    ["Listening: affirmative or negative", "Listen specifically for δεν immediately before the verb.", "mix", false],
    ["Mixed sentence control", "Choose accurate person, negation and punctuation together.", "mix", "mix"],
    ["Cumulative communication", "Distinguish statements, negative statements and yes–no questions.", "mix", "mix"],
    ["Unit mastery assessment", "Demonstrate control of basic statements, questions and negation.", "mix", "mix"],
  ];
  const worksheets = stages.map(([title, rule, negativeMode, questionMode], index) => {
    const worksheet = index + 1;
    const exercises = Array.from({ length: 10 }, (_, item) => {
      if (index === 6 || index === 7 || index === 14) {
        const yes = index === 6 ? true : index === 7 ? false : item % 2 === 0;
        const answer = yes ? "Ναι, είμαι εδώ." : "Όχι, δεν είμαι εδώ.";
        const id = `U3-W${worksheet}-${String(item + 1).padStart(3, "0")}`;
        return exercise(id, `Choose the complete ${yes ? "yes" : "no"} answer.`, "Είσαι εδώ;", answer, yes ? ["Όχι, δεν είμαι εδώ.", "Ναι, είσαι εδώ."] : ["Ναι, είμαι εδώ.", "Όχι, δεν είσαι εδώ."], yes ? "Ναι confirms the question; είμαι matches the speaker." : "Όχι rejects the question, and δεν makes the answer negative.", null, "response");
      }
      const negative = negativeMode === "mix" ? item % 2 === 1 : negativeMode;
      const question = questionMode === "mix" ? item % 3 === 2 : questionMode;
      const mode = index >= 17 ? ["fill", "sentence", "meaning"][item % 3] : index >= 14 ? "sentence" : "fill";
      return paradigmExercise({ unit: 3, worksheet, item, lemma: "είμαι", mode, negative, question, listen: index === 15 || index === 16 || index === 19 });
    });
    return {
      id: `U3-W${worksheet}`, code: `U3–W${worksheet}`, unitNumber: 3,
      unitTitle: "Statements, questions and negation", sequence: worksheet,
      estimatedMinutes: 6, masteryFirstAttempt: 9, title, rule,
      ruleSteps: ["Find the subject and correct form of είμαι.", "Put δεν directly before the verb when the meaning is negative.", "Use (;) only when the sentence is a question."],
      words: [word("ναι", "yes", "response"), word("όχι", "no", "response"), word("δεν", "not", "negative marker")],
      knownWordCount: 3, exercises,
    };
  });
  return { unitNumber: 3, title: "Statements, questions and negation", objective: "Form basic affirmative statements, negative statements and yes–no questions.", totalWorksheets: 20, totalExercises: 200, worksheets };
}

function makeMultiVerbUnit({ unitNumber, title, objective, lemmas, label }) {
  const plans = [];
  for (const lemma of lemmas) {
    plans.push(
      { lemma, title: `${lemma}: singular forms`, people: [0, 1, 2, 3], mode: "fill", rule: `Learn the singular present forms of ${lemma} (${VERBS[lemma].english}).` },
      { lemma, title: `${lemma}: plural forms`, people: [4, 5, 6], mode: "fill", rule: `Learn the plural present forms of ${lemma} (${VERBS[lemma].english}).` },
      { lemma, title: `${lemma}: all persons`, people: [0, 1, 2, 4, 5, 6], mode: "sentence", rule: `Contrast singular and plural forms of ${lemma}.` },
    );
  }
  while (plans.length < 16) {
    const lemma = lemmas[plans.length % lemmas.length];
    plans.push({ lemma, title: `${lemma}: retrieval review`, people: [0, 1, 2, 4, 5, 6], mode: "meaning", rule: `Retrieve complete ${lemma} combinations from meaning.` });
  }
  plans.push(
    { title: "First-person contrast", people: [0, 4], mode: "fill", rule: "Contrast I and we forms across all verbs." },
    { title: "Second-person contrast", people: [1, 5], mode: "sentence", rule: "Contrast singular you with plural or polite you across all verbs." },
    { title: "Third-person and listening review", people: [2, 3, 6], mode: "meaning", rule: "Distinguish singular and plural third-person forms by listening." },
    { title: "Unit mastery assessment", people: [0, 1, 2, 3, 4, 5, 6], mode: "mixed", rule: "Demonstrate accurate form, sentence and meaning choices across the entire unit." },
  );

  const worksheets = plans.slice(0, 20).map((plan, index) => {
    const worksheet = index + 1;
    const activeLemmas = plan.lemma ? [plan.lemma] : lemmas;
    const exercises = Array.from({ length: 10 }, (_, item) => {
      const lemma = activeLemmas[item % activeLemmas.length];
      const desiredPerson = plan.people[item % plan.people.length];
      const shifted = (desiredPerson - ((item + worksheet) % PERSONS.length) + PERSONS.length) % PERSONS.length;
      const mode = plan.mode === "mixed" ? ["fill", "sentence", "meaning"][item % 3] : plan.mode;
      const built = paradigmExercise({ unit: unitNumber, worksheet, item: item + shifted, lemma, mode, listen: index >= 18 });
      return { ...built, id: `U${unitNumber}-W${worksheet}-${String(item + 1).padStart(3, "0")}` };
    });
    const focusLemma = plan.lemma || lemmas[0];
    const focusPeople = [...new Set(plan.people)].slice(0, 6);
    return {
      id: `U${unitNumber}-W${worksheet}`, code: `U${unitNumber}–W${worksheet}`,
      unitNumber, unitTitle: title, sequence: worksheet, estimatedMinutes: 6,
      masteryFirstAttempt: 9, title: plan.title,
      rule: `${plan.rule} The subject and verb ending must agree.`,
      ruleSteps: ["Identify the grammatical person.", "Recall the matching verb ending or irregular form.", "Read the complete combination aloud before selecting."],
      words: focusPeople.map((personIndex) => word(`${PERSONS[personIndex].pronoun} ${VERBS[focusLemma].forms[personIndex]}`, VERBS[focusLemma].englishForms[personIndex], label)),
      knownWordCount: activeLemmas.length,
      exercises,
    };
  });
  return { unitNumber, title, objective, totalWorksheets: 20, totalExercises: 200, worksheets };
}

function makeUnit4() {
  return makeMultiVerbUnit({ unitNumber: 4, title: "Regular present-tense verbs", objective: "Conjugate common regular verbs in the present tense.", lemmas: ["μένω", "δουλεύω", "γράφω", "διαβάζω", "αγοράζω"], label: "regular verb" });
}

function makeUnit5() {
  return makeMultiVerbUnit({ unitNumber: 5, title: "High-frequency verbs", objective: "Use έχω, πάω, λέω and θέλω accurately in the present tense.", lemmas: ["έχω", "πάω", "λέω", "θέλω"], label: "high-frequency verb" });
}

const unit1 = {
  unitNumber: 1,
  title: "Articles and noun gender",
  objective: "Choose ο, η and το with singular nouns and distinguish definite from indefinite forms.",
  totalWorksheets: 20,
  totalExercises: 200,
  worksheets: articlePack.worksheets.map((worksheet) => ({ ...worksheet, code: `U1–W${worksheet.sequence}`, unitNumber: 1, unitTitle: "Articles and noun gender" })),
};

const units = [unit1, makeUnit2(), makeUnit3(), makeUnit4(), makeUnit5()];
const output = {
  courseId: "modern-greek-a1",
  title: "Modern Greek A1 Foundations",
  version: "0.4.0",
  totalUnits: units.length,
  totalWorksheets: units.reduce((sum, unit) => sum + unit.totalWorksheets, 0),
  totalExercises: units.reduce((sum, unit) => sum + unit.totalExercises, 0),
  reviewIntervalsDays: [1, 3, 7, 21, 60],
  units,
  worksheets: units.flatMap((unit) => unit.worksheets),
};

writeFileSync(new URL("../data/a1-foundations.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
