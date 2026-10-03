// src/hooks/useApi.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client.js';

/**
 * Generic data-fetching hook.
 * - Automatically aborts in-flight requests on re-render / unmount (Phase 2)
 * - skip=true means "don't auto-fetch on mount; call refetch() manually"
 */
export const useApi = (fn, deps = [], { skip = false } = {}) => {
  const [data,    setData]    = useState(null);
  // Initialize loading as false when skip=true to avoid a setState in the effect
  const [loading, setLoading] = useState(() => !skip);
  const [error,   setError]   = useState(null);

  const fnRef       = useRef(fn);
  const abortRef    = useRef(null);

  // Always keep the ref pointing at the latest version of fn.
  useEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(async () => {
    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller  = new AbortController();
    abortRef.current  = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(controller.signal);
      if (!controller.signal.aborted) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(getErrorMessage(err));
      }
      return null;
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // When skip=true, loading is already initialised to false (see useState above)
    if (skip) return;
    run();
    return () => {
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
};

export default useApi;