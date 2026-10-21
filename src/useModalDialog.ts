import { useLayoutEffect, useRef } from 'react';
import type { RefObject, KeyboardEvent, MouseEvent, PointerEvent, SyntheticEvent } from 'react';

// Shared native-dialog lifecycle: inert background, scroll lock and focus restoration.
export default function useModalDialog(onDismiss: () => void, initialFocus: RefObject<HTMLElement | null>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startedOutside = useRef(false);
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const x = window.scrollX, y = window.scrollY;
    const body = document.body, html = document.documentElement;
    const properties = ['position', 'top', 'left', 'width', 'overflow', 'padding-right'];
    const saved = properties.map(property => [property, body.style.getPropertyValue(property), body.style.getPropertyPriority(property)]);
    const overflow = html.style.overflow;
    const gutter = window.innerWidth - html.clientWidth;
    const padding = parseFloat(getComputedStyle(body).paddingRight);
    body.style.position = 'fixed';
    body.style.top = `${-y}px`;
    body.style.left = `${-x}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.paddingRight = `${padding + gutter}px`;
    html.style.overflow = 'hidden';
    dialog.showModal();
    initialFocus.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      saved.forEach(([property, value, priority]) => body.style.setProperty(property, value, priority));
      html.style.overflow = overflow;
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [initialFocus]);

  function outside(clientX: number, clientY: number) {
    const box = dialogRef.current!.getBoundingClientRect();
    return clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom;
  }
  const modalEvents = {
    onCancel(event: SyntheticEvent<HTMLDialogElement>) { event.preventDefault(); onDismiss(); },
    onPointerDown(event: PointerEvent<HTMLDialogElement>) { startedOutside.current = outside(event.clientX, event.clientY); },
    onClick(event: MouseEvent<HTMLDialogElement>) { if (startedOutside.current && outside(event.clientX, event.clientY)) onDismiss(); },
    onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
      if (event.key !== 'Tab') return;
      const items = [...dialogRef.current!.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')];
      const index = items.indexOf(document.activeElement as HTMLElement);
      if (!items.length) { event.preventDefault(); return; }
      if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === items.length - 1)) {
        event.preventDefault();
        items[event.shiftKey ? items.length - 1 : 0].focus({ preventScroll: true });
      }
    },
  };
  return { dialogRef, modalEvents };
}
