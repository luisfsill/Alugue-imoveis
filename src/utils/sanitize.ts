import DOMPurify from 'dompurify';

/**
 * Sanitiza conteúdo HTML para prevenir ataques XSS
 * @param content - Conteúdo HTML a ser sanitizado
 * @returns Conteúdo sanitizado seguro para renderização
 */
export const sanitizeHTML = (content: string): string => {
  return DOMPurify.sanitize(content, {
    // Permite quebras de linha e formatação básica
    ALLOWED_TAGS: ['br', 'p', 'strong', 'em', 'u', 'b', 'i'],
    ALLOWED_ATTR: [],
    // Remove scripts e outros elementos perigosos
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'style']
  });
};

/**
 * Sanitiza texto puro (remove todas as tags HTML)
 * @param content - Conteúdo a ser sanitizado como texto puro
 * @returns Texto puro sem tags HTML
 */
export const sanitizeText = (content: string): string => {
  return DOMPurify.sanitize(content, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitiza texto para uso em URLs (query strings)
 * Remove HTML e caracteres perigosos, mantendo apenas texto seguro
 * @param content - Texto a ser usado na URL
 * @returns Texto seguro para URLs
 */
export const sanitizeForURL = (content: string): string => {
  // Primeiro remove qualquer HTML
  const textOnly = sanitizeText(content);
  // Então codifica para URL de forma segura
  return encodeURIComponent(textOnly);
}; 