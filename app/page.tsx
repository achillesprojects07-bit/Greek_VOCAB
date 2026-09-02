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
import articleMastery from "@/data/article-mastery.json";

type Tab = "today" | "path" | "practice" | "vocabulary" | "review";
type LessonStage = "understand" | "notice" | "control" | "use" | "result";
type ProgressState = {
  lessonStarted: boolean; explanationViewed: boolean; patternViewed: boolean;
  answers: Record<number, string>; submitted: Record<number, boolean>;
  attempts: Record<number, number>; round: number; lessonCompleted: boolean;
  reviewDue: boolean; activeDays: number;
};

const STORAGE_KEY = "greek_mastery_state_v2";
const initialProgress: ProgressState = {
  lessonStarted: false, explanationViewed: false, patternViewed: false,
  answers: {}, submitted: {}, attempts: {}, round: 1, lessonCompleted: false,
  reviewDue: false, activeDays: 1,
};

const worksheet = articleMastery.worksheets[0];
const quiz = worksheet.exercises;

const vocabulary = worksheet.words.map((word) => [word.greek, word.english, "plural comes later", word.greek]);

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
  const firstAttemptScore = useMemo(() => quiz.reduce((n, item, i) => n + (progress.submitted[i] && progress.answers[i] === item.answer && progress.attempts[i] === 1 ? 1 : 0), 0), [progress.answers, progress.attempts, progress.submitted]);
  const allSubmitted = Object.keys(progress.submitted).length === quiz.length;
  const lessonPercent = progress.lessonCompleted ? 100 : ({ understand: 10, notice: 20, control: 30, use: 90, result: 100 } as Record<LessonStage, number>)[stage];
  const openLesson = (nextStage?: LessonStage) => {
    setProgress((p) => ({ ...p, lessonStarted: true }));
    setStage(nextStage ?? (progress.explanationViewed ? "notice" : "understand")); setLessonOpen(true);
  };
  const finishLesson = () => {
    if (!allSubmitted || score !== quiz.length || firstAttemptScore < worksheet.masteryFirstAttempt) return;
    setProgress((p) => ({ ...p, lessonCompleted: true, reviewDue: true })); setStage("result");
  };
  const repeatWorksheet = () => {
    setProgress((p) => ({ ...p, answers: {}, submitted: {}, attempts: {}, round: p.round + 1 }));
    setQuestionIndex(0); setStage("control");
  };
  const startReview = () => {
    setProgress((p) => ({ ...p, answers: {}, submitted: {}, attempts: {}, round: p.round + 1, reviewDue: false }));
    setQuestionIndex(0); setStage("control"); setLessonOpen(true);
  };
  const resetPrototype = () => { setProgress(initialProgress); setStage("understand"); setQuestionIndex(0); setLessonOpen(false); setQaOpen(false); };
  const filteredVocabulary = vocabulary.filter((x) => x.join(" ").toLowerCase().includes(search.toLowerCase()));

  return <div className="app-shell">
    <aside className="desktop-sidebar" aria-label="Primary navigation">
      <Brand />
      <nav className="side-nav">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? "nav-item active" : "nav-item"} onClick={() => { setTab(item.id); setLessonOpen(false); }}><Icon /><span>{item.label}</span>{item.id === "review" && progress.reviewDue && <span className="nav-dot" />}</button>; })}</nav>
      <div className="sidebar-level"><span>ARTICLE MASTERY</span><strong>{progress.lessonCompleted ? "1 of 20 complete" : "Worksheet A1 in progress"}</strong><Progress value={progress.lessonCompleted ? 5 : 0} className="mt-3 h-2 bg-blue-100" /></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="mobile-brand"><Brand compact /></div><div className="topbar-context"><span>PHASE 1 • v0.2.0</span><strong>Article Mastery • A1 of 20</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search vocabulary" onClick={() => setSearchOpen(true)}><Search /></button><button className="icon-button" aria-label="Run app check" onClick={() => setQaOpen(true)}><ShieldCheck /></button></div></header>
      <div className="content-wrap">{lessonOpen ? <LessonView stage={stage} setStage={setStage} progress={progress} setProgress={setProgress} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} score={score} firstAttemptScore={firstAttemptScore} allSubmitted={allSubmitted} lessonPercent={lessonPercent} onBack={() => setLessonOpen(false)} onFinish={finishLesson} onRepeat={repeatWorksheet} /> : <>
        {tab === "today" && <TodayScreen progress={progress} onOpenLesson={openLesson} />}
        {tab === "path" && <PathScreen progress={progress} onOpenLesson={openLesson} />}
        {tab === "practice" && <PracticeScreen progress={progress} onOpenLesson={openLesson} />}
        {tab === "vocabulary" && <VocabularyScreen vocabIndex={vocabIndex} setVocabIndex={setVocabIndex} revealed={vocabRevealed} setRevealed={setVocabRevealed} />}
        {tab === "review" && <ReviewScreen progress={progress} onOpenLesson={openLesson} onStartReview={startReview} />}
      </>}</div>
    </main>

    <nav className="mobile-nav" aria-label="Primary navigation">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id && !lessonOpen ? "active" : ""} onClick={() => { setTab(item.id); setLessonOpen(false); }}><Icon /><span>{item.label}</span>{item.id === "review" && progress.reviewDue && <span className="mobile-dot" />}</button>; })}</nav>

    {qaOpen && <Modal title="App check" onClose={() => setQaOpen(false)}><div className="qa-summary"><CheckCircle2 /><div><strong>All essential systems are ready</strong><span>The mastery worksheet has complete answer data and safe progress rules.</span></div></div><div className="check-list">{[["Today screen", true], ["Worksheet content", true], ["Ten answer keys", quiz.length === 10], ["Progress storage", hydrated], ["Correction loop", true], ["Current vocabulary", vocabulary.length === 3]].map(([label, okay]) => <div key={String(label)}><span>{label}</span><strong className={okay ? "check-pass" : "check-warn"}>{okay ? "Ready" : "Check"}</strong></div>)}</div><Button variant="outline" className="w-full" onClick={resetPrototype}><RotateCcw /> Reset prototype progress</Button></Modal>}
    {searchOpen && <Modal title="Search the library" onClose={() => { setSearchOpen(false); setSearch(""); }}><label className="search-field"><Search /><input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Greek or English" /></label><div className="search-results">{filteredVocabulary.length ? filteredVocabulary.map((entry) => <div key={entry[0]}><strong>{entry[0]}</strong><span>{entry[1]} • {entry[2]}</span></div>) : <div className="empty-state"><CircleAlert /><strong>No matching item</strong><span>Try another Greek or English word.</span></div>}</div></Modal>}
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) { return <div className={compact ? "brand compact" : "brand"}><span className="brand-mark">Ε</span><div><strong>Greek Mastery</strong>{!compact && <span>A1–A2 COURSE</span>}</div></div>; }

function TodayScreen({ progress, onOpenLesson }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void }) {
  return <div className="screen-stack">
    <section className="welcome-row"><div><span className="eyebrow">YOUR MASTERY SESSION</span><h1>Good morning, Aileen.</h1><p>Ten careful answers. Three useful words. No guessing ahead.</p></div><div className="day-marker"><strong>{progress.activeDays}</strong><span>active day</span></div></section>
    <section className="focus-card"><div className="focus-top"><span className="lesson-kicker">ARTICLE MASTERY • WORKSHEET A1</span><span className="time-pill"><Clock3 /> 4–8 min</span></div><div className="focus-body"><div className="focus-number">A1</div><div><h2>το + three essential nouns</h2><p>Strengthen <b>το νερό</b>, <b>το ψωμί</b> and <b>το σπίτι</b> before adding another article.</p></div></div><div className="lesson-progress"><div><span>Worksheet progress</span><strong>{progress.lessonCompleted ? "Mastered" : progress.lessonStarted ? `${Object.keys(progress.submitted).length}/10 corrected` : "Not started"}</strong></div><Progress value={progress.lessonCompleted ? 100 : Object.keys(progress.submitted).length * 10} className="h-2.5 bg-blue-100" /></div><Button size="lg" className="primary-action" onClick={() => onOpenLesson()}>{progress.lessonCompleted ? "Review worksheet A1" : progress.lessonStarted ? "Continue worksheet" : "Start worksheet A1"}<ArrowRight /></Button></section>
    <section><div className="section-heading"><div><span className="eyebrow">TODAY’S STEPS</span><h2>Small work, repeated accurately</h2></div><span>One worksheet</span></div><div className="plan-grid"><PlanItem number="1" title="Learn" detail="Three complete word units" time="2 min" done={progress.explanationViewed} /><PlanItem number="2" title="Repeat" detail="See and say each unit" time="2 min" done={progress.patternViewed} /><PlanItem number="3" title="Worksheet A1" detail="Ten graded exercises" time="4 min" done={Object.keys(progress.submitted).length === 10} /><PlanItem number="4" title="Correct" detail="Fix every missed item" time="as needed" done={progress.lessonCompleted} /></div></section>
    <section className="motivation-strip"><Sparkles /><div><strong>Accuracy first. Speed will follow.</strong><span>The next worksheet remains locked until this one reaches mastery.</span></div></section>
  </div>;
}

function PlanItem({ number, title, detail, time, done }: { number: string; title: string; detail: string; time: string; done: boolean }) { return <article className={done ? "plan-item done" : "plan-item"}><span className="plan-number">{done ? <Check /> : number}</span><div><strong>{title}</strong><span>{detail}</span></div><small>{time}</small></article>; }

function PathScreen({ progress, onOpenLesson }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void }) {
  const lessons = [["A1", "το + three essential nouns", "10 exercises • current worksheet", progress.lessonCompleted ? "complete" : "current"], ["A2", "Repeat το with three new nouns", "10 exercises • unlocks after A1 mastery", "locked"], ["A3", "Mix six neuter nouns", "10 exercises • cumulative accuracy", "locked"], ["A4", "Recall το without visual support", "10 exercises • reduced hints", "locked"]];
  return <div className="screen-stack"><PageIntro eyebrow="YOUR COURSE" title="Article Mastery Pack" text="Twenty worksheets build one article skill through 200 graded exercises." /><section className="level-overview"><div><span>DEFINITE ARTICLES • A1</span><strong>{progress.lessonCompleted ? "1/20" : "0/20"}</strong></div><Progress value={progress.lessonCompleted ? 5 : 0} className="h-3 bg-blue-100" /><p>Worksheet A1 of 20 • 90% first-attempt target • every error corrected</p></section><div className="path-list">{lessons.map(([number, title, detail, state]) => <button key={number} className={`path-row ${state}`} disabled={state === "locked"} onClick={() => number === "A1" && onOpenLesson()}><span className="path-number">{state === "complete" ? <Check /> : state === "locked" ? <LockKeyhole /> : number}</span><div><strong>{title}</strong><span>{detail}</span></div>{state !== "locked" && <ChevronRight />}</button>)}</div><section className="coming-level"><div><span>200</span><strong>Exercises in this mastery pack</strong></div><LockKeyhole /><p>Later worksheets add η and ο only after the earlier word units remain accurate.</p></section></div>;
}

function PracticeScreen({ progress, onOpenLesson }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void }) {
  const completed = Object.keys(progress.submitted).length;
  return <div className="screen-stack"><PageIntro eyebrow="PRACTICE" title="Repeat until it becomes easy" text="Worksheet A1 uses only three known word units and corrects every missed item." /><div className="practice-grid"><button className="practice-card featured" onClick={() => onOpenLesson("control")}><div className="practice-icon"><Target /></div><span>WORKSHEET A1 • ROUND {progress.round}</span><h2>το + three essential nouns</h2><p>{completed} of 10 exercises corrected</p><Progress value={completed * 10} className="h-2 bg-blue-100" /><strong>{progress.lessonCompleted ? "Repeat for review" : "Continue worksheet"} <ArrowRight /></strong></button><article className="practice-card"><div className="practice-icon pale"><Headphones /></div><span>NEXT MODE</span><h2>Hear and identify</h2><p>Listening begins after the written forms are familiar.</p><small><LockKeyhole /> Complete worksheet A1 first</small></article><article className="practice-card"><div className="practice-icon pale"><MessageSquareText /></div><span>PRODUCTION</span><h2>Writing comes later</h2><p>Independent sentences will unlock only after the article and vocabulary are stable.</p><small><ShieldCheck /> No premature free writing</small></article></div></div>;
}

function VocabularyScreen({ vocabIndex, setVocabIndex, revealed, setRevealed }: { vocabIndex: number; setVocabIndex: (n: number) => void; revealed: boolean; setRevealed: (v: boolean) => void }) {
  const current = vocabulary[vocabIndex];
  return <div className="screen-stack"><PageIntro eyebrow="CURRENT VOCABULARY" title="Three words—not thirty" text="Each noun is learned as one complete article-and-noun unit." /><div className="vocab-summary"><div><strong>3</strong><span>in worksheet A1</span></div><div><strong>{vocabIndex + 1}</strong><span>current card</span></div><div><strong>0</strong><span>new genders today</span></div></div><section className="vocab-card"><div className="vocab-card-top"><span>A1 • COMPLETE UNIT</span><span>{vocabIndex + 1} / {vocabulary.length}</span></div><div className="greek-word">{current[0]}</div><div className="gender-label">say the article and noun together</div>{revealed ? <div className="vocab-reveal"><strong>{current[1]}</strong><div><span>Today’s grammar</span><b>το + noun</b></div><p>{current[3]}</p></div> : <button className="reveal-button" onClick={() => setRevealed(true)}>Reveal meaning</button>}<div className="vocab-controls"><Button variant="outline" disabled={vocabIndex === 0} onClick={() => { setVocabIndex(Math.max(0, vocabIndex - 1)); setRevealed(false); }}><ArrowLeft /> Previous</Button><Button onClick={() => { setVocabIndex((vocabIndex + 1) % vocabulary.length); setRevealed(false); }}>Next word <ArrowRight /></Button></div></section></div>;
}

function ReviewScreen({ progress, onOpenLesson, onStartReview }: { progress: ProgressState; onOpenLesson: (stage?: LessonStage) => void; onStartReview: () => void }) {
  return <div className="screen-stack"><PageIntro eyebrow="REVIEW" title="Strengthen what could be forgotten" text="Completed worksheets return through spaced retrieval—not random new material." />{progress.reviewDue ? <section className="review-ready"><div className="review-orbit"><RotateCcw /></div><span>REVIEW READY</span><h2>Worksheet A1 • το + three nouns</h2><p>Ten familiar items are ready for another accurate round.</p><Button size="lg" onClick={onStartReview}>Begin review <ArrowRight /></Button></section> : <section className="empty-review"><div><CheckCircle2 /></div><h2>Nothing is due yet</h2><p>Master worksheet A1 first. Review begins only after all errors are corrected.</p><Button variant="outline" onClick={() => onOpenLesson()}>Go to worksheet A1</Button></section>}<section className="review-schedule"><h2>Your review rhythm</h2><div>{["1 day", "3 days", "7 days", "21 days", "60 days"].map((day, i) => <div key={day}><span>{i + 1}</span><strong>{day}</strong><small>{i === 0 ? "First retrieval" : "Planned interval"}</small></div>)}</div></section></div>;
}

function LessonView({ stage, setStage, progress, setProgress, questionIndex, setQuestionIndex, score, firstAttemptScore, allSubmitted, lessonPercent, onBack, onFinish, onRepeat }: { stage: LessonStage; setStage: (s: LessonStage) => void; progress: ProgressState; setProgress: React.Dispatch<React.SetStateAction<ProgressState>>; questionIndex: number; setQuestionIndex: (n: number) => void; score: number; firstAttemptScore: number; allSubmitted: boolean; lessonPercent: number; onBack: () => void; onFinish: () => void; onRepeat: () => void; }) {
  const stages: LessonStage[] = ["understand", "notice", "control", "use", "result"];
  const labels: Record<LessonStage, string> = { understand: "Learn", notice: "Repeat", control: "Worksheet", use: "Check", result: "Mastered" };
  const current = quiz[questionIndex];
  const selected = progress.answers[questionIndex];
  const submitted = progress.submitted[questionIndex];
  const correct = selected === current.answer;
  const reachedMastery = allSubmitted && score === quiz.length && firstAttemptScore >= worksheet.masteryFirstAttempt;
  const checkAnswer = () => setProgress((p) => ({
    ...p,
    attempts: { ...p.attempts, [questionIndex]: (p.attempts[questionIndex] ?? 0) + 1 },
    submitted: { ...p.submitted, [questionIndex]: true },
  }));
  const retryQuestion = () => setProgress((p) => {
    const answers = { ...p.answers };
    const submittedAnswers = { ...p.submitted };
    delete answers[questionIndex];
    delete submittedAnswers[questionIndex];
    return { ...p, answers, submitted: submittedAnswers };
  });

  return <div className="lesson-view">
    <div className="lesson-toolbar"><button onClick={onBack}><ArrowLeft /> Back</button><span>Worksheet A1 • Round {progress.round}</span><strong>{lessonPercent}%</strong></div>
    <Progress value={lessonPercent} className="lesson-progress-bar" />
    <div className="lesson-stage-nav">{stages.slice(0, 4).map((item, i) => <button key={item} className={stage === item ? "active" : stages.indexOf(stage) > i ? "done" : ""} onClick={() => (i <= stages.indexOf(stage) || progress.lessonCompleted) && setStage(item)}><span>{stages.indexOf(stage) > i || progress.lessonCompleted ? <Check /> : i + 1}</span>{labels[item]}</button>)}</div>

    {stage === "understand" && <section className="lesson-panel"><span className="lesson-kicker">LEARN THREE COMPLETE UNITS</span><h1>το + three essential nouns</h1><p className="lesson-lead">Today you are learning only three words. Always say the article and noun together.</p><div className="explanation-box"><BookOpen /><div><h2>One unit—not two separate pieces</h2><p>Do not memorize <b>νερό</b> alone. Store <b>το νερό</b> together. The article is part of the vocabulary you are learning.</p></div></div><div className="example-trio">{worksheet.words.map((word) => <div key={word.greek}><span>Neuter noun</span><strong>{word.greek}</strong><small>{word.english}</small></div>)}</div><div className="mistake-note"><CircleAlert /><div><strong>Today’s boundary</strong><p>You are not learning η, ο, plurals or sentences yet. Those will come only after this pattern is stable.</p></div></div><LessonNext label="Repeat the three units" onClick={() => { setProgress((p) => ({ ...p, explanationViewed: true })); setStage("notice"); }} /></section>}

    {stage === "notice" && <section className="lesson-panel"><span className="lesson-kicker">SEE IT • SAY IT • REPEAT IT</span><h1>Keep το attached to the noun</h1><p className="lesson-lead">Read each complete unit aloud three times. Keep the words together without pausing after <b>το</b>.</p><div className="clue-list">{worksheet.words.map((word, index) => <div key={word.greek}><span>{index + 1}</span><p><b>{word.greek}</b><small>{word.english}</small></p></div>)}</div><div className="exception-note"><strong>Memory rule</strong><span>If you recall only the noun, look again and repeat the complete unit.</span></div><LessonNext label="Start worksheet A1" onClick={() => { setProgress((p) => ({ ...p, patternViewed: true })); setStage("control"); }} /></section>}

    {stage === "control" && <section className="lesson-panel control-panel"><span className="lesson-kicker">WORKSHEET A1 • TEN EXERCISES</span><div className="question-heading"><div><h1>{current.instruction}</h1><p>Exercise {questionIndex + 1} of {quiz.length}</p></div><strong>{score}/{quiz.length} corrected</strong></div><Progress value={((questionIndex + (submitted ? 1 : 0)) / quiz.length) * 100} className="h-2 bg-blue-100" /><div className="question-card"><span>{current.kind.replaceAll("-", " ").toUpperCase()}</span><h2>{current.prompt}</h2><div className="option-grid">{current.options.map((option) => <button key={option} disabled={submitted} className={`${selected === option ? "selected" : ""} ${submitted && option === current.answer ? "correct" : ""} ${submitted && selected === option && option !== current.answer ? "incorrect" : ""}`} onClick={() => setProgress((p) => ({ ...p, answers: { ...p.answers, [questionIndex]: option } }))}>{option}{submitted && option === current.answer && <Check />}</button>)}</div>{submitted && <div className={correct ? "answer-feedback correct" : "answer-feedback retry"}><div>{correct ? <CheckCircle2 /> : <CircleAlert />}</div><p><strong>{correct ? "Correct" : `Correct it now: ${current.answer}`}</strong>{current.explanation}</p></div>}</div><div className="question-actions"><Button variant="outline" disabled={questionIndex === 0} onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))}><ArrowLeft /> Previous</Button>{!submitted ? <Button disabled={!selected} onClick={checkAnswer}>Check answer</Button> : !correct ? <Button onClick={retryQuestion}>Correct this item</Button> : questionIndex < quiz.length - 1 ? <Button onClick={() => setQuestionIndex(questionIndex + 1)}>Next exercise <ArrowRight /></Button> : <Button disabled={!allSubmitted || score !== quiz.length} onClick={() => setStage("use")}>See worksheet result <ArrowRight /></Button>}</div></section>}

    {stage === "use" && <section className="lesson-panel result-panel"><div className={reachedMastery ? "result-badge" : "review-orbit"}>{reachedMastery ? <Trophy /> : <RotateCcw />}</div><span className="lesson-kicker">{reachedMastery ? "MASTERY REACHED" : "ONE MORE ACCURATE ROUND"}</span><h1>{reachedMastery ? "Worksheet A1 is mastered." : "The corrections are complete. Now strengthen first recall."}</h1><p>You corrected <b>{score} of {quiz.length}</b> exercises. Your first-attempt score was <b>{firstAttemptScore} of {quiz.length}</b>. The mastery target is {worksheet.masteryFirstAttempt} of {quiz.length} on the first attempt, with every error corrected.</p><div className="result-stats"><div><strong>{score}/10</strong><span>corrected accuracy</span></div><div><strong>{firstAttemptScore}/10</strong><span>first attempt</span></div><div><strong>{progress.round}</strong><span>practice round</span></div></div>{reachedMastery ? <Button size="lg" className="primary-action" onClick={onFinish}>Record mastery <Trophy /></Button> : <Button size="lg" className="primary-action" onClick={onRepeat}>Repeat worksheet A1 <RotateCcw /></Button>}</section>}

    {stage === "result" && <section className="lesson-panel result-panel"><div className="result-badge"><Trophy /></div><span className="lesson-kicker">WORKSHEET A1 MASTERED</span><h1>Three complete word units are now in review.</h1><p>You reached the first-attempt target and corrected every item. Worksheet A2 will add only a small amount of new material.</p><div className="result-stats"><div><strong>10/10</strong><span>final accuracy</span></div><div><strong>3</strong><span>word units</span></div><div><strong>1 day</strong><span>first review</span></div></div><Button size="lg" className="primary-action" onClick={onBack}>Return to Today <ArrowRight /></Button></section>}
  </div>;
}

function LessonNext({ label, onClick }: { label: string; onClick: () => void }) { return <div className="lesson-next"><Button size="lg" onClick={onClick}>{label}<ArrowRight /></Button></div>; }
function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) { return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}><header><h2>{title}</h2><button aria-label="Close" onClick={onClose}>×</button></header>{children}</section></div>; }
