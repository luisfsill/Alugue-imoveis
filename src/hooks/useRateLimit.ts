import { useState, useEffect, useCallback } from 'react';
import { rateLimiter, RateLimitConfig } from '../utils/rateLimiter';

export interface UseRateLimitReturn {
  isBlocked: boolean;
  remainingAttempts: number;
  timeRemaining: string;
  checkAllowed: () => boolean;
  recordAttempt: () => void;
  reset: () => void;
}

export function useRateLimit(action: string, config: RateLimitConfig): UseRateLimitReturn {
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(config.maxAttempts);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('');

  const formatTimeRemaining = useCallback((timestamp: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, timestamp - now);
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (remaining <= 0) return '';
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, []);

  const updateStatus = useCallback(() => {
    // 🔧 DESENVOLVIMENTO: Sempre permitir acesso
    if (process.env.NODE_ENV === 'development') {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts
      };
    }

    const status = rateLimiter.check(action, config);
    
    if (!status.allowed && status.blockedUntil) {
      setIsBlocked(true);
      setBlockedUntil(status.blockedUntil);
      setRemainingAttempts(0);
    } else {
      setIsBlocked(false);
      setBlockedUntil(0);
      setRemainingAttempts(status.remainingAttempts);
    }
    
    return status;
  }, [action, config]);

  const checkAllowed = useCallback((): boolean => {
    // 🔧 DESENVOLVIMENTO: Sempre permitir
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    const status = updateStatus();
    return status.allowed;
  }, [updateStatus]);

  const recordAttempt = useCallback(() => {
    // 🔧 DESENVOLVIMENTO: Não registrar tentativas
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 DESENVOLVIMENTO: Tentativa não registrada para '${action}'`);
      return;
    }

    rateLimiter.record(action, config);
    updateStatus();
  }, [action, config, updateStatus]);

  const reset = useCallback(() => {
    // 🔧 DESENVOLVIMENTO: Reset sempre disponível
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 DESENVOLVIMENTO: Reset solicitado para '${action}'`);
      return;
    }

    rateLimiter.reset(action);
    setIsBlocked(false);
    setBlockedUntil(0);
    setRemainingAttempts(config.maxAttempts);
    setTimeRemaining('');
  }, [action, config.maxAttempts]);

  // Atualiza status inicial
  useEffect(() => {
    // 🔧 DESENVOLVIMENTO: Manter valores padrão
    if (process.env.NODE_ENV === 'development') {
      setIsBlocked(false);
      setBlockedUntil(0);
      setRemainingAttempts(config.maxAttempts);
      setTimeRemaining('');
      return;
    }

    updateStatus();
  }, [updateStatus, config.maxAttempts]);

  // Timer para atualizar tempo restante em tempo real
  useEffect(() => {
    if (!isBlocked || blockedUntil <= 0) {
      setTimeRemaining('');
      return;
    }

    // Atualizar imediatamente
    setTimeRemaining(formatTimeRemaining(blockedUntil));

    const interval = setInterval(() => {
      const now = Date.now();
      
      if (now >= blockedUntil) {
        // Tempo esgotado - desbloquear
        setIsBlocked(false);
        setBlockedUntil(0);
        setRemainingAttempts(config.maxAttempts);
        setTimeRemaining('');
        clearInterval(interval);
      } else {
        // Atualizar tempo restante em tempo real
        setTimeRemaining(formatTimeRemaining(blockedUntil));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlocked, blockedUntil, config.maxAttempts, formatTimeRemaining]);

  return {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    checkAllowed,
    recordAttempt,
    reset
  };
} 