import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { ResultData } from './catalog';
import Hexagram from './Hexagram';
import './result.css';

export default function ResultScreen({ result, error, heading, onHome, onHexagram, onRetry }: {
  result: ResultData | null;
  error: string;
  heading: RefObject<HTMLHeadingElement | null>;
  onHome: () => void;
  onHexagram: () => void;
  onRetry: () => void;
}) {
  useEffect(() => { if (result) heading.current?.focus({ preventScroll: true }); }, [result, heading]);
  return <main id="main-content" className="result-screen type-system-page">
    {error ? <div role="alert"><h1 className="type-status-title" ref={heading} tabIndex={-1}>Карточка не загрузилась</h1><p className="type-status-body">{error}</p>
      <button className="result-return type-result-button" onClick={onRetry}>Попробовать ещё раз</button>
      <button className="result-return type-result-button" onClick={onHome}>Вернуться на главную</button></div>
      : !result ? <p role="status" className="type-status-body">Открываем карточку…</p> : <article>
        <div className="result-hero">
          <h1 className="result-name type-heading-1" ref={heading} tabIndex={-1}>{result.personTitle}</h1>
          <button className="result-hex" onClick={onHexagram} aria-haspopup="dialog" aria-label="Открыть описание гексаграммы">
            <Hexagram bits={result.bits} />
          </button>
        </div>
        <p className="result-portrait type-portrait">{result.personPortrait}</p>
        <p className="result-lead type-result-lead">{result.twinIntro}</p>
        <h2 className="result-car-title type-heading-2">{result.carName}</h2>
        <img className="result-photo" src={result.photo} alt={result.carName} />
        <p className="result-specs type-specs">Техника: {result.technicalSpecs}</p>
        <p className="result-story type-story">{result.twinExplanation}</p>
        <button className="result-return type-result-button" onClick={onHome}>Вернуться на главную <span aria-hidden="true">→</span></button>
        <div className="result-credit">
          {result.source ? <a className="result-source type-source" href={result.source} target="_blank" rel="noopener noreferrer">Источник фотографии <span aria-hidden="true">↗</span></a> : <span className="result-source type-source">Источник фотографии не указан</span>}
          {(result.author || result.license) && <p className="result-attribution type-attribution">{[result.author, result.license].filter(Boolean).join(' · ')}</p>}
        </div>
      </article>}
  </main>;
}
