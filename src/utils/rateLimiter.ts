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

// Chave secreta para criptografia (em produção, deve vir do servidor)
const ENCRYPTION_KEY = 'alugue_imoveis_rate_limit_2024_secure_key_v2';

class RateLimiter {
  private encryptData(data: string): string {
    try {
      // Criptografia simples com XOR + Base64 + Hash de verificação
      const timestamp = Date.now().toString();
      const hash = sha256(data + ENCRYPTION_KEY + timestamp);
      const xorKey = sha256(ENCRYPTION_KEY + timestamp).substring(0, data.length);
      
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length));
      }
      
      const payload = {
        d: btoa(encrypted), // dados criptografados
        t: timestamp,       // timestamp
        h: hash.substring(0, 16) // hash de verificação
      };
      
      return btoa(JSON.stringify(payload));
    } catch (error) {
      console.error('Erro na criptografia:', error);
      return btoa(data); // fallback
    }
  }

  private decryptData(encryptedData: string): string | null {
    try {
      const payload = JSON.parse(atob(encryptedData));
      const { d: encrypted, t: timestamp, h: hash } = payload;
      
      const decryptedBytes = atob(encrypted);
      const xorKey = sha256(ENCRYPTION_KEY + timestamp).substring(0, decryptedBytes.length);
      
      let decrypted = '';
      for (let i = 0; i < decryptedBytes.length; i++) {
        decrypted += String.fromCharCode(decryptedBytes.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length));
      }
      
      // Verificar integridade
      const expectedHash = sha256(decrypted + ENCRYPTION_KEY + timestamp).substring(0, 16);
      if (hash !== expectedHash) {
        console.warn('🚨 Dados corrompidos ou manipulados detectados!');
        return null;
      }
      
      return decrypted;
    } catch (error) {
      console.warn('🚨 Falha na descriptografia - possível manipulação:', error);
      return null;
    }
  }

  private getClientId(): string {
    try {
      // Usar o fingerprinting avançado do sistema de detecção de bots
      const baseFingerprint = BotDetectionUtils.getDeviceFingerprint();
      
      // Adicionar dados extras para tornar mais difícil de falsificar
      const extraData = [
        navigator.hardwareConcurrency || 0,
        navigator.maxTouchPoints || 0,
        screen.colorDepth || 0,
        new Date().getTimezoneOffset(),
        navigator.cookieEnabled ? 1 : 0,
        navigator.doNotTrack || 'unknown'
      ].join('|');
      
      return sha256(baseFingerprint + extraData).substring(0, 20);
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
    return `rl_${sha256(action + clientId).substring(0, 12)}`;
  }

  private getBackupStorageKey(action: string): string {
    const clientId = this.getClientId();
    return `rlb_${sha256(action + clientId + 'backup').substring(0, 12)}`;
  }

  private storeSecurely(key: string, data: any): void {
    try {
      const jsonData = JSON.stringify(data);
      const encrypted = this.encryptData(jsonData);
      
      // Armazenar em localStorage principal
      localStorage.setItem(key, encrypted);
      
      // Backup em sessionStorage
      const backupKey = key + '_bkp';
      sessionStorage.setItem(backupKey, encrypted);
      
      // Backup adicional com chave diferente
      const altKey = this.getBackupStorageKey(key);
      localStorage.setItem(altKey, encrypted);
      
    } catch (error) {
      console.error('Erro ao armazenar dados:', error);
    }
  }

  private retrieveSecurely(key: string): any | null {
    try {
      // Tentar localStorage principal
      let encrypted = localStorage.getItem(key);
      let data = null;
      
      if (encrypted) {
        const decrypted = this.decryptData(encrypted);
        if (decrypted) {
          data = JSON.parse(decrypted);
        }
      }
      
      // Se falhou, tentar backup
      if (!data) {
        const backupKey = key + '_bkp';
        encrypted = sessionStorage.getItem(backupKey);
        if (encrypted) {
          const decrypted = this.decryptData(encrypted);
          if (decrypted) {
            data = JSON.parse(decrypted);
            // Restaurar no localStorage principal
            localStorage.setItem(key, encrypted);
          }
        }
      }
      
      // Se ainda falhou, tentar backup alternativo
      if (!data) {
        const altKey = this.getBackupStorageKey(key);
        encrypted = localStorage.getItem(altKey);
        if (encrypted) {
          const decrypted = this.decryptData(encrypted);
          if (decrypted) {
            data = JSON.parse(decrypted);
            // Restaurar no localStorage principal
            localStorage.setItem(key, encrypted);
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao recuperar dados:', error);
      return null;
    }
  }

  private detectManipulation(data: any): boolean {
    if (!data) return false;
    
    // Verificar se timestamps fazem sentido
    if (data.blockedUntil && data.blockedUntil < data.blockTimestamp) {
      console.warn('🚨 Manipulação detectada: blockedUntil < blockTimestamp');
      return true;
    }
    
    if (data.resetTime && data.resetTime < data.firstAttempt) {
      console.warn('🚨 Manipulação detectada: resetTime < firstAttempt');
      return true;
    }
    
    // Verificar se tentativas são consistentes
    if (data.attempts < 0 || data.attempts > 1000) {
      console.warn('🚨 Manipulação detectada: attempts inválido');
      return true;
    }
    
    // Verificar se fingerprint mudou
    if (data.fingerprint && data.fingerprint !== this.getClientId()) {
      console.warn('🚨 Possível troca de dispositivo ou manipulação de fingerprint');
      // Não bloquear automaticamente, mas logar
    }
    
    return false;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    // Limpar localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('rl_') || key.startsWith('rlb_'))) {
        try {
          const data = this.retrieveSecurely(key);
          
          // Remove entradas expiradas (tanto bloqueios quanto janelas de tempo)
          if ((data?.blockedUntil && data.blockedUntil < now) || 
              (data?.resetTime && data.resetTime < now && !data.blockedUntil)) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Remove entradas corrompidas
          keysToRemove.push(key);
        }
      }
    }
    
    // Limpar sessionStorage backup
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('_bkp')) {
        try {
          const mainKey = key.replace('_bkp', '');
          if (!localStorage.getItem(mainKey)) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(key + '_bkp');
    });
  }

  public check(action: string, config: RateLimitConfig): RateLimitResult {
    // Verificar bloqueio global de segurança primeiro
    if (this.checkGlobalBlock()) {
      console.warn('🚨 Acesso bloqueado por violações de segurança');
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: Date.now() + (60 * 60 * 1000) // 1 hora
      };
    }
    
    this.cleanupExpiredEntries();
    
    const storageKey = this.getStorageKey(action);
    const now = Date.now();
    
    try {
      let data = this.retrieveSecurely(storageKey);
      
      // Detectar manipulação
      if (data && this.detectManipulation(data)) {
        console.error('🚨 TENTATIVA DE BYPASS DETECTADA! Aplicando penalidade.');
        // Aplicar penalidade: dobrar o tempo de bloqueio
        data.blockedUntil = now + (config.blockDurationMs * 2);
        data.attempts = config.maxAttempts + 10; // Marcar como suspeito
        data.manipulationDetected = true;
        data.penaltyApplied = now;
        this.storeSecurely(storageKey, data);
        
        return {
          allowed: false,
          remainingAttempts: 0,
          blockedUntil: data.blockedUntil
        };
      }
      
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
          fingerprint: this.getClientId(),
          createdAt: now,
          lastValidation: now
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
      data.lastValidation = now;
      this.storeSecurely(storageKey, data);
      
      // Log de segurança
      console.warn('🚫 Rate limit excedido:', {
        action,
        fingerprint: data.fingerprint?.substring(0, 8) + '...',
        attempts: data.attempts,
        blockedUntil: new Date(data.blockedUntil).toLocaleString(),
        suspicious: data.manipulationDetected || false
      });
      
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: data.blockedUntil
      };
      
    } catch (error) {
      console.error('Erro no rate limiter:', error);
      // Em caso de erro, aplicar bloqueio preventivo
      console.warn('🚨 Erro suspeito - aplicando bloqueio preventivo');
      return {
        allowed: false,
        remainingAttempts: 0,
        blockedUntil: now + config.blockDurationMs
      };
    }
  }

  public record(action: string, config: RateLimitConfig): void {
    const storageKey = this.getStorageKey(action);
    const now = Date.now();
    
    try {
      let data = this.retrieveSecurely(storageKey);
      
      // Detectar manipulação antes de registrar
      if (data && this.detectManipulation(data)) {
        console.error('🚨 MANIPULAÇÃO DETECTADA durante record!');
        data.manipulationDetected = true;
        data.attempts = config.maxAttempts + 5; // Forçar bloqueio
        data.blockedUntil = now + (config.blockDurationMs * 2);
        this.storeSecurely(storageKey, data);
        return;
      }
      
      // Se não há dados ou a janela expirou, inicia nova janela
      if (!data || now > data.resetTime) {
        data = {
          attempts: 1,
          resetTime: now + config.windowMs,
          firstAttempt: now,
          fingerprint: this.getClientId(),
          lastAttempt: now,
          createdAt: now,
          lastValidation: now
        };
      } else {
        data.attempts += 1;
        data.lastAttempt = now;
        data.lastValidation = now;
      }
      
      // Adicionar metadados para auditoria
      if (!data.attemptHistory) {
        data.attemptHistory = [];
      }
      
      data.attemptHistory.push({
        timestamp: now,
        userAgent: navigator.userAgent.substring(0, 100),
        url: window.location.pathname,
        fingerprint: this.getClientId().substring(0, 8)
      });
      
      // Manter apenas as últimas 10 tentativas
      if (data.attemptHistory.length > 10) {
        data.attemptHistory = data.attemptHistory.slice(-10);
      }
      
      // Detectar padrões suspeitos
      if (data.attemptHistory.length >= 3) {
        const recentAttempts = data.attemptHistory.slice(-3);
        const timeDiffs = [];
        for (let i = 1; i < recentAttempts.length; i++) {
          timeDiffs.push(recentAttempts[i].timestamp - recentAttempts[i-1].timestamp);
        }
        
        // Se tentativas muito rápidas (< 100ms), marcar como suspeito
        if (timeDiffs.every(diff => diff < 100)) {
          console.warn('🚨 Padrão de bot detectado - tentativas muito rápidas');
          data.botSuspicion = (data.botSuspicion || 0) + 1;
          
          if (data.botSuspicion >= 2) {
            data.blockedUntil = now + (config.blockDurationMs * 3);
            data.blockReason = 'bot_pattern_detected';
          }
        }
      }
      
      this.storeSecurely(storageKey, data);
      
      // Log de monitoramento
      if (data.attempts > config.maxAttempts * 0.8) {
        console.warn(`⚠️ Rate limit próximo do limite para '${action}':`, {
          attempts: data.attempts,
          maxAttempts: config.maxAttempts,
          fingerprint: data.fingerprint?.substring(0, 8) + '...',
          suspicious: data.manipulationDetected || data.botSuspicion > 0
        });
      }
      
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error);
    }
  }

  public reset(action: string): void {
    const storageKey = this.getStorageKey(action);
    
    try {
      const data = this.retrieveSecurely(storageKey);
      
      if (data) {
        // Log do reset para auditoria
        console.log('🔄 Rate limit resetado:', {
          action,
          fingerprint: data.fingerprint?.substring(0, 8) + '...',
          previousAttempts: data.attempts,
          wasBlocked: !!data.blockedUntil,
          hadManipulation: !!data.manipulationDetected
        });
        
        // Se havia manipulação detectada, não permitir reset fácil
        if (data.manipulationDetected) {
          console.warn('🚨 Tentativa de reset em conta com manipulação detectada - ignorando');
          return;
        }
      }
      
      // Remover de todos os storages
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey + '_bkp');
      
      const altKey = this.getBackupStorageKey(storageKey);
      localStorage.removeItem(altKey);
      
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

  // Sistema de monitoramento anti-manipulação
  private setupSecurityMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    // Monitorar tentativas de limpeza do localStorage
    const originalClear = localStorage.clear;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.clear = () => {
      console.warn('🚨 TENTATIVA DE LIMPEZA TOTAL DO LOCALSTORAGE DETECTADA!');
      this.handleSecurityViolation('localStorage_clear_attempt');
      // Permitir a limpeza mas registrar a violação
      originalClear.call(localStorage);
    };
    
    localStorage.removeItem = (key: string) => {
      if (key.startsWith('rl_') || key.startsWith('rlb_')) {
        console.warn('🚨 TENTATIVA DE REMOÇÃO DE RATE LIMIT DETECTADA:', key);
        this.handleSecurityViolation('rate_limit_removal_attempt', key);
        // Não permitir a remoção
        return;
      }
      originalRemoveItem.call(localStorage, key);
    };
    
    // Monitorar tentativas de modificação direta
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key: string, value: string) => {
      if (key.startsWith('rl_') || key.startsWith('rlb_')) {
        // Verificar se a modificação vem do nosso sistema
        const stack = new Error().stack;
        if (!stack?.includes('storeSecurely')) {
          console.warn('🚨 TENTATIVA DE MODIFICAÇÃO DIRETA DE RATE LIMIT:', key);
          this.handleSecurityViolation('direct_modification_attempt', key);
          return;
        }
      }
      originalSetItem.call(localStorage, key, value);
    };
  }
  
  private handleSecurityViolation(type: string, details?: string): void {
    const now = Date.now();
    const violationKey = 'security_violations';
    
    try {
      let violations = JSON.parse(localStorage.getItem(violationKey) || '[]');
      violations.push({
        type,
        details,
        timestamp: now,
        fingerprint: this.getClientId(),
        userAgent: navigator.userAgent.substring(0, 100),
        url: window.location.href
      });
      
      // Manter apenas as últimas 20 violações
      if (violations.length > 20) {
        violations = violations.slice(-20);
      }
      
      localStorage.setItem(violationKey, JSON.stringify(violations));
      
      // Se muitas violações recentes, aplicar bloqueio global
      const recentViolations = violations.filter((v: any) => now - v.timestamp < 5 * 60 * 1000);
      if (recentViolations.length >= 3) {
        console.error('🚨 MÚLTIPLAS VIOLAÇÕES DETECTADAS - APLICANDO BLOQUEIO GLOBAL');
        this.applyGlobalBlock();
      }
      
    } catch (error) {
      console.error('Erro ao registrar violação de segurança:', error);
    }
  }
  
  private applyGlobalBlock(): void {
    const now = Date.now();
    const globalBlockKey = 'global_security_block';
    const blockData = {
      blockedUntil: now + (60 * 60 * 1000), // 1 hora
      reason: 'security_violations',
      fingerprint: this.getClientId(),
      timestamp: now
    };
    
    this.storeSecurely(globalBlockKey, blockData);
  }
  
  private checkGlobalBlock(): boolean {
    const globalBlockKey = 'global_security_block';
    const blockData = this.retrieveSecurely(globalBlockKey);
    
    if (blockData && blockData.blockedUntil > Date.now()) {
      return true;
    }
    
    return false;
  }

  // Método público para inicializar o sistema
  public initialize(): void {
    this.setupSecurityMonitoring();
    console.log('🛡️ Sistema de segurança do Rate Limiter inicializado');
  }
}

// Instância singleton do rate limiter
export const rateLimiter = new RateLimiter();

// Inicializar sistema de segurança automaticamente
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que o DOM esteja carregado
  setTimeout(() => {
    rateLimiter.initialize();
  }, 100);
}

export default rateLimiter;

// Configurações predefinidas
export const RATE_LIMIT_CONFIGS = {
  LOGIN: {
    maxAttempts: 10,          // 10 tentativas (aumentado de 5)
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