import { createSignal, createEffect, Signal, onMount } from "solid-js";
import { Store } from "@tauri-apps/plugin-store";

let globalStore: Store | null = null;

async function getStore(): Promise<Store> {
  if (!globalStore) {
    globalStore = await Store.load('signals.dat');
    // Log the path for debugging
    console.log('Tauri store for signals loaded successfully');
  }
  return globalStore;
}

export function createStoredSignal<T>(
  key: string,
  initialValue: T,
): Signal<T> {
  const [value, setValue] = createSignal<T>(initialValue);
  
  onMount(async () => {
    const store = await getStore();
    try {
      // Try to get value from Tauri store
      const hasKey = await store.has(key);
      if (hasKey) {
        const storedValue = await store.get(key);
        if (storedValue !== undefined && storedValue !== null) {
          setValue(() => storedValue as T);
        }
      }
    } catch (error) {
      console.error(`Error loading ${key} from store:`, error);
      
      // Fallback to localStorage for migration
      try {
        const localStorageValue = localStorage.getItem(key);
        if (localStorageValue !== null) {
          // Try to parse as JSON, if it fails use as string
          try {
            const parsed = JSON.parse(localStorageValue);
            setValue(() => parsed as T);
            // Migrate to Tauri store
            await store.set(key, parsed);
          } catch {
            // Use as string if not valid JSON
            setValue(() => localStorageValue as T);
            await store.set(key, localStorageValue);
          }
          localStorage.removeItem(key);
        }
      } catch (localStorageError) {
        console.error(`Error reading ${key} from localStorage:`, localStorageError);
      }
    }
  });

  // This effect runs whenever the signal's value changes,
  // updating the value in Tauri store.
  createEffect(() => {
    const currentValue = value();
    (async () => {
      try {
        const store = await getStore();
        await store.set(key, currentValue);
      } catch (error) {
        console.error(`Error saving ${key} to store:`, error);
        // Fallback to localStorage if Tauri store fails
        try {
          if (typeof currentValue === 'string') {
            localStorage.setItem(key, currentValue);
          } else {
            localStorage.setItem(key, JSON.stringify(currentValue));
          }
        } catch (localStorageError) {
          console.error(`Error saving ${key} to localStorage:`, localStorageError);
        }
      }
    })();
  });

  // Return the original signal and setter
  // The createEffect will handle persistence automatically
  return [value, setValue];
} 