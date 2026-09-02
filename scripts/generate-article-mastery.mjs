import { writeFileSync } from "node:fs";

const WORDS = {
  water: { greek: "το νερό", noun: "νερό", article: "το", family: "neuter", english: "the water" },
  bread: { greek: "το ψωμί", noun: "ψωμί", article: "το", family: "neuter", english: "the bread" },
  home: { greek: "το σπίτι", noun: "σπίτι", article: "το", family: "neuter", english: "the house / home" },
  book: { greek: "το βιβλίο", noun: "βιβλίο", article: "το", family: "neuter", english: "the book" },
  table: { greek: "το τραπέζι", noun: "τραπέζι", article: "το", family: "neuter", english: "the table" },
  museum: { greek: "το μουσείο", noun: "μουσείο", article: "το", family: "neuter", english: "the museum" },
  door: { greek: "η πόρτα", noun: "πόρτα", article: "η", family: "feminine", english: "the door" },
  bag: { greek: "η τσάντα", noun: "τσάντα", article: "η", family: "feminine", english: "the bag" },
  kitchen: { greek: "η κουζίνα", noun: "κουζίνα", article: "η", family: "feminine", english: "the kitchen" },
  stop: { greek: "η στάση", noun: "στάση", article: "η", family: "feminine", english: "the stop" },
  receipt: { greek: "η απόδειξη", noun: "απόδειξη", article: "η", family: "feminine", english: "the receipt" },
  salad: { greek: "η σαλάτα", noun: "σαλάτα", article: "η", family: "feminine", english: "the salad" },
  coffee: { greek: "ο καφές", noun: "καφές", article: "ο", family: "masculine", english: "the coffee" },
  road: { greek: "ο δρόμος", noun: "δρόμος", article: "ο", family: "masculine", english: "the road" },
  oven: { greek: "ο φούρνος", noun: "φούρνος", article: "ο", family: "masculine", english: "the oven" },
  bill: { greek: "ο λογαριασμός", noun: "λογαριασμός", article: "ο", family: "masculine", english: "the bill" },
  map: { greek: "ο χάρτης", noun: "χάρτης", article: "ο", family: "masculine", english: "the map" },
  station: { greek: "ο σταθμός", noun: "σταθμός", article: "ο", family: "masculine", english: "the station" },
  name: { greek: "το όνομα", noun: "όνομα", article: "το", family: "neuter", english: "the name" },
  shop: { greek: "το κατάστημα", noun: "κατάστημα", article: "το", family: "neuter", english: "the shop" },
  ticket: { greek: "το εισιτήριο", noun: "εισιτήριο", article: "το", family: "neuter", english: "the ticket" },
  entrance: { greek: "η είσοδος", noun: "είσοδος", article: "η", family: "feminine", english: "the entrance" },
  exit: { greek: "η έξοδος", noun: "έξοδος", article: "η", family: "feminine", english: "the exit" },
  avenue: { greek: "η λεωφόρος", noun: "λεωφόρος", article: "η", family: "feminine", english: "the avenue" }
};

const allKeys = Object.keys(WORDS);
const keysThrough = (key) => allKeys.slice(0, allKeys.indexOf(key) + 1);

const CONFIGS = [
  {
    title: "το + three essential nouns",
    focus: ["water", "bread", "home"],
    pool: ["water", "bread", "home"],
    rule: "το means “the” before one neuter noun. Learn το and the noun together as one vocabulary unit.",
    steps: ["Say το and the noun without separating them.", "Nouns ending in -ο or -ι are often neuter.", "Use the ending only as a clue; keep the article with the noun."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "το + three new neuter nouns",
    focus: ["book", "table", "museum"],
    pool: keysThrough("museum"),
    rule: "The same το rule applies to these new singular neuter nouns.",
    steps: ["Notice the endings -ο and -ι.", "Say the complete unit aloud.", "Old words remain mixed into the worksheet."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "Mix six το-family nouns",
    focus: ["water", "bread", "home", "book", "table", "museum"],
    pool: keysThrough("museum"),
    rule: "All six nouns belong to the το family. Retrieve the complete unit instead of guessing from position.",
    steps: ["Recall the meaning before choosing.", "Use the noun ending as a clue.", "Correct every missed unit immediately."],
    modes: ["meaning", "greek", "article", "meaning", "greek", "article", "meaning", "greek", "article", "greek"]
  },
  {
    title: "Recall το with fewer hints",
    focus: ["water", "bread", "home", "book", "table", "museum"],
    pool: keysThrough("museum"),
    rule: "Recognition is becoming recall: begin from the English meaning and retrieve the whole Greek unit.",
    steps: ["Look away from the word list.", "Recall το together with the noun.", "Use choices only to confirm your retrieval."],
    modes: ["greek", "greek", "meaning", "greek", "article", "greek", "meaning", "greek", "article", "greek"]
  },
  {
    title: "η + three essential feminine nouns",
    focus: ["door", "bag", "kitchen"],
    pool: ["door", "bag", "kitchen"],
    rule: "η means “the” before one feminine noun. Learn η and the noun together.",
    steps: ["Many feminine nouns end in -α or -η.", "Say η with the noun.", "Do not choose the article from the object’s meaning."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "η + three new feminine nouns",
    focus: ["stop", "receipt", "salad"],
    pool: ["door", "bag", "kitchen", "stop", "receipt", "salad"],
    rule: "The η family grows by three nouns while the first three remain in review.",
    steps: ["Notice common -α and -η endings.", "Retrieve η with every noun.", "Old and new words are deliberately mixed."],
    modes: ["article", "greek", "article", "meaning", "greek", "article", "meaning", "greek", "article", "greek"]
  },
  {
    title: "Mix six η-family nouns",
    focus: ["door", "bag", "kitchen", "stop", "receipt", "salad"],
    pool: ["door", "bag", "kitchen", "stop", "receipt", "salad"],
    rule: "All six nouns belong to the η family. Retrieve meaning and article together.",
    steps: ["Recall before looking at the choices.", "Check the ending clue.", "Correct and repeat weak units."],
    modes: ["meaning", "greek", "article", "meaning", "greek", "article", "meaning", "greek", "article", "greek"]
  },
  {
    title: "Contrast το and η",
    focus: ["home", "bread", "museum", "door", "bag", "kitchen"],
    pool: keysThrough("salad"),
    rule: "Now choose between two families: το for a neuter singular noun and η for a feminine singular noun.",
    steps: ["First identify the noun.", "Recall its article family.", "Then choose the complete unit."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "ο + three essential masculine nouns",
    focus: ["coffee", "road", "oven"],
    pool: ["coffee", "road", "oven"],
    rule: "ο means “the” before one masculine noun. Learn ο and the noun together.",
    steps: ["Masculine nouns often end in -ος, -ης or -ας.", "The ending is a clue, not a guarantee.", "Say the complete unit aloud."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "ο + three new masculine nouns",
    focus: ["bill", "map", "station"],
    pool: ["coffee", "road", "oven", "bill", "map", "station"],
    rule: "The ο family grows by three practical nouns while earlier masculine nouns remain active.",
    steps: ["Notice -ος and -ης endings.", "Retrieve ο with the noun.", "Mix old and new units."],
    modes: ["article", "greek", "article", "meaning", "greek", "article", "meaning", "greek", "article", "greek"]
  },
  {
    title: "Mix six ο-family nouns",
    focus: ["coffee", "road", "oven", "bill", "map", "station"],
    pool: ["coffee", "road", "oven", "bill", "map", "station"],
    rule: "All six nouns belong to the ο family. Strengthen complete-unit recall.",
    steps: ["Recall the meaning first.", "Attach ο automatically.", "Correct every error before continuing."],
    modes: ["meaning", "greek", "article", "meaning", "greek", "article", "meaning", "greek", "article", "greek"]
  },
  {
    title: "Contrast ο, η and το",
    focus: ["coffee", "bill", "door", "receipt", "home", "museum"],
    pool: keysThrough("station"),
    rule: "Choose among all three singular article families: ο masculine, η feminine and το neuter.",
    steps: ["Identify the noun.", "Recall its stored article.", "Use endings only as supporting clues."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "Neuter ending clue: -μα",
    focus: ["name", "shop", "ticket"],
    pool: keysThrough("ticket"),
    rule: "Many singular nouns ending in -μα are neuter and use το. This is a clue, not a universal rule.",
    steps: ["Notice the noun ending.", "Confirm the stored article.", "Recall the full unit."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "Feminine exceptions ending in -ος",
    focus: ["entrance", "exit", "avenue"],
    pool: keysThrough("avenue"),
    rule: "Some nouns ending in -ος are feminine. Learn η είσοδος, η έξοδος and η λεωφόρος as complete units.",
    steps: ["Do not apply ending clues mechanically.", "Trust the stored article-and-noun unit.", "Contrast these words with masculine -ος nouns."],
    modes: ["article", "greek", "article", "meaning", "article", "greek", "article", "meaning", "article", "greek"]
  },
  {
    title: "Cumulative article retrieval",
    focus: ["water", "museum", "door", "receipt", "coffee", "bill", "entrance", "ticket"],
    pool: allKeys,
    rule: "Retrieve ο, η or το from memory across all noun families.",
    steps: ["Do not rely on one ending rule.", "Recall the word as a complete unit.", "Use correction data to identify weak families."],
    modes: ["article", "greek", "meaning", "article", "greek", "meaning", "article", "greek", "article", "greek"]
  },
  {
    title: "Listen and identify the article family",
    focus: ["bread", "home", "bag", "kitchen", "road", "map"],
    pool: allKeys,
    rule: "Listen for the article and noun as one spoken unit, then match what you hear.",
    steps: ["Play the audio once.", "Repeat the unit aloud.", "Choose only after recalling the meaning."],
    modes: ["listen", "listen", "article", "listen", "meaning", "listen", "article", "listen", "greek", "listen"]
  },
  {
    title: "Use known nouns in a sentence frame",
    focus: ["water", "bread", "door", "bag", "coffee", "bill"],
    pool: allKeys,
    rule: "The article-and-noun unit can now enter a controlled sentence: ___ είναι εδώ means “___ is here.”",
    steps: ["Keep the article attached to the noun.", "Choose the unit named in English.", "Do not create an independent sentence yet."],
    modes: ["sentence", "sentence", "article", "sentence", "meaning", "sentence", "article", "sentence", "greek", "sentence"]
  },
  {
    title: "Definite το versus indefinite ένα",
    focus: ["water", "bread", "home", "book", "table", "museum"],
    pool: keysThrough("museum"),
    rule: "Use το for “the” with one neuter noun. Use ένα for “a” or “one” neuter noun.",
    steps: ["το νερό means the water.", "ένα νερό means a water / one water.", "Choose from the English meaning, not by habit."],
    modes: ["definite", "indefinite", "definite", "indefinite", "greek", "definite", "indefinite", "meaning", "definite", "indefinite"]
  },
  {
    title: "Definite η/ο versus μία/ένας",
    focus: ["door", "bag", "salad", "coffee", "map", "station"],
    pool: allKeys,
    rule: "Use η or ο for “the.” Use μία with one feminine noun and ένας with one masculine noun for “a/one” in the subject form.",
    steps: ["η τσάντα means the bag; μία τσάντα means a bag.", "ο χάρτης means the map; ένας χάρτης means a map.", "Object forms will be taught in a later grammar pack."],
    modes: ["definite", "indefinite", "definite", "indefinite", "greek", "definite", "indefinite", "meaning", "definite", "indefinite"]
  },
  {
    title: "Article mastery assessment",
    focus: ["water", "museum", "door", "receipt", "coffee", "bill", "ticket", "entrance", "map", "home"],
    pool: allKeys,
    rule: "Use meaning, noun family and the stored article-and-noun unit to choose accurately without hints.",
    steps: ["Retrieve before looking at the choices.", "Listen and read across all three families.", "Mastery requires 9/10 first attempt and 10/10 after correction."],
    modes: ["article", "greek", "listen", "meaning", "sentence", "article", "greek", "listen", "definite", "article"]
  }
];

const ARTICLE_CHOICES = ["ο", "η", "το"];
const INDEFINITE = { neuter: "ένα", feminine: "μία", masculine: "ένας" };

function rotate(items, offset) {
  return items.slice(offset % items.length).concat(items.slice(0, offset % items.length));
}

function uniqueOptions(answer, distractors) {
  return [answer, ...distractors.filter((item) => item !== answer)].slice(0, 3);
}

function buildExercise(config, worksheetIndex, itemIndex) {
  const mode = config.modes[itemIndex];
  const focusKey = config.focus[itemIndex % config.focus.length];
  const word = WORDS[focusKey];
  const poolWords = config.pool.map((key) => WORDS[key]);
  const rotated = rotate(poolWords, itemIndex + worksheetIndex).filter((item) => item.greek !== word.greek);
  const id = `ART-A${worksheetIndex + 1}-${String(itemIndex + 1).padStart(3, "0")}`;
  const base = { id, kind: mode, audioText: null };

  if (mode === "article") {
    const options = rotate(ARTICLE_CHOICES.map((article) => `${article} ${word.noun}`), itemIndex);
    return { ...base, instruction: "Choose the correct complete word unit.", prompt: `___ ${word.noun}`, options, answer: word.greek, explanation: `${word.greek} means ${word.english}.` };
  }
  if (mode === "meaning") {
    const options = uniqueOptions(word.english, rotated.map((item) => item.english));
    return { ...base, instruction: "Choose the English meaning.", prompt: word.greek, options: rotate(options, itemIndex), answer: word.english, explanation: `${word.greek} means ${word.english}.` };
  }
  if (mode === "greek") {
    const options = uniqueOptions(word.greek, rotated.map((item) => item.greek));
    return { ...base, instruction: `Choose the Greek for “${word.english.replace(/^the /, "the ")}.”`, prompt: word.english, options: rotate(options, itemIndex), answer: word.greek, explanation: `The complete Greek unit is ${word.greek}.` };
  }
  if (mode === "listen") {
    const options = uniqueOptions(word.greek, rotated.map((item) => item.greek));
    return { ...base, audioText: word.greek, instruction: "Listen, repeat, then choose what you heard.", prompt: "Audio item", options: rotate(options, itemIndex), answer: word.greek, explanation: `You heard ${word.greek} — ${word.english}.` };
  }
  if (mode === "sentence") {
    const options = uniqueOptions(word.greek, rotated.map((item) => item.greek));
    return { ...base, instruction: `Complete: “${word.english.replace(/^the /, "The ")} is here.”`, prompt: "___ είναι εδώ.", options: rotate(options, itemIndex), answer: word.greek, explanation: `${word.greek} είναι εδώ. means “${word.english.replace(/^the /, "The ")} is here.”` };
  }
  if (mode === "indefinite") {
    const indefinite = `${INDEFINITE[word.family]} ${word.noun}`;
    const options = uniqueOptions(indefinite, [word.greek, ...rotated.map((item) => `${INDEFINITE[item.family]} ${item.noun}`)]);
    return { ...base, instruction: `Choose the Greek for “a/one ${word.english.replace(/^the /, "")}.”`, prompt: `a/one ${word.english.replace(/^the /, "")}`, options: rotate(options, itemIndex), answer: indefinite, explanation: `${indefinite} means a/one ${word.english.replace(/^the /, "")}.` };
  }
  const indefinite = `${INDEFINITE[word.family]} ${word.noun}`;
  const options = uniqueOptions(word.greek, [indefinite, ...rotated.map((item) => item.greek)]);
  return { ...base, instruction: `Choose the Greek for “${word.english}.”`, prompt: word.english, options: rotate(options, itemIndex), answer: word.greek, explanation: `${word.greek} uses the definite article because it means “${word.english}.”` };
}

const worksheets = CONFIGS.map((config, worksheetIndex) => ({
  id: `ART-A${worksheetIndex + 1}`,
  sequence: worksheetIndex + 1,
  title: config.title,
  estimatedMinutes: worksheetIndex < 4 ? 5 : 6,
  masteryFirstAttempt: 9,
  rule: config.rule,
  ruleSteps: config.steps,
  words: config.focus.map((key) => WORDS[key]),
  knownWordCount: new Set(CONFIGS.slice(0, worksheetIndex + 1).flatMap((item) => item.focus)).size,
  exercises: Array.from({ length: 10 }, (_, itemIndex) => buildExercise(config, worksheetIndex, itemIndex))
}));

const curriculum = {
  packId: "articles-a1",
  title: "Definite Articles Mastery",
  totalWorksheets: worksheets.length,
  totalExercises: worksheets.reduce((sum, item) => sum + item.exercises.length, 0),
  reviewIntervalsDays: [1, 3, 7, 21, 60],
  worksheets
};

writeFileSync(new URL("../data/article-mastery.json", import.meta.url), `${JSON.stringify(curriculum, null, 2)}\n`);
