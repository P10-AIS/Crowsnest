import { useState, useEffect } from 'react';

export function useLocalStorageState<T>(key: string, defaultValue: T) {
    const [state, setState] = useState<T>(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) as T : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {
            console.warn('Failed to save state to localStorage');
        }
    }, [key, state]);

    return [state, setState] as const;
}
