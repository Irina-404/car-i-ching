import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import questionsData from './prototype-questions.json';
import { loadDemoResult } from './prototype';
import type { DemoQuestion, DemoResult } from './prototype';
import PalettePicker from './PalettePicker';
import HomePage from './HomePage';
import InterviewScreen from './InterviewScreen';
import ResultScreen from './ResultScreen';
import type { Palette } from './PalettePicker';

type Screen = 'welcome' | 'core1' | 'core2' | 'clarifier' | 'forced' | 'result';
const route: Screen[] = ['welcome', 'core1', 'core2', 'clarifier', 'forced', 'result'];
const questions = questionsData as DemoQuestion[];
const questionIndex: Partial<Record<Screen, number>> = { core1: 0, core2: 1, clarifier: 2, forced: 3 };

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-body">
      <div className="modal-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></div>
      {children}
    </div>
  </dialog>;
}

export default function App() {
  const [palette, setPalette] = useState<Palette>('graphite');
  const [screen, setScreen] = useState<Screen>('welcome');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');
  const [showHexagram, setShowHexagram] = useState(false);
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
    const controller = new AbortController();
    loadDemoResult(controller.signal).then(setResult).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Не удалось прочитать каталог.');
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo({ top: 0, behavior: 'instant' });
    heading.current?.focus({ preventScroll: true });
  }, [screen]);

  function navigate(next: Screen) {
    setScreen(next);
  }

  function restart() {
    setAnswers({});
    navigate('core1');
  }

  return <>
    {screen === 'welcome' && <aside className="prototype-bar" aria-label="Навигация по прототипу">
      <p><span className="prototype-dot" />Прототип M1 <span className="prototype-separator">/</span> <span>дизайн и переходы</span></p>
      <div className="prototype-controls">
      <PalettePicker palette={palette} onChange={setPalette} />
      <details className="screen-picker" name="prototype-controls"><summary>Смотреть экраны <span aria-hidden="true">⌄</span></summary>
        <nav aria-label="Экраны прототипа">{([
          ['welcome', 'Приветствие'], ['core1', 'Основной вопрос'],
          ['clarifier', 'Уточняющий вопрос'], ['forced', 'Прямой вопрос'], ['result', 'Результат · Fiat 500'],
        ] as [Screen, string][]).map(([target, label]) => <button key={target} onClick={event => {
          navigate(target); event.currentTarget.closest('details')?.removeAttribute('open');
        }}>{label}</button>)}</nav>
      </details>
      </div>
    </aside>}

    {screen === 'welcome' ? <HomePage heading={heading}
      onStart={restart} /> : currentQuestion ? <InterviewScreen
        question={currentQuestion} number={screen === 'core1' || screen === 'clarifier' ? 1 : 2} answer={answers[currentQuestion.id]} heading={heading}
        onSelect={code => setAnswers(previous => ({ ...previous, [currentQuestion.id]: code }))}
        onBack={() => navigate(route[route.indexOf(screen) - 1])}
        onNext={() => navigate(route[route.indexOf(screen) + 1])} /> : <ResultScreen result={result} error={error} heading={heading}
      onHome={() => navigate('welcome')} onHexagram={() => setShowHexagram(true)} />}

    {showHexagram && result && <Modal title="Шесть граней характера" onClose={() => setShowHexagram(false)}>
      <p className="modal-intro">В этой карточке соединились такие предпочтения:</p>
      <ol className="preferences">{result.preferences.map((text, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span>{text.charAt(0).toUpperCase() + text.slice(1)}</li>)}</ol>
      <button className="button button-primary" onClick={() => setShowHexagram(false)}>Вернуться к карточке</button>
    </Modal>}

  </>;
}
