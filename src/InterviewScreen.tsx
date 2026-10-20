import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { DemoQuestion } from './prototype';
import './interview.css';

export default function InterviewScreen({ question, number, answer, heading, onSelect, onBack, onNext }: {
  question: DemoQuestion;
  number: number;
  answer?: string;
  heading: RefObject<HTMLHeadingElement | null>;
  onSelect: (code: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const confirming = useRef(false);
  useEffect(() => { confirming.current = false; }, [question.id]);
  const hasNeutral = question.options.some(option => option.code === 'В');
  const isCore = question.role === 'core';
  const isForced = question.role === 'forced';

  return <main id="main-content" className="interview-page">
    <header className="interview-top"><span>{isCore ? 'Собираем код твоей гексаграммы' : 'Вносим окончательную ясность'}</span></header>
    <section className="interview-progress" aria-label="Ход интервью">
      <div className="interview-progress-head"><span>{isCore ? 'ОСНОВНЫЕ ВОПРОСЫ' : 'УТОЧНЯЮЩИЕ ВОПРОСЫ'}</span>{isCore && <span className="interview-count">{number} / 12</span>}</div>
      <div className="interview-track" role="progressbar" aria-label={isCore ? 'Основные вопросы' : 'Уточняющие вопросы'} aria-valuemin={1} aria-valuemax={12} aria-valuenow={number} aria-valuetext={isCore ? `Вопрос ${number} из 12` : `Уточняющий вопрос ${number}; максимум 12 вопросов, этап может закончиться раньше`}>
        {Array.from({ length: 12 }, (_, index) => <span key={index} className={index < number ? 'is-active' : ''} />)}
      </div>
    </section>
    <section aria-labelledby="interview-ask">
      <div className={`interview-copy${isForced ? ' is-forced' : ''}`}>
        {isForced ? <h1 id="interview-ask" className="interview-final-question" ref={heading} tabIndex={-1}>
          {[question.situation, question.prompt].filter(Boolean).join(' ')}
        </h1> : <>
          {question.situation && <p className="interview-situation">{question.situation}</p>}
          <h1 id="interview-ask" ref={heading} tabIndex={-1}>{question.prompt}</h1>
        </>}
      </div>
      <div className="interview-choices" role="group" aria-label="Выбери один вариант ответа">
        {question.options.map(option => <button type="button" key={option.code}
          className={`interview-choice${answer === option.code ? ' is-selected' : ''}`}
          aria-pressed={answer === option.code} onClick={() => onSelect(option.code)}>
          <span className="interview-letter">{option.code}</span><span className="interview-answer">{option.text}</span>
        </button>)}
      </div>
    </section>
    <nav className="interview-nav" aria-label="Навигация по вопросам">
      <button type="button" onClick={onBack}><span aria-hidden="true">← </span>Назад</button>
      <button type="button" disabled={!answer} onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }}
        onClick={event => {
          if (!answer || confirming.current || event.detail > 1) return;
          confirming.current = true;
          onNext();
        }}>Далее<span aria-hidden="true"> →</span></button>
    </nav>
    {hasNeutral && <div className="interview-hint">
      <p><strong>Не можешь выбрать?</strong> Выбирай нейтральный ответ — мы будем задавать дополнительные вопросы, пока ты не определишься.</p>
      <p>Помни: гексаграмма строится из двоичного кода, поэтому рано или поздно придётся выбрать между чёрным и белым.</p>
    </div>}
    <footer className="interview-footer">Автомобильная книга перемен</footer>
  </main>;
}
