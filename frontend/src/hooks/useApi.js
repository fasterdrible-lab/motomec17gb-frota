import { useState, useEffect, useCallback } from 'react';

/**
 * useApi — generic data-fetching hook
 *
 * @param {Function} fetchFn  - async function that returns data
 * @param  {...any}  args     - arguments forwarded to fetchFn
 * @returns {{ data, loading, error, refetch }}
 */
export default function useApi(fetchFn, ...args) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(...args);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, ...args]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
