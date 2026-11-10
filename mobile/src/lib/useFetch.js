import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    if (!path) return;
    setLoading(true);
    return api(path).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load, setData };
}
