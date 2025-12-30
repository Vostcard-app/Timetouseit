/**
 * useModal Hook
 * Manages modal open/close state and related data
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close, data, setData } = useModal<ItemData>();
 * 
 * <button onClick={() => open(itemData)}>Open Modal</button>
 * <Modal isOpen={isOpen} onClose={close}>
 *   {data && <ItemDetails item={data} />}
 * </Modal>
 * ```
 */

import { useState, useCallback } from 'react';

interface UseModalReturn<T> {
  isOpen: boolean;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
  data: T | null;
  setData: (data: T | null) => void;
}

/**
 * Hook for managing modal state
 */
export function useModal<T = unknown>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Optionally clear data when closing
    // setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    data,
    setData,
  };
}

