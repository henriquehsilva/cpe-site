import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PersistedStateDocument<T> {
  data?: T;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : initialValue;
    } catch {
      return initialValue;
    }
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const snap = await getDoc(doc(db, 'adminData', key));
        if (ignore) return;

        if (snap.exists()) {
          const persisted = snap.data() as PersistedStateDocument<T>;
          if (persisted.data !== undefined) {
            setValue(persisted.data);
            try {
              window.localStorage.setItem(key, JSON.stringify(persisted.data));
            } catch {
              // Local cache is best effort.
            }
          }
        }
      } catch {
        // Keep the local cache/static seed when Firestore is temporarily unavailable.
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local cache is best effort.
    }

    setDoc(doc(db, 'adminData', key), {
      data: value,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch(() => {
      // The UI keeps working; Firestore rules/configuration errors surface in the console.
    });
  }, [key, loaded, value]);

  return [value, setValue];
}
