import { useRef } from 'react';
import useModalDialog from './useModalDialog';
import './exit-interview-modal.css';

export default function ExitInterviewModal({ onStay, onExit }: { onStay: () => void; onExit: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null);
  const confirming = useRef(false);
  const { dialogRef, modalEvents } = useModalDialog(onStay, stayRef);
  return <dialog ref={dialogRef} className="exit-dialog type-exit-dialog" role="alertdialog" aria-modal="true"
    aria-labelledby="exit-dialog-title" aria-describedby="exit-dialog-description" {...modalEvents}>
    <h2 className="type-exit-title" id="exit-dialog-title">Вернуться к началу?</h2>
    <p className="type-exit-body" id="exit-dialog-description">Твои ответы в этом прохождении будут удалены. Если захочешь начать игру снова, придётся отвечать на вопросы заново.</p>
    <div className="exit-dialog-actions">
      <button ref={stayRef} type="button" className="exit-dialog-stay type-exit-button" onClick={onStay}>Остаться</button>
      <button type="button" className="exit-dialog-leave type-exit-button" onClick={() => {
        if (confirming.current) return;
        confirming.current = true;
        onExit();
      }}>Выйти</button>
    </div>
  </dialog>;
}
