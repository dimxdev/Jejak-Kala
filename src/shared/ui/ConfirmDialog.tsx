import { useEffect, useRef } from 'react';
import { useT } from '@/i18n';
import { buttonClass } from './button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A modal question with two answers, built on the native <dialog> (focus trap and Esc come for free). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-line bg-panel p-0 text-fg shadow-xl backdrop:bg-fg/40"
    >
      <div className="flex flex-col gap-4 p-5">
        <h2 id="confirm-title" className="font-display text-xl">
          {title}
        </h2>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={buttonClass('ghost')} onClick={onCancel}>
            {cancelLabel ?? t.dialog.cancel}
          </button>
          <button type="button" className={buttonClass()} onClick={onConfirm}>
            {confirmLabel ?? t.dialog.confirm}
          </button>
        </div>
      </div>
    </dialog>
  );
}
