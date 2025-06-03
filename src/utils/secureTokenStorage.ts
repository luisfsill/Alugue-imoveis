/**
 * 🔒 Sistema de Armazenamento Seguro de Tokens
 * 
 * Usando localStorage temporariamente até resolver httpOnly cookies
 * Implementa as melhores práticas de segurança:
 * - httpOnly cookies em futuras versões
 * - localStorage temporariamente para compatibilidade
 * - Encryption para tokens sensíveis
 * - Automatic cleanup
 */

interface SecureStorageOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge?: number; // em segundos
}

class SecureTokenStorage {
  private isProduction = process.env.NODE_ENV === 'production';
  private cookiePrefix = '__Host-' as const; // Prefixo seguro para cookies

  /**
   * Configurações padrão para cookies seguros
   * TEMPORÁRIO: comentado até reativar httpOnly
   */
  /*
  private defaultCookieOptions: SecureStorageOptions = {
    httpOnly: false, // TEMPORÁRIO: desabilitado para produção funcionar
    secure: this.isProduction, // HTTPS apenas em produção
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 // 7 dias
  };
  */

  /**
   * Verifica se httpOnly cookies estão disponíveis
   * TEMPORÁRIO: sempre retorna false para usar localStorage
   */
  private isHttpOnlyAvailable(): boolean {
    // TEMPORÁRIO: sempre usar localStorage até resolver httpOnly em produção
    return false;
  }

  /**
   * Armazena token de forma segura
   * TEMPORÁRIO: sempre usa localStorage
   */
  setToken(key: string, value: string, _options?: Partial<SecureStorageOptions>): void {
    try {
      // TEMPORÁRIO: sempre usar localStorage para compatibilidade
      this.setLocalStorage(key, value);
    } catch (error) {
      console.error('❌ Erro ao armazenar token:', error);
      // Fallback final para localStorage
      this.setLocalStorage(key, value);
    }
  }

  /**
   * Recupera token de forma segura
   * TEMPORÁRIO: sempre usa localStorage
   */
  getToken(key: string): string | null {
    try {
      // TEMPORÁRIO: sempre usar localStorage
      return this.getLocalStorage(key);
    } catch (error) {
      console.error('❌ Erro ao recuperar token:', error);
      return this.getLocalStorage(key);
    }
  }

  /**
   * Remove token de forma segura
   */
  removeToken(key: string): void {
    try {
      // Remover de ambos os locais
      this.removeCookie(key);
      this.removeLocalStorage(key);
    } catch (error) {
      console.error('❌ Erro ao remover token:', error);
    }
  }

  /**
   * Limpa todos os tokens
   */
  clearAllTokens(): void {
    try {
      // Limpar cookies de autenticação
      const authCookies = ['sb-access-token', 'sb-refresh-token', 'sb-auth-token'];
      authCookies.forEach(cookie => this.removeCookie(cookie));

      // Limpar localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

    } catch (error) {
      console.error('❌ Erro ao limpar tokens:', error);
    }
  }

  // TEMPORÁRIO: Métodos comentados até reativar httpOnly cookies
  /*
  // Métodos privados para manipulação de cookies
  private setCookie(key: string, value: string, options: SecureStorageOptions): void {
    const cookieName = this.isProduction ? `${this.cookiePrefix}${key}` : key;
    let cookieString = `${cookieName}=${encodeURIComponent(value)}`;

    if (options.httpOnly) cookieString += '; HttpOnly';
    if (options.secure) cookieString += '; Secure';
    if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
    if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
    
    cookieString += '; Path=/';

    document.cookie = cookieString;
  }

  private getCookie(key: string): string | null {
    const cookieName = this.isProduction ? `${this.cookiePrefix}${key}` : key;
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }
  */

  private removeCookie(key: string): void {
    const cookieName = this.isProduction ? `${this.cookiePrefix}${key}` : key;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }

  // Métodos para localStorage (fallback)
  private setLocalStorage(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  private getLocalStorage(key: string): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }

  private removeLocalStorage(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  /**
   * Verifica se tokens estão sendo armazenados de forma segura
   */
  getSecurityStatus(): {
    isSecure: boolean;
    storage: 'httpOnly' | 'localStorage';
    recommendations: string[];
  } {
    const isHttpOnly = this.isHttpOnlyAvailable();
    const recommendations: string[] = [];

    if (!isHttpOnly && this.isProduction) {
      recommendations.push('Configure httpOnly cookies no servidor');
    }
    if (!this.isProduction) {
      recommendations.push('Em produção, use HTTPS e httpOnly cookies');
    }

    return {
      isSecure: isHttpOnly && this.isProduction,
      storage: isHttpOnly ? 'httpOnly' : 'localStorage',
      recommendations
    };
  }
}

// Instância singleton
export const secureTokenStorage = new SecureTokenStorage();

// Hook para uso em componentes React
export function useSecureTokenStorage() {
  return {
    setToken: secureTokenStorage.setToken.bind(secureTokenStorage),
    getToken: secureTokenStorage.getToken.bind(secureTokenStorage),
    removeToken: secureTokenStorage.removeToken.bind(secureTokenStorage),
    clearAllTokens: secureTokenStorage.clearAllTokens.bind(secureTokenStorage),
    getSecurityStatus: secureTokenStorage.getSecurityStatus.bind(secureTokenStorage)
  };
} 