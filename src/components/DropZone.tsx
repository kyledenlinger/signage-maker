import { useRef, useState } from 'react';
import type { ImageAsset } from '../schema/event';

interface Props {
  /** Id of the (hidden) file input; the visible button is `${id}-button`. */
  id: string;
  label: string;
  hint?: string;
  accept: string;
  multiple?: boolean;
  /** Files already added. */
  files: ImageAsset[];
  /** At most this many files (multiple only). */
  max?: number;
  error?: string;
  /** Extra lines under a file, e.g. a resolution warning. */
  note?: string;
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
}

/**
 * Drag-and-drop upload with a real "Choose a file" button. Shows a thumbnail, name and size for
 * each file, with Replace and Remove. The native file input stays hidden; it's what the button and
 * drop feed.
 */
export function DropZone({ id, label, hint, accept, multiple, files, max = 1, error, note, onFiles, onRemove }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = multiple ? files.length >= max : false;
  const single = !multiple && files.length > 0;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const action = single ? 'Replace' : multiple && files.length ? 'Add another' : 'Choose a file';

  return (
    <div className="field">
      <span className="drop-label" id={`${id}-label`}>
        {label}
      </span>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div
        className={`drop-zone ${dragging ? 'is-dragging' : ''} ${error ? 'is-invalid' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = Array.from(e.dataTransfer.files);
          if (dropped.length) onFiles(multiple ? dropped : dropped.slice(0, 1));
        }}
      >
        {files.length > 0 && (
          <ul className="drop-files">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="drop-file">
                <img src={file.dataUrl} alt="" className="drop-thumb" />
                <span className="drop-file-text">
                  <span className="drop-file-name">{file.name}</span>
                  <span className="muted">
                    {file.width} × {file.height} px
                  </span>
                </span>
                <button
                  type="button"
                  className="button-secondary button-small"
                  aria-label={`Remove ${label.toLowerCase()}: ${file.name}`}
                  onClick={() => onRemove(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {note && <p className="field-warning">{note}</p>}
        {!full && (
          <div className="drop-prompt">
            {!single && (
              <span className="muted" aria-hidden="true">
                Drag {multiple ? 'files' : 'a file'} here, or
              </span>
            )}
            <button
              type="button"
              id={`${id}-button`}
              className="button-secondary"
              aria-label={`${action}: ${label}`}
              aria-describedby={describedBy}
              onClick={() => input.current?.click()}
            >
              {action}
            </button>
          </div>
        )}
      </div>
      <input
        ref={input}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="visually-hidden"
        tabIndex={-1}
        aria-labelledby={`${id}-label`}
        aria-invalid={error ? true : undefined}
        data-focus-target={`${id}-button`}
        onChange={(e) => {
          const chosen = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (chosen.length) onFiles(chosen);
        }}
      />
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
