import { sha256 } from 'js-sha256';
import { BotDetectionUtils } from './botDetection';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // janela de tempo em milissegundos
  blockDurationMs: number; // duração do bloqueio em milissegundos
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: number;
  blockedUntil?: number;
}

class RateLimiter {
  private getClientId(): string {
    try {
      // Usar o fingerprinting avançado do sistema de detecção de bots
      return BotDetectionUtils.getDeviceFingerprint();
    } catch (error) {
      console.warn('Erro ao obter fingerprint avançado, usando fallback:', error);
      
      // Fallback para método simples
      const userAgent = navigator.userAgent;
      const screen = `${window.screen.width}x${window.screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      
      const fingerprint = `${userAgent}|${screen}|${timezone}|${language}`;
      return sha256(fingerprint).substring(0, 16);
    }
  }

  private getStorageKey(action: string): string {
    const clientId = this.getClientId();
    return `rate_limit_${action}_${clientId}`;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rate_limit_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Remove entradas expiradas (tanto bloqueios quanto janelas de tempo)
          if ((data.blockedUntil && data.blockedUntil < now) || 
              (data.resetTime && data.resetTime < now && !data.blockedUntil)) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Remove entradas corrompidas
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  public check(action: string, config: RateLimitConfig): RateLimitResult {
    this.cleanupExpiredEntries();
    
    const storageKey = this.getStorageKey(action);
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(storageKey);
      let data = stored ? JSON.parse(stored) : null;
      
      // Se está bloqueado, verifica se o bloqueio ainda é válido
      if (data?.blockedUntil && data.blockedUntil > now) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil: data.blockedUntil
        };
      }
      
      // Se o bloqueio expirou, reseta
      if (data?.blockedUntil && data.blockedUntil <= now) {
        data = null;
      }
      
      // Se não há dados ou a janela expirou, inicia nova janela
      if (!data || now > data.resetTime) {
        data = {
          attempts: 0,
          resetTime: now + config.windowMs,
          firstAttempt: now,
          fingerprint: this.getClientId() // Armazenar fingerprint para auditoria
        };
      }
      
      // Verifica se ainda está dentro do limite
      if (data.attempts < config.maxAttempts) {
        return {
          allowed: true,
          remainingAttempts: config.maxAttempts - data.attempts,
          resetTime: data.resetTime
        };
      }
      
      // Excedeu o limite, bloqueia
      data.blockedUntil = now + config.blockDurationMs;
      data.blockReason = 'rate_limit_exceeded';
      data.blockTimestamp = now;
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // Log de segurança
      console.warn('🚫 Rate limit excedido:', {
        action,
        fingerprint: data.fingerprint?.substring(0, 8) + '...',
        attempts: data.attempts,
        blockedUntil: new Date(data.blockedUntil).toLocaleString()
      });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: data.blockedUntil
      };
      
    } catch (error) {
      console.error('Erro no rate limiter:', error);
      // Em caso de erro, permite a ação (fail-open)
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts
      };
    }
  }

  public record(action: string, config: RateLimitConfig): void {
    const storageKey = this.getStorageKey(action);
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(storageKey);
      let data = stored ? JSON.parse(stored) : null;
      
      // Se não há dados ou a janela expirou, inicia nova janela
      if (!data || now > data.resetTime) {
        data = {
          attempts: 1,
          resetTime: now + config.windowMs,
          firstAttempt: now,
          fingerprint: this.getClientId(),
          lastAttempt: now
        };
      } else {
        data.attempts += 1;
        data.lastAttempt = now;
      }
      
      // Adicionar metadados para auditoria
      if (!data.attemptHistory) {
        data.attemptHistory = [];
      }
      
      data.attemptHistory.push({
        timestamp: now,
        userAgent: navigator.userAgent.substring(0, 100), // Limitar tamanho
        url: window.location.pathname
      });
      
      // Manter apenas as últimas 10 tentativas para não sobrecarregar o storage
      if (data.attemptHistory.length > 10) {
        data.attemptHistory = data.attemptHistory.slice(-10);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(data));
      
      // Log de monitoramento
      if (data.attempts > config.maxAttempts * 0.8) {
        console.warn(`⚠️ Rate limit próximo do limite para '${action}':`, {
          attempts: data.attempts,
          maxAttempts: config.maxAttempts,
          fingerprint: data.fingerprint?.substring(0, 8) + '...'
        });
      }
      
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
    }
  }

  public reset(action: string): void {
    const storageKey = this.getStorageKey(action);
    
    try {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : null;
      
      if (data) {
        // Log do reset para auditoria
        console.log('🔄 Rate limit resetado:', {
          action,
          fingerprint: data.fingerprint?.substring(0, 8) + '...',
          previousAttempts: data.attempts
        });
      }
      
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erro ao resetar rate limit:', error);
    }
  }

  public getStatus(action: string): {
    isActive: boolean;
    attempts: number;
    fingerprint?: string;
    lastAttempt?: number;
    isBlocked: boolean;
    blockedUntil?: number;
  } {
    const storageKey = this.getStorageKey(action);
    const now = Date.now();
    
    try {
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : null;
      
      if (!data) {
        return {
          isActive: false,
          attempts: 0,
          isBlocked: false
        };
      }
      
      const isBlocked = data.blockedUntil && data.blockedUntil > now;
      const isActive = data.resetTime && data.resetTime > now;
      
      return {
        isActive,
        attempts: data.attempts || 0,
        fingerprint: data.fingerprint,
        lastAttempt: data.lastAttempt,
        isBlocked,
        blockedUntil: data.blockedUntil
      };
      
    } catch (error) {
      console.error('Erro ao obter status:', error);
      return {
        isActive: false,
        attempts: 0,
        isBlocked: false
      };
    }
  }
}

// Instância singleton
export const rateLimiter = new RateLimiter();

// Configurações predefinidas
export const RATE_LIMIT_CONFIGS = {
  LOGIN: {
    maxAttempts: 5,           // 5 tentativas
    windowMs: 15 * 60 * 1000, // em 15 minutos
    blockDurationMs: 30 * 60 * 1000 // bloquear por 30 minutos
  },
  PASSWORD_RESET: {
    maxAttempts: 3,           // 3 tentativas
    windowMs: 60 * 60 * 1000, // em 1 hora
    blockDurationMs: 2 * 60 * 60 * 1000 // bloquear por 2 horas
  },
  USER_CREATION: {
    maxAttempts: 3,           // 3 criações
    windowMs: 60 * 60 * 1000, // em 1 hora
    blockDurationMs: 4 * 60 * 60 * 1000 // bloquear por 4 horas
  },
  API_CALLS: {
    maxAttempts: 100,         // 100 chamadas
    windowMs: 60 * 1000,      // em 1 minuto
    blockDurationMs: 5 * 60 * 1000 // bloquear por 5 minutos
  },
  ADMIN_ACTIONS: {
    maxAttempts: 20,          // 20 ações administrativas
    windowMs: 10 * 60 * 1000, // em 10 minutos
    blockDurationMs: 60 * 60 * 1000 // bloquear por 1 hora
  }
} as const; 