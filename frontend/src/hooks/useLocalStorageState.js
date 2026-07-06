import { useEffect, useState } from "react";

export default function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      return stored ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage may be unavailable in private or restricted browser contexts.
    }
  }, [key, state]);

  return [state, setState];
}
