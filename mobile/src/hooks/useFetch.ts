import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
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
 * @returns Estado de la petición (data, loading, error, refetch)
 * 
 * @example
 * const { data, loading, error, refetch } = useFetch(
 *   () => productosAPI.getAll(),
 *   { onSuccess: (data) => console.log(data) }
 * );
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar ref para mantener la función actualizada sin causar re-renders
  const fetchFnRef = useRef(fetchFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // Actualizar refs en cada render
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  const executeFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFnRef.current();
      setData(result);
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
    let isMounted = true;
    
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchFnRef.current();
        
        if (isMounted) {
          setData(result);
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
  }, [executeFetch]);

  return {
    data,
    loading,
    error,
    refetch: executeFetch,
  };
}

export default useFetch;
