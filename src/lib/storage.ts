const KEYS = {
  formatIds: 'signage.formatIds',
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app still works, it just won't remember.
  }
}

export function loadFormatIds(): string[] | null {
  const ids = read<unknown>(KEYS.formatIds);
  return Array.isArray(ids) && ids.every((x) => typeof x === 'string') && ids.length > 0 ? ids : null;
}

export function saveFormatIds(ids: string[]) {
  write(KEYS.formatIds, ids);
}
