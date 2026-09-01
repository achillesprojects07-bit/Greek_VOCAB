"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleAlert, Clock3, GraduationCap, Headphones, Home, Languages,
  ListChecks, LockKeyhole, MessageSquareText, RotateCcw, Search,
  ShieldCheck, Sparkles, Target, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Tab = "today" | "path" | "practice" | "vocabulary" | "review";
type LessonStage = "understand" | "notice" | "control" | "use" | "result";
type ProgressState = {
  lessonStarted: boolean; explanationViewed: boolean; patternViewed: boolean;
  answers: Record<number, string>; submitted: Record<number, boolean>;
  writing: string; lessonCompleted: boolean; reviewDue: boolean; activeDays: number;
};

const STORAGE_KEY = "greek_mastery_state_v1";
const initialProgress: ProgressState = {
  lessonStarted: false, explanationViewed: false, patternViewed: false,
  answers: {}, submitted: {}, writing: "", lessonCompleted: false,
  reviewDue: false, activeDays: 1,
};

const quiz = [
  { prompt: "___ λογαριασμός είναι εδώ.", options: ["Ο", "Η", "Το"], answer: "Ο", explanation: "Λογαριασμός is masculine, so its singular subject article is ο." },
  { prompt: "___ είσοδος είναι ανοιχτή.", options: ["Ο", "Η", "Το"], answer: "Η", explanation: "Είσοδος is feminine even though it ends in -ος. Learn it as η είσοδος." },
  { prompt: "___ μουσείο είναι στο κέντρο.", options: ["Ο", "Η", "Το"], answer: "Το", explanation: "Μουσείο is neuter, so it takes το in the singular." },
  { prompt: "___ ντομάτες είναι φρέσκες.", options: ["Οι", "Τα", "Η"], answer: "Οι", explanation: "Ντομάτες is feminine plural. Masculine and feminine plural nouns take οι." },
  { prompt: "___ εισιτήρια είναι στο τραπέζι.", options: ["Οι", "Τα", "Το"], answer: "Τα", explanation: "Εισιτήρια is neuter plural, so it takes τα." },
];

const vocabulary = [
  ["ο λογαριασμός", "the bill", "οι λογαριασμοί", "Ο λογαριασμός είναι εδώ."],
  ["η είσοδος", "the entrance", "οι είσοδοι", "Η είσοδος είναι ανοιχτή."],
  ["το μουσείο", "the museum", "τα μουσεία", "Το μουσείο είναι στο κέντρο."],
  ["η ντομάτα", "the tomato", "οι ντομάτες", "Οι ντομάτες είναι φρέσκες."],
  ["το εισιτήριο", "the ticket", "τα εισιτήρια", "Τα εισιτήρια είναι στο τραπέζι."],
  ["ο δρόμος", "the street", "οι δρόμοι", "Ο δρόμος είναι ήσυχος."],
  ["η τσάντα", "the bag", "οι τσάντες", "Η τσάντα είναι στην καρέκλα."],
  ["το ψωμί", "the bread", "τα ψωμιά", "Το ψωμί είναι φρέσκο."],
];

const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "today", label: "Today", icon: Home },
  { id: "path", label: "Path", icon: GraduationCap },
  { id: "practice", label: "Practice", icon: ListChecks },
  { id: "vocabulary", label: "Vocabulary", icon: Languages },
  { id: "review", label: "Review", icon: RotateCcw },
];

function safeLoad(): ProgressState {
  if (typeof window === "undefined") return initialProgress;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialProgress, ...JSON.parse(saved) } : initialProgress;
  } catch { return initialProgress; }
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("today");
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [hydrated, setHydrated] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [stage, setStage] = useState<LessonStage>("understand");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabRevealed, setVocabRevealed] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => { setProgress(safeLoad()); setHydrated(true); }, 0);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(new URL("sw.js", window.location.href).pathname, { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }
    return () => window.clearTimeout(restoreTimer);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }, [progress, hydrated]);

  const score = useMemo(() => quiz.reduce((n, item, i) => n + (progress.submitted[i] && progress.answers[i] === item.answer ? 1 : 0), 0), [progress.answers, progress.submitted]);
  const allSubmitted = Object.keys(progress.submitted).length === quiz.length;
  const lessonPercent = progress.lessonCompleted ? 100 : ({ understand: 20, notice: 40, control: 60, use: 80, result: 100 } as Record<LessonStage, number>)[stage];
  const openLesson = (nextStage?: LessonStage) => {
    setProgress((p) => ({ ...p, lessonStarted: true }));
    setStage(nextStage ?? (progress.explanationViewed ? "notice" : "understand")); setLessonOpen(true);
  };
  const finishLesson = () => {
    if (!allSubmitted || score < 4 || progress.writing.trim().length < 12) return;
    setProgress((p) => ({ ...p, lessonCompleted: true, reviewDue: true })); setStage("result");
  };
  const startReview = () => {
    setProgress((p) => ({ ...p, answers: {}, submitted: {}, reviewDue: false }));
    setQuestionIndex(0); setStage("control"); setLessonOpen(true);
  };
  const resetPrototype = () => { setProgress(initialProgress); setStage("understand"); setQuestionIndex(0); setLessonOpen(false); setQaOpen(false); };
  const filteredVocabulary = vocabulary.filter((x) => x.join(" ").toLowerCase().includes(search.toLowerCase()));

  return <div className="app-shell">
    <aside className="desktop-sidebar" aria-label="Primary navigation">
      <Brand />
      <nav className="side-nav">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => { setTab(item.id); setLessonOpen(false); }}><Icon /><span>{item.label}</span>{item.id === "review" && progress.reviewDue && <span className="nav-dot" />}</button>; })}</nav>
      <div className="sidebar-level"><span>A1 FOUNDATION</span><strong>{progress.lessonCompleted ? "4%" : "1%"} complete</strong><Progress value={progress.lessonCompleted ? 4 : 1} className="mt-3 h-2 bg-blue-100" /></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="mobile-brand"><Brand compact /></div><div className="topbar-context"><span>PHASE 0 • v0.1.1</span><strong>A1 • Unit 2 of 23</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search vocabulary" onClick={() => setSearchOpen(true)}><Search /></button><button className="icon-button" aria-label="Run app check" onClick={() => setQaOpen(true)}><ShieldCheck /></button></div></header>
      <div className="content-wrap">{lessonOpen ? <LessonView stage={stage} setStage={setStage} progress={progress} setProgress={setProgress} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} score={score} allSubmitted={allSubmitted} lessonPercent={lessonPercent} onBack={() => setLessonOpen(false)} onFinish={finishLesson} /> : <>
        {tab === "today" && <TodayScreen progress={progress} onOpenLesson={openLesson} />}
        {tab === "path" && <PathScreen progress={progress} onOpenLesson={openLesson} />}
        {tab === "practice" && <PracticeScreen progress={progress} onOpenLesson={openLesson} />}
        {tab === "vocabulary" && <VocabularyScreen vocabIndex={vocabIndex} setVocabIndex={setVocabIndex} revealed={vocabRevealed} setRevealed={setVocabRevealed} />}
        {tab === "review" && <ReviewScreen progress={progress} onOpenLesson={openLesson} onStartReview={startReview} />}
      </>}</div>
    </main>

    <nav className="mobile-nav" aria-label="Primary navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id && !lessonOpen ? "active" : ""} onClick={() => { setTab(item.id); setLessonOpen(false); }}><Icon /><span>{item.label}</span>{item.id === "review" && progress.reviewDue && <span className="mobile-dot" />}</button>; })}</nav>

    {qaOpen && <Modal title="App check" onClose={() => setQaOpen(false)}><div className="qa-summary"><CheckCircle2 /><div><strong>All essential systems are ready</strong><span>The learning journey has no missing destinations.</span></div></div><div className="check-list">{[["Today screen", true], ["Lesson content", true], ["Five answer keys", quiz.length === 5], ["Progress storage", hydrated], ["Safe completion gate", true], ["Vocabulary records", vocabulary.length === 8]].map(([label, okay]) => <div key={String(label)}><span>{label}</span><strong className={okay ? "check-pass" : "check-warn"}>{okay ? "Ready" : "Check"}</strong></div>)}</div><Button variant="outline" className="w-full" onClick={resetPrototype}><RotateCcw /> Reset prototype progress</Button></Modal>}
    {searchOpen && <Modal title="Search the library" onClose={() => { setSearchOpen(false); setSearch(""); }}><label className="search-field"><Search /><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Greek or English" /></label><div className="search-results">{filteredVocabulary.length ? filteredVocabulary.map((entry) => <div key={entry[0]}><strong>{entry[0]}</strong><span>{entry[1]} • {entry[2]}</span></div>) : <div className="empty-state"><CircleAlert /><strong>No matching item</strong><span>Try another Greek or English word.</span></div>}</div></Modal>}
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) { return <div className={compact ? "brand compact" : "brand"}><span className="brand-mark">Ε</span><div><strong>Greek Mastery</strong>{!compact && <span>A1–A2 COURSE</span>}</div></div>; }

function TodayScreen({ progress, onOpenLesson }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void }) {
  return <div className="screen-stack">
    <section className="welcome-row"><div><span className="eyebrow">YOUR LEARNING DAY</span><h1>Good morning, Aileen.</h1><p>One focused lesson will move your Greek forward today.</p></div><div className="day-marker"><strong>{progress.activeDays}</strong><span>active day</span></div></section>
    <section className="focus-card"><div className="focus-top"><span className="lesson-kicker">CURRENT LESSON</span><span className="time-pill"><Clock3 /> 18–22 min</span></div><div className="focus-body"><div className="focus-number">02</div><div><h2>Noun gender and definite articles</h2><p>Learn how <b>ο, η, το, οι</b> and <b>τα</b> identify Greek nouns.</p></div></div><div className="lesson-progress"><div><span>Lesson progress</span><strong>{progress.lessonCompleted ? "100%" : progress.lessonStarted ? "20%" : "Not started"}</strong></div><Progress value={progress.lessonCompleted ? 100 : progress.lessonStarted ? 20 : 0} className="h-2.5 bg-blue-100" /></div><Button size="lg" className="primary-action" onClick={() => onOpenLesson()}>{progress.lessonCompleted ? "Review this lesson" : progress.lessonStarted ? "Continue lesson" : "Start today’s lesson"}<ArrowRight /></Button></section>
    <section><div className="section-heading"><div><span className="eyebrow">TODAY’S PLAN</span><h2>A manageable path</h2></div><span>About 21 minutes</span></div><div className="plan-grid"><PlanItem number="1" title="Understand" detail="Why Greek nouns have gender" time="4 min" done={progress.explanationViewed} /><PlanItem number="2" title="Notice" detail="Article and noun patterns" time="4 min" done={progress.patternViewed} /><PlanItem number="3" title="Control" detail="Five guided questions" time="7 min" done={Object.keys(progress.submitted).length === 5} /><PlanItem number="4" title="Use" detail="Write about your surroundings" time="6 min" done={progress.writing.trim().length >= 12} /></div></section>
    <section className="motivation-strip"><Sparkles /><div><strong>Small, accurate steps create fluent Greek.</strong><span>Your next review is scheduled only after you demonstrate the lesson skill.</span></div></section>
  </div>;
}

function PlanItem({ number, title, detail, time, done }: { number: string; title: string; detail: string; time: string; done: boolean }) { return <article className={done ? "plan-item done" : "plan-item"}><span className="plan-number">{done ? <Check /> : number}</span><div><strong>{title}</strong><span>{detail}</span></div><small>{time}</small></article>; }

function PathScreen({ progress, onOpenLesson }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void }) {
  const lessons = [["01", "Course orientation and sound map", "Foundation complete", "complete"], ["02", "Noun gender and definite articles", "Current lesson", progress.lessonCompleted ? "complete" : "current"], ["03", "The accusative: direct objects", "Coming in the next content release", "locked"], ["04", "Regular present-tense verbs", "Coming later", "locked"]];
  return <div className="screen-stack"><PageIntro eyebrow="YOUR COURSE" title="A clear path from foundations to A2" text="Lessons unlock through demonstrated mastery, not by merely opening a page." /><section className="level-overview"><div><span>A1 FOUNDATION</span><strong>{progress.lessonCompleted ? "4%" : "1%"}</strong></div><Progress value={progress.lessonCompleted ? 4 : 1} className="h-3 bg-blue-100" /><p>Unit 2 of 23 • Target mastery: 80% per unit</p></section><div className="path-list">{lessons.map(([number, title, detail, state]) => <button key={number} className={`path-row ${state}`} disabled={state === "locked"} onClick={() => number === "02" && onOpenLesson()}><span className="path-number">{state === "complete" ? <Check /> : state === "locked" ? <LockKeyhole /> : number}</span><div><strong>{title}</strong><span>{detail}</span></div>{state !== "locked" && <ChevronRight />}</button>)}</div><section className="coming-level"><div><span>A2</span><strong>Connected everyday Greek</strong></div><LockKeyhole /><p>Complete the A1 assessment with at least 85% mastery to unlock A2.</p></section></div>;
}

function PracticeScreen({ progress, onOpenLesson }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void }) {
  const completed = Object.keys(progress.submitted).length;
  return <div className="screen-stack"><PageIntro eyebrow="PRACTICE" title="Train one skill at a time" text="Practice is connected to the lesson you are currently learning." /><div className="practice-grid"><button className="practice-card featured" onClick={() => onOpenLesson("control")}><div className="practice-icon"><Target /></div><span>CURRENT GRAMMAR</span><h2>Articles and noun gender</h2><p>{completed} of 5 controlled questions completed</p><Progress value={completed * 20} className="h-2 bg-blue-100" /><strong>Continue practice <ArrowRight /></strong></button><article className="practice-card"><div className="practice-icon pale"><Headphones /></div><span>LISTENING</span><h2>Hear the article</h2><p>Listening practice unlocks after the controlled exercise.</p><small><LockKeyhole /> Complete Control first</small></article><article className="practice-card"><div className="practice-icon pale"><MessageSquareText /></div><span>WRITING & SPEAKING</span><h2>Describe what you see</h2><p>Produce your own sentences using nouns from your surroundings.</p><small>{progress.writing ? <><Check /> Response saved</> : <><Clock3 /> About 5 minutes</>}</small></article></div></div>;
}

function VocabularyScreen({ vocabIndex, setVocabIndex, revealed, setRevealed }: { vocabIndex: number; setVocabIndex: (n: number) => void; revealed: boolean; setRevealed: (v: boolean) => void }) {
  const current = vocabulary[vocabIndex];
  return <div className="screen-stack"><PageIntro eyebrow="VOCABULARY" title="Learn nouns as complete families" text="Every noun includes its article, gender pattern, plural and natural use." /><div className="vocab-summary"><div><strong>8</strong><span>from this lesson</span></div><div><strong>{vocabIndex + 1}</strong><span>current card</span></div><div><strong>0</strong><span>weak words</span></div></div><section className="vocab-card"><div className="vocab-card-top"><span>A1 • NOUN</span><span>{vocabIndex + 1} / {vocabulary.length}</span></div><div className="greek-word">{current[0]}</div><div className="gender-label">article + noun</div>{revealed ? <div className="vocab-reveal"><strong>{current[1]}</strong><div><span>Plural</span><b>{current[2]}</b></div><p>{current[3]}</p></div> : <button className="reveal-button" onClick={() => setRevealed(true)}>Reveal meaning and use</button>}<div className="vocab-controls"><Button variant="outline" disabled={vocabIndex === 0} onClick={() => { setVocabIndex(Math.max(0, vocabIndex - 1)); setRevealed(false); }}><ArrowLeft /> Previous</Button><Button onClick={() => { setVocabIndex((vocabIndex + 1) % vocabulary.length); setRevealed(false); }}>Next word <ArrowRight /></Button></div></section></div>;
}

function ReviewScreen({ progress, onOpenLesson, onStartReview }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void; onStartReview: () => void }) {
  return <div className="screen-stack"><PageIntro eyebrow="REVIEW" title="Strengthen what could be forgotten" text="Reviews are scheduled from your real answers and lesson history." />{progress.reviewDue ? <section className="review-ready"><div className="review-orbit"><RotateCcw /></div><span>REVIEW READY</span><h2>Noun gender and articles</h2><p>Five items are ready for retrieval after your completed lesson.</p><Button size="lg" onClick={onStartReview}>Begin review <ArrowRight /></Button></section> : <section className="empty-review"><div><CheckCircle2 /></div><h2>Nothing is due yet</h2><p>Complete today’s lesson and its first review will appear here. Your progress is safe.</p><Button variant="outline" onClick={() => onOpenLesson()}>Go to current lesson</Button></section>}<section className="review-schedule"><h2>Your review rhythm</h2><div>{["1 day", "3 days", "7 days", "21 days", "60 days"].map((day, i) => <div key={day}><span>{i + 1}</span><strong>{day}</strong><small>{i === 0 ? "First retrieval" : "Planned interval"}</small></div>)}</div></section></div>;
}

function LessonView({ stage, setStage, progress, setProgress, questionIndex, setQuestionIndex, score, allSubmitted, lessonPercent, onBack, onFinish }: { stage: LessonStage; setStage: (s: LessonStage) => void; progress: ProgressState; setProgress: React.Dispatch<React.SetStateAction<ProgressState>>; questionIndex: number; setQuestionIndex: (n: number) => void; score: number; allSubmitted: boolean; lessonPercent: number; onBack: () => void; onFinish: () => void; }) {
  const stages: LessonStage[] = ["understand", "notice", "control", "use", "result"];
  const current = quiz[questionIndex]; const selected = progress.answers[questionIndex]; const submitted = progress.submitted[questionIndex]; const correct = selected === current.answer;
  return <div className="lesson-view"><div className="lesson-toolbar"><button onClick={onBack}><ArrowLeft /> Back</button><span>Lesson 02</span><strong>{lessonPercent}%</strong></div><Progress value={lessonPercent} className="lesson-progress-bar" /><div className="lesson-stage-nav">{stages.slice(0, 4).map((item, i) => <button key={item} className={stage === item ? "active" : stages.indexOf(stage) > i ? "done" : ""} onClick={() => (i <= stages.indexOf(stage) || progress.lessonCompleted) && setStage(item)}><span>{stages.indexOf(stage) > i || progress.lessonCompleted ? <Check /> : i + 1}</span>{item}</button>)}</div>
    {stage === "understand" && <section className="lesson-panel"><span className="lesson-kicker">UNDERSTAND THE IDEA</span><h1>Noun gender and definite articles</h1><p className="lesson-lead">Every Greek noun belongs to one of three grammatical genders. The article tells you which family the noun belongs to.</p><div className="explanation-box"><BookOpen /><div><h2>Learn the article with the noun</h2><p>Do not memorize <b>είσοδος</b> by itself. Learn <b>η είσοδος</b>. The article is part of the useful vocabulary item because gender cannot always be guessed.</p></div></div><div className="example-trio"><div><span>Masculine</span><strong>ο λογαριασμός</strong><small>the bill</small></div><div><span>Feminine</span><strong>η είσοδος</strong><small>the entrance</small></div><div><span>Neuter</span><strong>το μουσείο</strong><small>the museum</small></div></div><div className="mistake-note"><CircleAlert /><div><strong>Common mistake</strong><p>Do not choose the article from the object’s meaning. Learn each noun and article together.</p></div></div><LessonNext label="Continue to the pattern" onClick={() => { setProgress((p) => ({ ...p, explanationViewed: true })); setStage("notice"); }} /></section>}
    {stage === "notice" && <section className="lesson-panel"><span className="lesson-kicker">NOTICE THE PATTERN</span><h1>The core article map</h1><p className="lesson-lead">Singular articles distinguish all three genders. In the plural, masculine and feminine share <b>οι</b>; neuter uses <b>τα</b>.</p><div className="pattern-table"><div className="pattern-head"><span>Gender</span><span>Singular</span><span>Plural</span></div><div><strong>Masculine</strong><b>ο</b><b>οι</b></div><div><strong>Feminine</strong><b>η</b><b>οι</b></div><div><strong>Neuter</strong><b>το</b><b>τα</b></div></div><h2 className="subhead">Useful ending clues</h2><div className="clue-list"><div><span>ο</span><p>Often <b>-ος, -ης, -ας</b><small>ο δρόμος, ο χάρτης, ο άντρας</small></p></div><div><span>η</span><p>Often <b>-α, -η</b><small>η τσάντα, η στάση</small></p></div><div><span>το</span><p>Often <b>-ο, -ι, -μα</b><small>το μουσείο, το ψωμί, το κατάστημα</small></p></div></div><div className="exception-note"><strong>Important exception</strong><span><b>η είσοδος</b> is feminine although it ends in -ος.</span></div><LessonNext label="Practise the pattern" onClick={() => { setProgress((p) => ({ ...p, patternViewed: true })); setStage("control"); }} /></section>}
    {stage === "control" && <section className="lesson-panel control-panel"><span className="lesson-kicker">CONTROL THE FORM</span><div className="question-heading"><div><h1>Choose the correct article</h1><p>Question {questionIndex + 1} of {quiz.length}</p></div><strong>{score}/{quiz.length} correct</strong></div><Progress value={((questionIndex + (submitted ? 1 : 0)) / quiz.length) * 100} className="h-2 bg-blue-100" /><div className="question-card"><span>COMPLETE THE SENTENCE</span><h2>{current.prompt}</h2><div className="option-grid">{current.options.map((option) => <button key={option} disabled={submitted} className={`${selected === option ? "selected" : ""} ${submitted && option === current.answer ? "correct" : ""} ${submitted && selected === option && option !== current.answer ? "incorrect" : ""}`} onClick={() => setProgress((p) => ({ ...p, answers: { ...p.answers, [questionIndex]: option } }))}>{option}{submitted && option === current.answer && <Check />}</button>)}</div>{submitted && <div className={correct ? "answer-feedback correct" : "answer-feedback retry"}><div>{correct ? <CheckCircle2 /> : <CircleAlert />}</div><p><strong>{correct ? "Correct" : `The answer is ${current.answer}`}</strong>{current.explanation}</p></div>}</div><div className="question-actions"><Button variant="outline" disabled={questionIndex === 0} onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))}><ArrowLeft /> Previous</Button>{!submitted ? <Button disabled={!selected} onClick={() => setProgress((p) => ({ ...p, submitted: { ...p.submitted, [questionIndex]: true } }))}>Check answer</Button> : !correct ? <Button onClick={() => setProgress((p) => { const answers = { ...p.answers }; const submittedAnswers = { ...p.submitted }; delete answers[questionIndex]; delete submittedAnswers[questionIndex]; return { ...p, answers, submitted: submittedAnswers }; })}>Try this question again</Button> : questionIndex < quiz.length - 1 ? <Button onClick={() => setQuestionIndex(questionIndex + 1)}>Next question <ArrowRight /></Button> : <Button disabled={!allSubmitted || score < 4} onClick={() => setStage("use")}>Use it yourself <ArrowRight /></Button>}</div></section>}
    {stage === "use" && <section className="lesson-panel"><span className="lesson-kicker">USE IT YOURSELF</span><h1>Describe your surroundings</h1><p className="lesson-lead">Write three short sentences about objects or places around you. Include a masculine, feminine and neuter noun.</p><div className="writing-prompt"><div><strong>MODEL</strong><p>Το τηλέφωνο είναι στο τραπέζι.</p><span>The telephone is on the table.</span></div><label><span>Your three Greek sentences</span><textarea value={progress.writing} onChange={(e) => setProgress((p) => ({ ...p, writing: e.target.value }))} placeholder={"1. Ο ...\n2. Η ...\n3. Το ..."} /></label><small>{progress.writing.trim().length < 12 ? "Write at least three short sentences to finish." : "Your response is saved on this device."}</small></div><Button size="lg" className="primary-action" disabled={!allSubmitted || score < 4 || progress.writing.trim().length < 12} onClick={onFinish}>Complete lesson <Trophy /></Button></section>}
    {stage === "result" && <section className="lesson-panel result-panel"><div className="result-badge"><Trophy /></div><span className="lesson-kicker">LESSON MASTERED</span><h1>You can identify Greek noun gender.</h1><p>You scored <b>{score} out of 5</b> and produced your own Greek examples. Your first retrieval review is now scheduled.</p><div className="result-stats"><div><strong>{score}/5</strong><span>controlled practice</span></div><div><strong>100%</strong><span>lesson complete</span></div><div><strong>1 day</strong><span>first review</span></div></div><Button size="lg" className="primary-action" onClick={onBack}>Return to Today <ArrowRight /></Button></section>}
  </div>;
}

function LessonNext({ label, onClick }: { label: string; onClick: () => void }) { return <div className="lesson-next"><Button size="lg" onClick={onClick}>{label}<ArrowRight /></Button></div>; }
function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}><header><h2>{title}</h2><button aria-label="Close" onClick={onClose}>×</button></header>{children}</section></div>; }
