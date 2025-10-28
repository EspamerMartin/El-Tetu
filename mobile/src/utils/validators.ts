/**
 * Valida si un email es válido
 * @param email - El email a validar
 * @returns true si el email es válido, false en caso contrario
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si un teléfono es válido (formato simple)
 * @param phone - El teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{8,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Valida si una contraseña es segura
 * @param password - La contraseña a validar
 * @returns true si la contraseña cumple los requisitos, false en caso contrario
 */
export const isValidPassword = (password: string): boolean => {
  // Mínimo 8 caracteres, al menos una letra y un número
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};
