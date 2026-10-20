import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import questionsData from './prototype-questions.json';
import { loadDemoResult } from './prototype';
import type { DemoQuestion, DemoResult } from './prototype';
import PalettePicker from './PalettePicker';
import HomePage from './HomePage';
import type { Palette } from './PalettePicker';

type Screen = 'welcome' | 'core1' | 'core2' | 'transition' | 'clarifier' | 'forced' | 'result';
const route: Screen[] = ['welcome', 'core1', 'core2', 'transition', 'clarifier', 'forced', 'result'];
const questions = questionsData as DemoQuestion[];
const questionIndex: Partial<Record<Screen, number>> = { core1: 0, core2: 1, clarifier: 2, forced: 3 };

function Arrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`arrow ${back ? 'arrow-back' : ''}`}><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

function Hexagram({ decorative = false }: { decorative?: boolean }) {
  // Lines go bottom to top: axes 1–3 below, 4–6 above. 0 is broken, 1 solid.
  return <svg viewBox="0 0 64 70" aria-hidden={decorative || undefined} className="hexagram">
    {'000011'.split('').map((bit, index) => <g key={index} stroke="currentColor" strokeWidth="5">
      {bit === '1' ? <path d={`M6 ${62 - index * 11}h52`} /> : <path d={`M6 ${62 - index * 11}h21m10 0h21`} />}
    </g>)}
  </svg>;
}

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
  const [lastScreen, setLastScreen] = useState<Screen>('core1');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState('');
  const [showHexagram, setShowHexagram] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const hasAnswers = Object.keys(answers).length > 0;
  const currentQuestion = questions[questionIndex[screen] ?? -1];

  useLayoutEffect(() => {
    document.documentElement.dataset.palette = palette;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-base').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [palette]);

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
    if (next !== 'welcome') setLastScreen(next);
  }

  function restart() {
    setAnswers({});
    setConfirmRestart(false);
    setLastScreen('core1');
    navigate('core1');
  }

  return <>
    <aside className="prototype-bar" aria-label="Навигация по прототипу">
      <p><span className="prototype-dot" />Прототип M1 <span className="prototype-separator">/</span> <span>дизайн и переходы</span></p>
      <div className="prototype-controls">
      <PalettePicker palette={palette} onChange={setPalette} />
      <details className="screen-picker" name="prototype-controls"><summary>Смотреть экраны <span aria-hidden="true">⌄</span></summary>
        <nav aria-label="Экраны прототипа">{([
          ['welcome', 'Приветствие'], ['core1', 'Основной вопрос'], ['transition', 'Переход к уточнениям'],
          ['clarifier', 'Уточняющий вопрос'], ['forced', 'Прямой вопрос'], ['result', 'Результат · Fiat 500'],
        ] as [Screen, string][]).map(([target, label]) => <button key={target} onClick={event => {
          navigate(target); event.currentTarget.closest('details')?.removeAttribute('open');
        }}>{label}</button>)}</nav>
      </details>
      </div>
    </aside>

    {screen === 'welcome' ? <HomePage heading={heading}
      onStart={() => navigate(hasAnswers || lastScreen === 'result' ? lastScreen : 'core1')} /> : <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate('welcome')} aria-label="Автомобильная книга перемен — на приветственный экран">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Автомобильная<br /><strong>книга перемен</strong></span>
        </button>
        <span className="header-note">Немного игры.<br />Много характера.</span>
      </header>

      <main id="main-content">
        {currentQuestion && <section className="question-page">
          <div className="question-progress">
            <p className="eyebrow">{currentQuestion.role === 'core' ? `Вопрос ${screen === 'core1' ? '1' : '2'} из 12` : 'Уточняющие вопросы'}</p>
            {currentQuestion.role === 'core' ? <div className="progress-segments" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <span key={index} className={index < (screen === 'core1' ? 1 : 2) ? 'active' : ''} />)}</div> : <span className="small-flower" aria-hidden="true">✧</span>}
          </div>
          <form onSubmit={event => { event.preventDefault(); if (answers[currentQuestion.id]) navigate(route[route.indexOf(screen) + 1]); }}>
            <fieldset>
              <legend className="sr-only">{currentQuestion.situation} {currentQuestion.prompt}</legend>
              {currentQuestion.situation && <p className="question-situation">{currentQuestion.situation}</p>}
              <h1 className="question-title" ref={heading} tabIndex={-1}>{currentQuestion.prompt}</h1>
              <div className="answer-options">
                {currentQuestion.options.map(option => <label className={`answer-option ${answers[currentQuestion.id] === option.code ? 'is-selected' : ''}`} key={option.code}>
                  <input type="radio" name={currentQuestion.id} value={option.code} checked={answers[currentQuestion.id] === option.code}
                    onChange={() => setAnswers(previous => ({ ...previous, [currentQuestion.id]: option.code }))} />
                  <span className="answer-letter" aria-hidden="true">{option.code}</span>
                  <span className="answer-copy">{option.text}</span>
                  <span className="answer-indicator" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg></span>
                </label>)}
              </div>
            </fieldset>
            <div className="question-navigation">
              <button type="button" className="text-button back-button" onClick={() => navigate(route[route.indexOf(screen) - 1])}><Arrow back />Назад</button>
              <button className="button button-primary" disabled={!answers[currentQuestion.id]} type="submit">Далее<Arrow /></button>
            </div>
          </form>
          <p className="demo-note">Сокращённый маршрут для просмотра: два основных вопроса, уточнение и прямой вопрос. Ответы пока не вычисляют результат и не сохраняются после перезагрузки.</p>
        </section>}

        {screen === 'transition' && <section className="transition-page">
          <div className="transition-mark" aria-hidden="true">✧</div>
          <p className="eyebrow">Ещё немного деталей</p>
          <h1 ref={heading} tabIndex={-1}>Осталось уточнить<br /><em>несколько деталей</em></h1>
          <button className="button button-primary" onClick={() => navigate('clarifier')}>Продолжить<Arrow /></button>
          <button className="text-button back-button" onClick={() => navigate('core2')}><Arrow back />Назад</button>
          <p className="demo-note">В прототипе этот переход показан для знакомства с оформлением. В полной игре уточнения появятся только при необходимости.</p>
        </section>}

        {screen === 'result' && <section className="result-page">
          <p className="result-demo-label"><span className="prototype-dot" />Пример результата · ответы не определяют эту карточку</p>
          {error ? <div role="alert" className="error-message"><h1 ref={heading} tabIndex={-1}>Карточка не загрузилась</h1><p>{error}</p><button className="button" onClick={() => window.location.reload()}>Попробовать ещё раз</button></div>
            : !result ? <p role="status">Открываем карточку…</p> : <article className="result-card">
              <div className="result-heading">
                <div><p className="eyebrow">Твой характер</p><h1 ref={heading} tabIndex={-1}>{result.personTitle}</h1></div>
                <button className="hexagram-button" onClick={() => setShowHexagram(true)} aria-label="Пояснение гексаграммы: шесть предпочтений"><Hexagram decorative /><span>О характере</span></button>
              </div>
              <p className="person-portrait">{result.personPortrait}</p>
              <div className="twin-section">
                <p className="twin-intro">{result.twinIntro}</p>
                <h2 className="car-name">{result.carName}</h2>
                <div className="car-photo"><img src={result.photo} alt={result.carName} width="960" height="527" /></div>
                <p className="technical-specs"><span>Техника:</span> {result.technicalSpecs}</p>
                <p className="car-story">{result.twinExplanation}</p>
                <a className="photo-source" href={result.source} target="_blank" rel="noopener noreferrer">Источник фотографии <span aria-hidden="true">↗</span></a>
              </div>
              <div className="result-actions"><button className="button button-primary" onClick={() => setConfirmRestart(true)}>Пройти ещё раз<Arrow /></button>
                <button className="text-button" onClick={() => navigate('welcome')}>На приветственный экран</button></div>
            </article>}
        </section>}
      </main>
      <footer className="site-footer"><span>Автомобильная книга перемен</span><span>Игра о людях и машинах</span></footer>
    </div>}

    {showHexagram && result && <Modal title="Шесть граней характера" onClose={() => setShowHexagram(false)}>
      <p className="modal-intro">В этой карточке соединились такие предпочтения:</p>
      <ol className="preferences">{result.preferences.map((text, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span>{text.charAt(0).toUpperCase() + text.slice(1)}</li>)}</ol>
      <button className="button button-primary" onClick={() => setShowHexagram(false)}>Вернуться к карточке</button>
    </Modal>}

    {confirmRestart && <Modal title="Начать новую игру?" onClose={() => setConfirmRestart(false)}>
      <p className="modal-intro">Текущие ответы будут очищены. Можно вернуться к ним, если пока не хочется начинать заново.</p>
      <div className="confirm-actions"><button className="button button-primary" onClick={restart}>Начать заново</button><button className="button button-secondary" onClick={() => setConfirmRestart(false)}>Отмена</button></div>
    </Modal>}
  </>;
}
