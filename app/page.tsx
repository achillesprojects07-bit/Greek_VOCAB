"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  ListChecks,
  LockKeyhole,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import curriculum from "@/data/a1-foundations.json";

type Screen = "today" | "path" | "practice" | "vocabulary" | "review";
type Stage = "understand" | "notice" | "control" | "use" | "result";
type Worksheet = (typeof curriculum.worksheets)[number];

type WorksheetState = {
  answers: Record<number, string>;
  submitted: Record<number, boolean>;
  attempts: Record<number, number>;
  round: number;
  mastered: boolean;
  bestFirstAttempt: number;
  reviewStep: number;
  dueAt: string | null;
  started: boolean;
};

type ProgressState = {
  currentIndex: number;
  activeDays: number;
  items: Record<string, WorksheetState>;
};

const STORAGE_KEY = "greek_mastery_state_v3";
const worksheets = curriculum.worksheets;
const reviewIntervals = curriculum.reviewIntervalsDays;

function blankWorksheetState(): WorksheetState {
  return {
    answers: {}, submitted: {}, attempts: {}, round: 1, mastered: false,
    bestFirstAttempt: 0, reviewStep: 0, dueAt: null, started: false,
  };
}

function initialProgress(): ProgressState {
  return { currentIndex: 0, activeDays: 1, items: {} };
}

function loadProgress(): ProgressState {
  if (typeof window === "undefined") return initialProgress();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return initialProgress();
    return {
      ...initialProgress(),
      ...saved,
      currentIndex: Math.max(0, Math.min(worksheets.length - 1, Number(saved.currentIndex) || 0)),
      items: saved.items || {},
    };
  } catch {
    return initialProgress();
  }
}

function scheduleDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function speakGreek(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "el-GR";
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}

const NAV = [
  { id: "today" as const, label: "Today", icon: Home },
  { id: "path" as const, label: "Path", icon: GraduationCap },
  { id: "practice" as const, label: "Practice", icon: Target },
  { id: "vocabulary" as const, label: "Vocabulary", icon: Languages },
  { id: "review" as const, label: "Review", icon: RotateCcw },
];

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("today");
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [hydrated, setHydrated] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("understand");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [qaOpen, setQaOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = loadProgress();
      setProgress(restored);
      setSelectedUnit(worksheets[restored.currentIndex]?.unitNumber || 1);
      setHydrated(true);
    }, 0);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => undefined);
    }
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  const worksheet = worksheets[progress.currentIndex] || worksheets[0];
  const worksheetState = progress.items[worksheet.id] || blankWorksheetState();
  const completedCount = worksheets.filter((item) => progress.items[item.id]?.mastered).length;
  const unitCompletedCount = worksheets.filter((item) => item.unitNumber === worksheet.unitNumber && progress.items[item.id]?.mastered).length;
  const dueWorksheets = worksheets.filter((item) => {
    const state = progress.items[item.id];
    return state?.mastered && state.dueAt && new Date(state.dueAt) <= new Date();
  });

  const updateWorksheet = (id: string, updater: (state: WorksheetState) => WorksheetState) => {
    setProgress((previous) => ({
      ...previous,
      items: { ...previous.items, [id]: updater(previous.items[id] || blankWorksheetState()) },
    }));
  };

  const openWorksheet = (index: number, startStage: Stage = "understand") => {
    const unlocked = index === 0 || Boolean(progress.items[worksheets[index - 1].id]?.mastered);
    if (!unlocked) return;
    const chosen = worksheets[index];
    setProgress((previous) => ({
      ...previous,
      currentIndex: index,
      items: {
        ...previous.items,
        [chosen.id]: { ...(previous.items[chosen.id] || blankWorksheetState()), started: true },
      },
    }));
    setSelectedUnit(chosen.unitNumber);
    setQuestionIndex(0);
    setStage(startStage);
    setLessonOpen(true);
  };

  const startReview = (index: number) => {
    const chosen = worksheets[index];
    setProgress((previous) => {
      const old = previous.items[chosen.id] || blankWorksheetState();
      return {
        ...previous,
        currentIndex: index,
        items: {
          ...previous.items,
          [chosen.id]: { ...old, answers: {}, submitted: {}, attempts: {}, round: old.round + 1, started: true },
        },
      };
    });
    setQuestionIndex(0);
    setStage("control");
    setLessonOpen(true);
  };

  if (!hydrated) return <main className="loading-screen">Preparing your next small step…</main>;

  if (lessonOpen) {
    return (
      <LessonView
        worksheet={worksheet}
        state={worksheetState}
        stage={stage}
        setStage={setStage}
        questionIndex={questionIndex}
        setQuestionIndex={setQuestionIndex}
        updateState={(updater) => updateWorksheet(worksheet.id, updater)}
        onClose={() => setLessonOpen(false)}
        onMaster={() => {
          updateWorksheet(worksheet.id, (old) => {
            const nextStep = old.mastered ? Math.min(old.reviewStep + 1, reviewIntervals.length - 1) : 0;
            return {
              ...old,
              mastered: true,
              reviewStep: nextStep,
              dueAt: scheduleDate(reviewIntervals[nextStep]),
            };
          });
          setStage("result");
        }}
        onRepeat={() => {
          updateWorksheet(worksheet.id, (old) => ({
            ...old, answers: {}, submitted: {}, attempts: {}, round: old.round + 1,
          }));
          setQuestionIndex(0);
          setStage("control");
        }}
        onContinue={() => {
          const nextIndex = Math.min(progress.currentIndex + 1, worksheets.length - 1);
          setLessonOpen(false);
          setStage("understand");
          setQuestionIndex(0);
          setProgress((old) => ({ ...old, currentIndex: nextIndex }));
          setSelectedUnit(worksheets[nextIndex].unitNumber);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <Brand />
        <nav className="side-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${screen === id ? "active" : ""}`} onClick={() => setScreen(id)}>
              <Icon /> <span>{label}</span>{id === "review" && dueWorksheets.length > 0 && <i />}
            </button>
          ))}
        </nav>
        <button className="sidebar-status" onClick={() => setQaOpen(true)}>
          <ShieldCheck /><span><strong>A1 FOUNDATIONS • v0.5.0</strong><small>5 units • 1,000 exercises</small></span>
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="mobile-brand"><Brand compact /></div>
            <div className="topbar-context"><span>A1 FOUNDATIONS</span><strong>Unit {worksheet.unitNumber} · {worksheet.code}</strong></div>
            <div className="topbar-actions">
              <CourseSelector
                selectedUnit={selectedUnit}
                currentWorksheet={worksheet}
                progress={progress}
                onUnitChange={(unitNumber) => {
                  setSelectedUnit(unitNumber);
                  setScreen("path");
                }}
                onWorksheetChange={(id) => {
                  const index = worksheets.findIndex((item) => item.id === id);
                  if (index < 0) return;
                  setProgress((previous) => ({ ...previous, currentIndex: index }));
                  setSelectedUnit(worksheets[index].unitNumber);
                  setScreen("today");
                }}
              />
              <button className="topbar-qa" onClick={() => setQaOpen(true)}><ShieldCheck /> Quality checks</button>
            </div>
          </div>
        </header>
        <main className="content-wrap">
          {screen === "today" && <TodayScreen worksheet={worksheet} state={worksheetState} completed={completedCount} unitCompleted={unitCompletedCount} onStart={() => openWorksheet(progress.currentIndex)} onPath={() => setScreen("path")} />}
          {screen === "path" && <PathScreen progress={progress} selectedUnit={selectedUnit} onOpen={openWorksheet} />}
          {screen === "practice" && <PracticeScreen worksheet={worksheet} state={worksheetState} onStart={() => openWorksheet(progress.currentIndex, worksheetState.started ? "control" : "understand")} onReview={() => dueWorksheets[0] && startReview(worksheets.findIndex((w) => w.id === dueWorksheets[0].id))} dueCount={dueWorksheets.length} />}
          {screen === "vocabulary" && <VocabularyScreen active={worksheet} />}
          {screen === "review" && <ReviewScreen progress={progress} due={dueWorksheets} onReview={(id) => startReview(worksheets.findIndex((w) => w.id === id))} />}
        </main>
      </div>

      <nav className="mobile-nav">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} className={screen === id ? "active" : ""} onClick={() => setScreen(id)}>
            <Icon /><span>{label}</span>{id === "review" && dueWorksheets.length > 0 && <i className="mobile-dot" />}
          </button>
        ))}
      </nav>
      {qaOpen && <QualityModal onClose={() => setQaOpen(false)} />}
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "compact" : ""}`}><span className="brand-mark">Ε</span><div><strong>Greek Mastery</strong><span>SMALL STEPS • REAL PROGRESS</span></div></div>;
}

function CourseSelector({ selectedUnit, currentWorksheet, progress, onUnitChange, onWorksheetChange }: {
  selectedUnit: number;
  currentWorksheet: Worksheet;
  progress: ProgressState;
  onUnitChange: (unitNumber: number) => void;
  onWorksheetChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const unit = curriculum.units.find((item) => item.unitNumber === selectedUnit) || curriculum.units[0];
  const currentValue = currentWorksheet.unitNumber === selectedUnit ? currentWorksheet.id : undefined;
  return <Sheet open={open} onOpenChange={setOpen}>
    <SheetTrigger asChild><button className="course-menu-button" aria-label="Open course menu"><BookOpen /><span><small>Course</small><strong>{currentWorksheet.code}</strong></span><ChevronRight /></button></SheetTrigger>
    <SheetContent className="course-sheet" side="right">
      <SheetHeader className="course-sheet-header"><span className="course-sheet-icon"><BookOpen /></span><SheetTitle>Your course</SheetTitle><SheetDescription>Return to Unit 1 or choose any worksheet you have unlocked.</SheetDescription></SheetHeader>
      <div className="current-step-card"><small>CURRENT STEP</small><strong>{currentWorksheet.code} · {currentWorksheet.title}</strong><span>Unit {currentWorksheet.unitNumber}: {currentWorksheet.unitTitle}</span></div>
      <div className="course-sheet-fields">
        <label><span>Choose a unit</span><Select value={String(selectedUnit)} onValueChange={(value) => onUnitChange(Number(value))}>
          <SelectTrigger className="course-select-trigger" aria-label="Select unit"><SelectValue /></SelectTrigger>
          <SelectContent position="popper" align="end">
            {curriculum.units.map((item) => <SelectItem key={item.unitNumber} value={String(item.unitNumber)}>Unit {item.unitNumber}: {item.title}</SelectItem>)}
          </SelectContent>
        </Select></label>
        <label><span>Choose an available worksheet</span><Select value={currentValue} onValueChange={(id) => { onWorksheetChange(id); setOpen(false); }}>
          <SelectTrigger className="worksheet-select-trigger" aria-label="Select worksheet"><SelectValue placeholder="Choose worksheet" /></SelectTrigger>
          <SelectContent position="popper" align="end">
            <SelectGroup><SelectLabel>{unit.title}</SelectLabel>
              {unit.worksheets.map((item) => {
                const index = worksheets.findIndex((worksheet) => worksheet.id === item.id);
                const unlocked = index === 0 || Boolean(progress.items[worksheets[index - 1].id]?.mastered);
                return <SelectItem key={item.id} value={item.id} disabled={!unlocked}>{item.code}: {item.title}{unlocked ? "" : " — locked"}</SelectItem>;
              })}
            </SelectGroup>
          </SelectContent>
        </Select></label>
      </div>
      <div className="course-sheet-help"><LockKeyhole /><p><strong>Mastery controls the path.</strong><span>Earlier work stays available. New worksheets unlock only after you master the previous step.</span></p></div>
      <Button className="view-unit-button" onClick={() => { onUnitChange(selectedUnit); setOpen(false); }}>View Unit {selectedUnit} path<ArrowRight /></Button>
    </SheetContent>
  </Sheet>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>;
}

function TodayScreen({ worksheet, state, completed, unitCompleted, onStart, onPath }: { worksheet: Worksheet; state: WorksheetState; completed: number; unitCompleted: number; onStart: () => void; onPath: () => void }) {
  const correct = worksheet.exercises.filter((item, index) => state.submitted[index] && state.answers[index] === item.answer).length;
  return <div className="today-screen">
    <section className="today-grid">
      <div className="learning-column">
        <div className="welcome-copy"><span className="eyebrow">TODAY’S FOCUS</span><h1>One small step at a time.</h1><p>Master one pattern before the next one unlocks.</p></div>
        <section className="focus-card">
          <div className="focus-top"><span>CURRENT WORKSHEET</span><small><Clock3 /> {worksheet.estimatedMinutes}–{worksheet.estimatedMinutes + 2} min</small></div>
          <div className="focus-body"><div className="focus-number">{worksheet.code.replace("U", "").replace("–W", ".")}</div><div><span className="unit-kicker">UNIT {worksheet.unitNumber} · {worksheet.unitTitle}</span><h2>{worksheet.title}</h2><p>{worksheet.rule}</p></div></div>
          <div className="lesson-progress"><div><span>Worksheet progress</span><strong>{state.mastered ? "Mastered" : `${correct}/10 correct`}</strong></div><Progress value={state.mastered ? 100 : correct * 10} /></div>
          <Button className="primary-action" onClick={onStart}>{state.started ? "Continue worksheet" : "Start this small step"}<ArrowRight /></Button>
        </section>
      </div>
      <aside className="today-rail" aria-label="Learning progress">
        <section className="progress-card">
          <span className="eyebrow">YOUR PROGRESS</span>
          <div className="progress-score"><strong>{completed}</strong><span>of 100 worksheets<br />mastered</span></div>
          <Progress value={completed} />
          <div className="unit-progress-row"><span>Unit {worksheet.unitNumber}</span><strong>{unitCompleted}/20</strong></div>
          <Button variant="outline" className="path-action" onClick={onPath}>View course path<ArrowRight /></Button>
        </section>
        <div className="mastery-note"><Trophy /><div><strong>Mastery first</strong><span>New work unlocks only when the current step is secure.</span></div></div>
      </aside>
    </section>
    <section className="method-section"><div className="section-heading"><div><span className="eyebrow">TODAY’S METHOD</span><h2>Learn, notice, retrieve, master</h2></div><span>One controlled cycle</span></div>
      <div className="plan-grid"><PlanItem n="1" title="Learn" text="One explicit rule" /><PlanItem n="2" title="Notice" text={`${worksheet.words.length} word units`} /><PlanItem n="3" title="Retrieve" text="10 exercises" /><PlanItem n="4" title="Master" text="9/10 first try" /></div>
    </section>
  </div>;
}

function PlanItem({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="plan-item"><span className="plan-number">{n}</span><div><strong>{title}</strong><span>{text}</span></div></div>;
}

function PathScreen({ progress, selectedUnit, onOpen }: { progress: ProgressState; selectedUnit: number; onOpen: (index: number) => void }) {
  const completed = worksheets.filter((w) => progress.items[w.id]?.mastered).length;
  return <div className="screen-stack"><PageIntro eyebrow="YOUR A1 PATH" title="Five foundations, mastered in minute steps" text="Each unit contains 20 worksheets and 200 exercises. Every worksheet must be mastered before the next one unlocks." />
    <section className="level-overview"><div><span>A1 FOUNDATION BATCH 1</span><strong>1,000 exercises</strong></div><Progress value={(completed / worksheets.length) * 100} /><p>Articles → είμαι → statements and questions → regular verbs → high-frequency verbs</p></section>
    {curriculum.units.filter((unit) => unit.unitNumber === selectedUnit).map((unit) => <section className="unit-path" key={unit.unitNumber}><header><div><span>UNIT {unit.unitNumber}</span><h2>{unit.title}</h2><p>{unit.objective}</p></div><strong>{unit.worksheets.filter((w) => progress.items[w.id]?.mastered).length}/20</strong></header><div className="path-list">{unit.worksheets.map((item) => {
      const index = worksheets.findIndex((worksheet) => worksheet.id === item.id);
      const state = progress.items[item.id]; const unlocked = index === 0 || Boolean(progress.items[worksheets[index - 1].id]?.mastered);
      return <button key={item.id} disabled={!unlocked} onClick={() => onOpen(index)} className={`path-row ${state?.mastered ? "complete" : ""} ${progress.currentIndex === index ? "current" : ""}`}>
        <span className="path-number">{state?.mastered ? <Check /> : unlocked ? item.sequence : <LockKeyhole />}</span><div><strong>{item.code}. {item.title}</strong><span>{item.words.length} focus units • 10 exercises • mastery {item.masteryFirstAttempt}/10</span></div>{unlocked && <ChevronRight />}
      </button>;
    })}</div></section>)}
  </div>;
}

function PracticeScreen({ worksheet, state, onStart, onReview, dueCount }: { worksheet: Worksheet; state: WorksheetState; onStart: () => void; onReview: () => void; dueCount: number }) {
  return <div className="screen-stack"><PageIntro eyebrow="PRACTICE" title="Train exactly what is ready" text="The app limits difficulty so vocabulary and grammar never jump at the same time." />
    <div className="practice-grid"><button className="practice-card featured" onClick={onStart}><span className="practice-icon"><ListChecks /></span><span>CURRENT MICRO-STEP • {worksheet.code}</span><h2>{worksheet.title}</h2><p>{worksheet.rule}</p><strong>{state.started ? "Continue" : "Begin"}<ArrowRight /></strong></button>
      <div className="practice-card"><span className="practice-icon pale"><RotateCcw /></span><span>SPACED REVIEW</span><h2>{dueCount ? `${dueCount} review${dueCount > 1 ? "s" : ""} ready` : "Nothing due"}</h2><p>Mastered material returns after 1, 3, 7, 21 and 60 days.</p>{dueCount > 0 && <Button onClick={onReview}>Start review</Button>}</div>
      <div className="practice-card"><span className="practice-icon pale"><Headphones /></span><span>LISTENING</span><h2>Begins at A16</h2><p>Audio appears only after the written article families are stable.</p><small><LockKeyhole /> Graded progression</small></div></div>
  </div>;
}

function VocabularyScreen({ active }: { active: Worksheet }) {
  const allWords = useMemo(() => Array.from(new Map(worksheets.flatMap((w) => w.words).map((word) => [word.greek, word])).values()), []);
  const [query, setQuery] = useState("");
  const shown = allWords.filter((word) => `${word.greek} ${word.english}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="screen-stack"><PageIntro eyebrow="VOCABULARY AND FORMS" title="Learn complete, reusable Greek units" text={`${active.code} focuses on ${active.words.length} units. The current five-unit course contains ${allWords.length} carefully reused forms and word units.`} />
    <div className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Greek or English" /></div>
    <div className="word-library">{shown.map((word) => <div className="word-row" key={word.greek}><div><strong>{word.greek}</strong><span>{word.english}</span></div><small>{word.family}</small><button aria-label={`Hear ${word.greek}`} onClick={() => speakGreek(word.greek)}><Volume2 /></button></div>)}</div>
  </div>;
}

function ReviewScreen({ progress, due, onReview }: { progress: ProgressState; due: Worksheet[]; onReview: (id: string) => void }) {
  const upcoming = worksheets.map((w) => ({ w, state: progress.items[w.id] })).filter((x) => x.state?.mastered && x.state.dueAt).sort((a, b) => String(a.state.dueAt).localeCompare(String(b.state.dueAt)))[0];
  return <div className="screen-stack"><PageIntro eyebrow="SPACED REVIEW" title="Recall just before it fades" text="Reviews are scheduled from demonstrated mastery, not from simply opening a lesson." />
    {due.length ? <section className="review-ready"><div className="review-orbit"><RotateCcw /></div><span>READY NOW</span><h2>{due.length} worksheet{due.length > 1 ? "s" : ""} due</h2><p>Repeat all ten items. Every mistake must still be corrected.</p><Button onClick={() => onReview(due[0].id)}>Review {due[0].code}</Button></section>
      : <section className="empty-review"><div><CheckCircle2 /></div><h2>Nothing is due yet</h2><p>{upcoming ? `Next review: ${upcoming.w.code} on ${new Date(upcoming.state.dueAt!).toLocaleDateString()}.` : "Master your first worksheet to start the review schedule."}</p></section>}
    <section className="review-schedule"><h2>Review rhythm</h2><div>{reviewIntervals.map((days, index) => <div key={days}><span>{index + 1}</span><strong>{days} day{days > 1 ? "s" : ""}</strong><small>after mastery</small></div>)}</div></section>
  </div>;
}

function LessonView({ worksheet, state, stage, setStage, questionIndex, setQuestionIndex, updateState, onClose, onMaster, onRepeat, onContinue }: {
  worksheet: Worksheet; state: WorksheetState; stage: Stage; setStage: (stage: Stage) => void; questionIndex: number; setQuestionIndex: (n: number) => void; updateState: (updater: (state: WorksheetState) => WorksheetState) => void; onClose: () => void; onMaster: () => void; onRepeat: () => void; onContinue: () => void;
}) {
  const exercises = worksheet.exercises;
  const score = exercises.filter((item, i) => state.submitted[i] && state.answers[i] === item.answer).length;
  const firstAttempt = exercises.filter((item, i) => state.submitted[i] && state.answers[i] === item.answer && state.attempts[i] === 1).length;
  const allCorrect = score === exercises.length;
  const stages: Stage[] = ["understand", "notice", "control", "use"];
  const stageIndex = stage === "result" ? 4 : stages.indexOf(stage);
  const current = exercises[questionIndex];
  const globalIndex = worksheets.findIndex((item) => item.id === worksheet.id);
  const nextWorksheet = worksheets[globalIndex + 1];
  const selected = state.answers[questionIndex] || "";
  const submitted = Boolean(state.submitted[questionIndex]);
  const correct = selected === current?.answer;

  const choose = (answer: string) => {
    if (submitted) return;
    updateState((old) => ({ ...old, answers: { ...old.answers, [questionIndex]: answer } }));
  };
  const check = () => {
    if (!selected || submitted) return;
    updateState((old) => ({ ...old, submitted: { ...old.submitted, [questionIndex]: true }, attempts: { ...old.attempts, [questionIndex]: (old.attempts[questionIndex] || 0) + 1 } }));
  };
  const retry = () => updateState((old) => ({ ...old, answers: { ...old.answers, [questionIndex]: "" }, submitted: { ...old.submitted, [questionIndex]: false } }));

  return <div className="lesson-shell"><div className="lesson-view">
    <div className="lesson-toolbar"><button onClick={onClose}><ArrowLeft /> Save and leave</button><span>{worksheet.code} • Unit {worksheet.unitNumber}</span><strong>Round {state.round}</strong></div>
    <div className="lesson-progress-bar"><Progress value={stageIndex * 25 + (stage === "control" ? ((questionIndex + 1) / 10) * 25 : 0)} /></div>
    <nav className="lesson-stage-nav">{stages.map((name, index) => <button key={name} className={index === stageIndex ? "active" : index < stageIndex ? "done" : ""} onClick={() => index < stageIndex && setStage(name)}><span>{index < stageIndex ? <Check /> : index + 1}</span>{name}</button>)}</nav>

    {stage === "understand" && <section className="lesson-panel"><span className="eyebrow">ONE RULE ONLY</span><h1>{worksheet.title}</h1><p className="lesson-lead">{worksheet.rule}</p><div className="explanation-box"><BookOpen /><div><h2>How to use the rule</h2><ol className="rule-steps">{worksheet.ruleSteps.map((step) => <li key={step}>{step}</li>)}</ol></div></div><h2 className="subhead">Today’s complete word units</h2><div className="example-trio">{worksheet.words.map((word) => <div key={word.greek}><span>{word.family}</span><strong>{word.greek}</strong><small>{word.english}</small><button className="audio-button" onClick={() => speakGreek(word.greek)}><Volume2 /> Hear it</button></div>)}</div><div className="mistake-note"><CircleAlert /><div><strong>Do not memorize a bare noun.</strong><p>Store the article and noun together: for example, <b>{worksheet.words[0].greek}</b>.</p></div></div><LessonNext onClick={() => setStage("notice")} label="See the pattern" /></section>}

    {stage === "notice" && <section className="lesson-panel"><span className="eyebrow">NOTICE AND SAY</span><h1>Build a reliable memory trace</h1><p className="lesson-lead">Listen, then say every complete unit three times. The exercise vocabulary is limited to words shown here or reviewed earlier.</p><div className="pattern-table"><div className="pattern-head"><span>Complete unit</span><span>Meaning</span><span>Listen</span></div>{worksheet.words.map((word) => <div key={word.greek}><b>{word.greek}</b><strong>{word.english}</strong><button className="audio-button" onClick={() => speakGreek(word.greek)}><Volume2 /></button></div>)}</div><div className="exception-note"><Sparkles /> You are not expected to infer every gender. Endings give clues; repeated complete units create accuracy.</div><LessonNext onClick={() => { setQuestionIndex(0); setStage("control"); }} label="Start 10 exercises" /></section>}

    {stage === "control" && <section className="lesson-panel"><div className="question-heading"><div><span className="eyebrow">CONTROLLED RETRIEVAL</span><h1>Exercise {questionIndex + 1} of 10</h1><p>{current.instruction}</p></div><strong>{score}/10 correct</strong></div><div className="question-card"><span>{current.kind.toUpperCase()}</span>{current.audioText && <button className="listen-button" onClick={() => speakGreek(current.audioText!)}><Volume2 /> Play Greek audio</button>}<h2>{current.prompt}</h2><div className="option-grid">{current.options.map((option) => <button key={option} disabled={submitted} onClick={() => choose(option)} className={`${selected === option ? "selected" : ""} ${submitted && option === current.answer ? "correct" : ""} ${submitted && selected === option && option !== current.answer ? "incorrect" : ""}`}>{option}{submitted && option === current.answer && <Check />}</button>)}</div>{submitted && <div className={`answer-feedback ${correct ? "correct" : "retry"}`}>{correct ? <CheckCircle2 /> : <CircleAlert />}<p><strong>{correct ? "Correct." : "Correct this before moving on."}</strong><span>{current.explanation}</span></p></div>}</div><div className="question-actions"><Button variant="outline" disabled={questionIndex === 0} onClick={() => setQuestionIndex(questionIndex - 1)}><ArrowLeft /> Previous</Button>{!submitted ? <Button disabled={!selected} onClick={check}>Check answer</Button> : correct ? <Button onClick={() => questionIndex < 9 ? setQuestionIndex(questionIndex + 1) : setStage("use")}>{questionIndex < 9 ? "Next exercise" : "See your result"}<ArrowRight /></Button> : <Button onClick={retry}><RotateCcw /> Correct this item</Button>}</div></section>}

    {stage === "use" && <section className="lesson-panel result-panel"><div className="result-badge"><Target /></div><span className="eyebrow">MASTERY CHECK</span><h1>{allCorrect ? "Every item is now correct." : "Finish every correction first."}</h1><p>Mastery requires all 10 answers correct and at least 9 correct on the first attempt. If the first-attempt score is lower, repeating this same micro-step is the learning method—not a failure.</p><div className="result-stats"><div><strong>{score}/10</strong><span>correct now</span></div><div><strong>{firstAttempt}/10</strong><span>first attempt</span></div><div><strong>{state.round}</strong><span>practice round</span></div></div>{allCorrect && firstAttempt >= worksheet.masteryFirstAttempt ? <Button onClick={onMaster}><Trophy /> Record mastery</Button> : <Button onClick={onRepeat}><RotateCcw /> Repeat this worksheet</Button>}</section>}

    {stage === "result" && <section className="lesson-panel result-panel"><div className="result-badge"><Trophy /></div><span className="eyebrow">WORKSHEET MASTERED</span><h1>{worksheet.code} is secure.</h1><p>You met the accuracy gate. This material is scheduled for spaced review, and the next small step is now unlocked.</p><div className="result-stats"><div><strong>10/10</strong><span>corrected score</span></div><div><strong>{firstAttempt}/10</strong><span>first attempt</span></div><div><strong>{reviewIntervals[state.reviewStep] || 1} day</strong><span>next review</span></div></div><Button onClick={onContinue}>{nextWorksheet ? `Continue to ${nextWorksheet.code}` : "Return to Today"}<ArrowRight /></Button></section>}
  </div></div>;
}

function LessonNext({ onClick, label }: { onClick: () => void; label: string }) {
  return <div className="lesson-next"><Button onClick={onClick}>{label}<ArrowRight /></Button></div>;
}

function QualityModal({ onClose }: { onClose: () => void }) {
  const total = worksheets.reduce((sum, worksheet) => sum + worksheet.exercises.length, 0);
  const ids = new Set(worksheets.flatMap((worksheet) => worksheet.exercises.map((exercise) => exercise.id)));
  const checks = [
    ["Five sequential units", curriculum.units.length === 5], ["Exercise count", total === 1000], ["Unique exercise IDs", ids.size === 1000], ["Ten items per worksheet", worksheets.every((w) => w.exercises.length === 10)], ["Explicit rule in every worksheet", worksheets.every((w) => w.rule.length > 30)], ["Full written Greek forms", !JSON.stringify(curriculum).includes("Κι ")],
  ] as const;
  return <div className="modal-backdrop" onClick={onClose}><section className="modal-card" onClick={(event) => event.stopPropagation()}><header><h2>Curriculum quality checks</h2><button onClick={onClose}>×</button></header><div className="qa-summary"><ShieldCheck /><div><strong>Five units generated and validated</strong><span>Version 0.5.0 • deterministic curriculum data</span></div></div><div className="check-list">{checks.map(([label, pass]) => <div key={label}><span>{label}</span><strong className={pass ? "check-pass" : "check-warn"}>{pass ? "PASS" : "CHECK"}</strong></div>)}</div><Button onClick={onClose}>Close</Button></section></div>;
}
