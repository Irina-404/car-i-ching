import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadQuestionBank, loadResult } from './data';
import { getRoute, resolveProfile, setAnswer } from './interview';
import type { Answers, QuestionBank } from './interview';
import type { ResultData } from './catalog';
import HomePage from './HomePage';
import InterviewScreen from './InterviewScreen';
import ResultScreen from './ResultScreen';
import HexagramModal from './HexagramModal';
import ExitInterviewModal from './ExitInterviewModal';

type Screen = 'welcome' | 'interview' | 'result';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [session, setSession] = useState<{ answers: Answers; questionId: string }>({ answers: {}, questionId: '1.1' });
  const [result, setResult] = useState<ResultData | null>(null);
  const [bankError, setBankError] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [showHexagram, setShowHexagram] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const route = bank ? getRoute(session.answers, bank) : [];
  const index = route.findIndex(q => q.id === session.questionId);
  const currentQuestion = route[index];
  const bits = bank ? resolveProfile(session.answers, bank) : null;

  useLayoutEffect(() => {
    document.documentElement.dataset.palette = 'graphite';
    document.documentElement.dataset.view = screen === 'result' ? 'result' : 'game';
    const color = getComputedStyle(document.documentElement).getPropertyValue(screen === 'result' ? '--result-paper' : '--color-base').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [screen]);

  useEffect(() => {
    const controller = new AbortController();
    setBankError('');
    loadQuestionBank(controller.signal).then(value => {
      if (!controller.signal.aborted) setBank(value);
    }).catch(error => {
      if (!controller.signal.aborted) setBankError(error instanceof Error ? error.message : 'Не удалось прочитать вопросы.');
    });
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (screen !== 'result' || !bits) return;
    const controller = new AbortController();
    setResult(null);
    setError('');
    loadResult(bits, controller.signal).then(value => {
      if (!controller.signal.aborted) setResult(value);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Не удалось прочитать каталог.');
    });
    return () => controller.abort();
  }, [screen, bits, retry]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [screen, session.questionId, bank, bankError, error]);

  function clearInterview() {
    setSession({ answers: {}, questionId: '1.1' });
    setResult(null);
    setError('');
    setShowHexagram(false);
    setShowExit(false);
  }

  function restart() {
    clearInterview();
    setScreen('interview');
  }

  return <>
    {screen === 'welcome' ? <HomePage heading={heading} onStart={restart} />
      : screen === 'interview' ? bank && currentQuestion ? <InterviewScreen
        question={currentQuestion} number={index < 12 ? index + 1 : index - 11}
        answer={session.answers[currentQuestion.id]} heading={heading}
        onSelect={code => setSession(previous => ({ ...previous, answers: setAnswer(previous.answers, previous.questionId, code, bank) }))}
        onBack={() => index === 0 ? setShowExit(true) : setSession(previous => ({ ...previous, questionId: route[index - 1].id }))}
        onNext={() => {
          if (!session.answers[currentQuestion.id]) return;
          const next = route[index + 1];
          if (next) setSession(previous => ({ ...previous, questionId: next.id }));
          else if (bits) setScreen('result');
        }} /> : <main id="main-content" className="interview-page type-system-page">
          {bankError ? <div role="alert">
            <h1 className="type-status-title" ref={heading} tabIndex={-1}>Вопросы не загрузились</h1>
            <p className="type-status-body">{bankError}</p>
            <button className="type-interview-button" onClick={() => setRetry(value => value + 1)}>Попробовать ещё раз</button>
            <button className="type-interview-button" onClick={() => setScreen('welcome')}>Вернуться на главную</button>
          </div> : <p role="status" className="type-status-body">Загружаем вопросы…</p>}
        </main> : <ResultScreen result={result} error={error} heading={heading}
          onHome={() => setScreen('welcome')} onHexagram={() => setShowHexagram(true)} onRetry={() => setRetry(value => value + 1)} />}

    {showHexagram && result && <HexagramModal result={result} onClose={() => setShowHexagram(false)} />}
    {showExit && <ExitInterviewModal onStay={() => setShowExit(false)} onExit={() => {
      clearInterview();
      setScreen('welcome');
    }} />}
  </>;
}
