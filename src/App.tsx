import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import questionsData from './prototype-questions.json';
import { loadDemoResult } from './prototype';
import type { DemoQuestion, DemoResult } from './prototype';
import PalettePicker from './PalettePicker';
import HomePage from './HomePage';
import InterviewScreen from './InterviewScreen';
import ResultScreen from './ResultScreen';
import HexagramModal from './HexagramModal';
import ExitInterviewModal from './ExitInterviewModal';
import type { Palette } from './PalettePicker';

type Screen = 'welcome' | 'core1' | 'core2' | 'clarifier' | 'forced' | 'result';
const route: Screen[] = ['welcome', 'core1', 'core2', 'clarifier', 'forced', 'result'];
const questions = questionsData as DemoQuestion[];
const questionIndex: Partial<Record<Screen, number>> = { core1: 0, core2: 1, clarifier: 2, forced: 3 };

export default function App() {
  const [palette, setPalette] = useState<Palette>('graphite');
  const [screen, setScreen] = useState<Screen>('welcome');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');
  const [showHexagram, setShowHexagram] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const currentQuestion = questions[questionIndex[screen] ?? -1];

  useLayoutEffect(() => {
    document.documentElement.dataset.palette = palette;
    document.documentElement.dataset.view = screen === 'result' ? 'result' : 'game';
    const color = getComputedStyle(document.documentElement).getPropertyValue(screen === 'result' ? '--result-paper' : '--color-base').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [palette, screen]);

  useEffect(() => {
    if (screen !== 'result') return;
    const controller = new AbortController();
    setResult(null);
    setError('');
    loadDemoResult(controller.signal).then(value => {
      if (!controller.signal.aborted) setResult(value);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Не удалось прочитать каталог.');
    });
    return () => controller.abort();
  }, [screen]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [screen]);

  function navigate(next: Screen) {
    setScreen(next);
  }

  function clearInterview() {
    setAnswers({});
    setResult(null);
    setError('');
    setShowHexagram(false);
    setShowExit(false);
  }

  function restart() {
    clearInterview();
    navigate('core1');
  }

  return <>
    {screen === 'welcome' && <aside className="prototype-bar type-prototype" aria-label="Навигация по прототипу">
      <p className="type-prototype-caption"><span className="prototype-dot" />Прототип M1 <span className="prototype-separator">/</span> <span>дизайн и переходы</span></p>
      <div className="prototype-controls">
      <PalettePicker palette={palette} onChange={setPalette} />
      <details className="screen-picker" name="prototype-controls"><summary>Смотреть экраны <span aria-hidden="true">⌄</span></summary>
        <nav aria-label="Экраны прототипа">{([
          ['welcome', 'Приветствие'], ['core1', 'Основной вопрос'],
          ['clarifier', 'Уточняющий вопрос'], ['forced', 'Прямой вопрос'], ['result', 'Результат · Fiat 500'],
        ] as [Screen, string][]).map(([target, label]) => <button className="type-menu-button" key={target} onClick={event => {
          navigate(target); event.currentTarget.closest('details')?.removeAttribute('open');
        }}>{label}</button>)}</nav>
      </details>
      </div>
    </aside>}

    {screen === 'welcome' ? <HomePage heading={heading}
      onStart={restart} /> : currentQuestion ? <InterviewScreen
        question={currentQuestion} number={screen === 'core1' || screen === 'clarifier' ? 1 : 2} answer={answers[currentQuestion.id]} heading={heading}
        onSelect={code => setAnswers(previous => ({ ...previous, [currentQuestion.id]: code }))}
        onBack={() => screen === 'core1' ? setShowExit(true) : navigate(route[route.indexOf(screen) - 1])}
        onNext={() => navigate(route[route.indexOf(screen) + 1])} /> : <ResultScreen result={result} error={error} heading={heading}
      onHome={() => navigate('welcome')} onHexagram={() => setShowHexagram(true)} />}

    {showHexagram && result && <HexagramModal result={result} onClose={() => setShowHexagram(false)} />}
    {showExit && <ExitInterviewModal onStay={() => setShowExit(false)} onExit={() => {
      clearInterview();
      navigate('welcome');
    }} />}

  </>;
}
