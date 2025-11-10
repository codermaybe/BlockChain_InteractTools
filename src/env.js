// Environment helper to support both Vite (VITE_*) and CRA (REACT_APP_*)
export function env(name, fallback = undefined) {
  const viteKey = `VITE_${name}`;
  const reactKey = `REACT_APP_${name}`;
  const clean = (v) => {
    if (v === undefined || v === null) return fallback;
    if (typeof v !== 'string') return v;
    let s = v.trim();
    // Strip wrapping quotes if present
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1);
    }
    if (s === 'undefined' || s === 'null') return fallback;
    return s;
  };

  // Prefer Vite-style variables if available
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && viteKey in import.meta.env) {
      const v = import.meta.env[viteKey];
      if (v !== undefined) return clean(v);
    }
  } catch (_) {}

  // Fallback to CRA-style process.env
  try {
    if (typeof process !== 'undefined' && process.env && process.env[reactKey] !== undefined) {
      return clean(process.env[reactKey]);
    }
  } catch (_) {}

  return fallback;
}
