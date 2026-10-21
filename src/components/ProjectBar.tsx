import { useRef, useState } from 'react';

type Pending = 'new' | 'duplicate' | null;

interface Props {
  autosaveOk: boolean;
  status: string;
  onNew: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onOpen: (file: File) => void;
}

const CONFIRM: Record<Exclude<Pending, null>, { text: string; action: string }> = {
  new: {
    text: 'Start a blank event? This clears the current one. Save the project first if you’ll need it again.',
    action: 'Start new event',
  },
  duplicate: {
    text: 'Start the next event in this series? Keeps the template, theme, logos and accommodations line; clears the event details.',
    action: 'Duplicate event',
  },
};

/** New, duplicate, save and open. Starting over asks first, since the working copy is replaced. */
export function ProjectBar({ autosaveOk, status, onNew, onDuplicate, onSave, onOpen }: Props) {
  const [pending, setPending] = useState<Pending>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function ask(kind: Exclude<Pending, null>, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setPending(kind);
    requestAnimationFrame(() => confirmRef.current?.focus());
  }

  function cancel() {
    setPending(null);
    triggerRef.current?.focus();
  }

  return (
    <section className="project-bar" aria-label="Project">
      <div className="project-actions">
        <button type="button" className="button-secondary" onClick={(e) => ask('new', e.currentTarget)}>
          Start new event
        </button>
        <button type="button" className="button-secondary" onClick={(e) => ask('duplicate', e.currentTarget)}>
          Duplicate event
        </button>
        <button type="button" className="button-secondary" onClick={onSave}>
          Save project
        </button>
        <button type="button" className="button-secondary" onClick={() => fileRef.current?.click()}>
          Open project
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onOpen(file);
          }}
        />
      </div>
      {pending && (
        <div className="project-confirm" role="group" aria-label={CONFIRM[pending].action}>
          <p>{CONFIRM[pending].text}</p>
          <button
            ref={confirmRef}
            type="button"
            className="button-primary"
            onClick={() => {
              setPending(null);
              (pending === 'new' ? onNew : onDuplicate)();
            }}
          >
            {CONFIRM[pending].action}
          </button>
          <button type="button" className="button-secondary" onClick={cancel}>
            Cancel
          </button>
        </div>
      )}
      <p className="project-status">
        {autosaveOk
          ? 'Changes are saved in this browser automatically.'
          : 'Autosave is off: this event’s images are too large for browser storage. Use Save project to keep it.'}
        {status && ` ${status}`}
      </p>
    </section>
  );
}
