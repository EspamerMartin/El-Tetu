import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  enabled?: boolean; // Si false, no ejecuta hasta que sea true
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook genérico para realizar peticiones GET
 * 
 * @param fetchFn - Función que retorna una Promise con los datos
 * @param options - Opciones de configuración
 * @param options.enabled - Si false, no ejecuta la petición hasta que sea true (default: true)
 * @returns Estado de la petición (data, loading, error, refetch)
 * 
 * @example
 * // Fetch inmediato
 * const { data } = useFetch(() => productosAPI.getAll());
 * 
 * // Fetch condicional (lazy loading)
 * const { data } = useFetch(() => productosAPI.getAll(), { enabled: paso >= 2 });
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { initialData = null, onSuccess, onError, enabled = true } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Usar ref para mantener la función actualizada sin causar re-renders
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Actualizar refs de forma síncrona (antes de cualquier useEffect)
  fetchFnRef.current = fetchFn;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const executeFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFnRef.current();
      setData(result);
      setHasFetched(true);
      onSuccessRef.current?.(result);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar datos';
      setError(errorMessage);
      onErrorRef.current?.(err);
    } finally {
      setLoading(false);
    }
  }, []); // Sin dependencias - estable

  useEffect(() => {
    // Si no está habilitado o ya se ejecutó, no hacer nada
    if (!enabled || hasFetched) {
      if (!enabled) {
        setLoading(false);
      }
      return;
    }

    let isMounted = true;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFnRef.current();

        if (isMounted) {
          setData(result);
          setHasFetched(true);
          onSuccessRef.current?.(result);
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMessage = err.response?.data?.error || err.message || 'Error al cargar datos';
          setError(errorMessage);
          onErrorRef.current?.(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [enabled, hasFetched]);

  return {
    data,
    loading,
    error,
    refetch: executeFetch,
  };
}

export default useFetch;
