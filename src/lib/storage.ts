const KEYS = {
  formatIds: 'signage.formatIds',
  customFormats: 'signage.customFormats',
  project: 'signage.project',
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Returns false when storage is full or blocked: the app still works, it just won't remember. */
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadFormatIds(): string[] | null {
  const ids = read<unknown>(KEYS.formatIds);
  return Array.isArray(ids) && ids.every((x) => typeof x === 'string') && ids.length > 0 ? ids : null;
}

export function saveFormatIds(ids: string[]) {
  write(KEYS.formatIds, ids);
}

export function loadCustomFormats(): unknown[] | null {
  const list = read<unknown>(KEYS.customFormats);
  return Array.isArray(list) ? list : null;
}

export function saveCustomFormats(list: unknown[]) {
  write(KEYS.customFormats, list);
}

/** The autosaved project, unvalidated: see parseProjectFile. */
export function loadAutosave(): unknown {
  return read<unknown>(KEYS.project);
}

/** False when the project didn't fit in storage (usually large images). */
export function saveAutosave(project: unknown): boolean {
  return write(KEYS.project, project);
}
