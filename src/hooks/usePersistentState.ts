import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PersistedStateDocument<T> {
  data?: T;
}

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const documentId = useMemo(() => key.replace(/[^a-zA-Z0-9_-]/g, '_'), [key]);
  const skipNextSave = useRef(true);

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
        const snap = await getDoc(doc(db, 'adminData', documentId));
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
      } catch (error) {
        console.error(`Erro ao carregar dados persistidos de ${key}.`, error);
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [documentId, key]);

  useEffect(() => {
    if (!loaded) return;

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local cache is best effort.
    }

    setDoc(doc(db, 'adminData', documentId), {
      data: value,
      sourceKey: key,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((error) => {
      console.error(`Erro ao salvar dados persistidos de ${key}.`, error);
    });
  }, [documentId, key, loaded, value]);

  return [value, setValue];
}
