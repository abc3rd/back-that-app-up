import { createContext, useCallback, useContext, useRef } from 'react';

const TabStackContext = createContext(null);

export const TAB_PATHS = ['/', '/moments', '/settings'];

export function TabStackProvider({ children }) {
  const positions = useRef({});
  const refs = useRef({});

  const register = useCallback((path, el) => {
    if (el) refs.current[path] = el;
  }, []);

  const save = useCallback((path) => {
    const el = refs.current[path];
    if (el) positions.current[path] = el.scrollTop;
  }, []);

  const restore = useCallback((path) => {
    const el = refs.current[path];
    if (el) el.scrollTop = positions.current[path] ?? 0;
  }, []);

  const reset = useCallback((path) => {
    const el = refs.current[path];
    if (el) {
      positions.current[path] = 0;
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <TabStackContext.Provider value={{ register, save, restore, reset }}>
      {children}
    </TabStackContext.Provider>
  );
}

export function useTabStack() {
  return useContext(TabStackContext);
}