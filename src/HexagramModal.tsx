import { Fragment, useRef } from 'react';
import type { DemoResult } from './prototype';
import { HexagramLine } from './Hexagram';
import useModalDialog from './useModalDialog';
import './hexagram-modal.css';

export default function HexagramModal({ result, onClose }: { result: DemoResult; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { dialogRef, modalEvents } = useModalDialog(onClose, titleRef);
  return <dialog ref={dialogRef} className="hex-dialog type-system-page" aria-modal="true" aria-labelledby="hex-dialog-title" aria-describedby="hex-dialog-intro"
    {...modalEvents}>
    <div className="hex-dialog-head">
      <h2 ref={titleRef} id="hex-dialog-title" className="hex-dialog-title type-hex-title" tabIndex={-1}>Расшифровка</h2>
      <button ref={closeRef} type="button" className="hex-dialog-close type-close" onClick={onClose} aria-label="Закрыть расшифровку">×</button>
    </div>
    <div ref={contentRef} className="hex-dialog-content" tabIndex={0} role="region" aria-label="Код и шесть признаков">
      <p id="hex-dialog-intro" className="hex-dialog-intro type-hex-intro">Гексаграмма — это шесть линий, образующих двоичный код. Каждые три линии составляют триграмму. Гексаграмма читается снизу вверх: от первой линии к шестой.</p>
      <div className="hex-code-label type-code-label">ТВОЙ КОД</div>
      <div className="hex-code-groups type-code" role="group" aria-label={`Код: ${result.bits.slice(0, 3).split('').join(' ')} — ${result.bits.slice(3).split('').join(' ')}, снизу вверх`}>
        <div className="hex-code-trigram" aria-label={`Нижняя триграмма ${result.bits.slice(0, 3)}`}>
          {result.bits.slice(0, 3).split('').map((bit, index) => <span key={index}>{bit}</span>)}
        </div>
        <span className="hex-code-dash type-code-dash" aria-hidden="true">–</span>
        <div className="hex-code-trigram" aria-label={`Верхняя триграмма ${result.bits.slice(3)}`}>
          {result.bits.slice(3).split('').map((bit, index) => <span key={index}>{bit}</span>)}
        </div>
      </div>
      <div className="hex-code-notes type-code-note"><span>нижняя триграмма</span><span>верхняя триграмма</span></div>
      <div className="hex-traits" aria-label="Шесть линий сверху вниз; код читается снизу вверх">
        {[[5, 4, 3], [2, 1, 0]].map((indices, group) => <Fragment key={group}>
          {group === 1 && <div className="hex-trigram-gap" aria-hidden="true" />}
          <section aria-labelledby={`hex-trigram-${group}`}>
            <h3 id={`hex-trigram-${group}`} className="hex-trigram-label type-trigram-label">{group === 0 ? 'Верхняя триграмма' : 'Нижняя триграмма'}</h3>
            {indices.map(index => <div key={index} className="hex-trait" data-axis={index + 1} data-bit={result.bits[index]}>
              <span className="hex-trait-bit type-bit">{result.bits[index]}</span>
              <svg className="hex-trait-symbol" viewBox="0 0 62 15" aria-hidden="true">
                <HexagramLine bit={result.bits[index]} x={1} y={5} width={60} height={5} gap={8} />
              </svg>
              <span className="hex-trait-text type-trait">{result.preferences[index]}</span>
            </div>)}
          </section>
        </Fragment>)}
      </div>
    </div>
  </dialog>;
}
