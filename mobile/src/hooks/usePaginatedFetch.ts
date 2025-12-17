import { useState, useCallback, useRef, useEffect } from 'react';
import { PaginatedResponse } from '@/types';

interface UsePaginatedFetchOptions<T> {
  /** Número de items por página (default: 20) */
  pageSize?: number;
  /** Callback cuando se cargan datos exitosamente */
  onSuccess?: (data: T[]) => void;
  /** Callback cuando hay un error */
  onError?: (error: any) => void;
  /** Si debe cargar automáticamente al montar */
  autoFetch?: boolean;
}

interface UsePaginatedFetchResult<T> {
  /** Lista acumulada de todos los items cargados */
  data: T[];
  /** Indica si está cargando la primera página */
  loading: boolean;
  /** Indica si está cargando más páginas */
  loadingMore: boolean;
  /** Indica si está refrescando (pull to refresh) */
  refreshing: boolean;
  /** Mensaje de error si lo hay */
  error: string | null;
  /** Indica si hay más páginas disponibles */
  hasMore: boolean;
  /** Número total de items en el servidor */
  totalCount: number;
  /** Página actual */
  currentPage: number;
  /** Cargar más items (siguiente página) */
  loadMore: () => Promise<void>;
  /** Refrescar desde la primera página */
  refresh: () => Promise<void>;
  /** Resetear y recargar con nuevos parámetros */
  reset: () => void;
}

/**
 * Hook para paginación infinita con scroll
 * 
 * @param fetchFn - Función que recibe página y retorna PaginatedResponse
 * @param options - Opciones de configuración
 * 
 * @example
 * const { data, loading, loadMore, hasMore, refresh } = usePaginatedFetch(
 *   (page) => productosAPI.getAll({ page, categoria: selectedCategoria }),
 *   { pageSize: 20 }
 * );
 * 
 * <FlatList
 *   data={data}
 *   onEndReached={loadMore}
 *   onEndReachedThreshold={0.5}
 *   refreshing={refreshing}
 *   onRefresh={refresh}
 *   ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
 * />
 */
export function usePaginatedFetch<T>(
  fetchFn: (page: number) => Promise<PaginatedResponse<T>>,
  options: UsePaginatedFetchOptions<T> = {}
): UsePaginatedFetchResult<T> {
  const { 
    pageSize = 20, 
    onSuccess, 
    onError,
    autoFetch = true 
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs para evitar race conditions y dependencias circulares
  const isFetchingRef = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const dataRef = useRef<T[]>(data);

  // Actualizar refs cuando cambien
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  /**
   * Cargar datos de una página específica
   */
  const fetchPage = useCallback(async (
    page: number, 
    isRefresh: boolean = false,
    isLoadMore: boolean = false
  ) => {
    // Evitar múltiples peticiones simultáneas
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;

    try {
      // Establecer estados de loading según el tipo de carga
      if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      const response = await fetchFnRef.current(page);
      const newItems = response.results || [];
      
      // Actualizar datos
      if (isRefresh || page === 1) {
        setData(newItems);
      } else {
        setData(prev => [...prev, ...newItems]);
      }

      // Actualizar metadata de paginación
      setTotalCount(response.count || 0);
      setHasMore(response.next !== null);
      setCurrentPage(page);

      // Callback de éxito (usar dataRef para evitar dependencia circular)
      if (isRefresh || page === 1) {
        onSuccess?.(newItems);
      } else {
        onSuccess?.(dataRef.current.concat(newItems));
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          err.message || 
                          'Error al cargar datos';
      setError(errorMessage);
      onError?.(err);
      
      // En caso de error, no hay más páginas
      if (page > 1) {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [onSuccess, onError]); // Eliminado 'data' de las dependencias

  /**
   * Cargar siguiente página
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isFetchingRef.current || loadingMore || loading) {
      return;
    }
    await fetchPage(currentPage + 1, false, true);
  }, [hasMore, currentPage, loadingMore, loading, fetchPage]);

  /**
   * Refrescar desde la primera página (pull to refresh)
   */
  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    setHasMore(true);
    await fetchPage(1, true, false);
  }, [fetchPage]);

  /**
   * Resetear estado y recargar
   */
  const reset = useCallback(() => {
    setData([]);
    setCurrentPage(1);
    setHasMore(true);
    setTotalCount(0);
    setError(null);
    isFetchingRef.current = false;
    fetchPage(1, false, false);
  }, [fetchPage]);

  // Carga inicial
  useEffect(() => {
    if (autoFetch) {
      fetchPage(1);
    }
  }, []); // Solo al montar

  return {
    data,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    totalCount,
    currentPage,
    loadMore,
    refresh,
    reset,
  };
}

export default usePaginatedFetch;

