import { useEffect } from 'react';
import { useTabStack } from '@/hooks/useTabStack';

// Registers a tab's scroll container with the shared TabStack so its scroll
// position is saved on unmount and restored on mount, and re-selecting the
// active tab can reset it to the top.
export function useTabScroll(path, ref) {
  const { register, save, restore } = useTabStack();

  useEffect(() => {
    const el = ref.current;
    register(path, el);
    restore(path);
    const onScroll = () => save(path);
    el?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el?.removeEventListener('scroll', onScroll);
      save(path);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
}