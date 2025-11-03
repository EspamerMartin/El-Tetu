/**
 * Formatea un número como precio en formato de moneda
 * @param price - El precio a formatear
 * @param currency - El símbolo de moneda (por defecto '$')
 * @returns El precio formateado como string
 */
export const formatPrice = (price: number | string, currency: string = '$'): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return `${currency}0.00`;
  }
  return `${currency}${numPrice.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Formatea una fecha en formato legible
 * @param date - La fecha a formatear (string o Date)
 * @param format - El formato deseado ('short', 'long', 'dateTime')
 * @returns La fecha formateada como string
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'dateTime' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (format === 'long') {
    options.month = 'long';
    options.day = 'numeric';
  } else if (format === 'dateTime') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return dateObj.toLocaleDateString('es-ES', options);
};

/**
 * Formatea una fecha y hora completa
 * @param date - La fecha a formatear (string o Date)
 * @returns La fecha y hora formateada como string
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }

  return dateObj.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
