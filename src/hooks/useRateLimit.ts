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
    const status = updateStatus();
    return status.allowed;
  }, [updateStatus]);

  const recordAttempt = useCallback(() => {
    console.log(`📝 useRateLimit: Registrando tentativa para '${action}'`);
    rateLimiter.record(action, config);
    
    // Atualizar status diretamente sem chamar updateStatus novamente
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
    
    console.log(`📊 useRateLimit: Status após tentativa para '${action}':`, {
      allowed: status.allowed,
      remainingAttempts: status.remainingAttempts,
      blockedUntil: status.blockedUntil
    });
  }, [action, config]);

  const reset = useCallback(() => {
    rateLimiter.reset(action);
    setIsBlocked(false);
    setBlockedUntil(0);
    setRemainingAttempts(config.maxAttempts);
    setTimeRemaining('');
  }, [action, config.maxAttempts]);

  // Atualiza status inicial
  useEffect(() => {
    updateStatus();
  }, [updateStatus]);

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