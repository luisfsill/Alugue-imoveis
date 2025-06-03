/**
 * 🤖 Hook para Detecção de Bots
 * 
 * Facilita o uso do sistema de detecção de bots em componentes React
 * Fornece estado reativo e métodos convenientes
 */

import { useState, useEffect, useCallback } from 'react';
import { botDetection, BotDetectionUtils, type BotDetectionResult } from '../utils/botDetection';

export interface UseBotDetectionOptions {
  autoCheck?: boolean; // Executar verificação automática
  checkInterval?: number; // Intervalo para verificações periódicas (ms)
  confidenceThreshold?: number; // Limite de confiança para considerar bot
  onBotDetected?: (result: BotDetectionResult) => void; // Callback quando bot detectado
  onBehaviorChange?: (isHuman: boolean) => void; // Callback para mudanças de comportamento
}

export interface UseBotDetectionReturn {
  // Estado atual
  botResult: BotDetectionResult | null;
  isBot: boolean;
  confidence: number;
  fingerprint: string | null;
  isHumanBehavior: boolean;
  isLoading: boolean;
  
  // Métodos
  checkBot: () => Promise<BotDetectionResult>;
  quickCheck: () => Promise<boolean>;
  waitForHuman: (timeoutMs?: number) => Promise<boolean>;
  resetBehavior: () => void;
  getDeviceFingerprint: () => string;
  
  // Estado de comportamento
  behaviorData: {
    mouseMovements: number;
    keyboardInteractions: number;
    timeOnPage: number;
    hasInteracted: boolean;
  };
}

export function useBotDetection(options: UseBotDetectionOptions = {}): UseBotDetectionReturn {
  const {
    autoCheck = false,
    checkInterval = 30000, // 30 segundos
    confidenceThreshold = 70,
    onBotDetected,
    onBehaviorChange
  } = options;

  // Estados
  const [botResult, setBotResult] = useState<BotDetectionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [behaviorData, setBehaviorData] = useState({
    mouseMovements: 0,
    keyboardInteractions: 0,
    timeOnPage: 0,
    hasInteracted: false
  });

  // Valores derivados
  const isBot = botResult?.isBot ?? false;
  const confidence = botResult?.confidence ?? 0;
  const fingerprint = botResult?.fingerprint ?? null;
  const isHumanBehavior = BotDetectionUtils.isHumanBehavior();

  // Método principal de verificação
  const checkBot = useCallback(async (): Promise<BotDetectionResult> => {
    setIsLoading(true);
    try {
      const result = await botDetection.detectBot();
      setBotResult(result);
      
      // Callback se bot detectado
      if (result.isBot && result.confidence >= confidenceThreshold && onBotDetected) {
        onBotDetected(result);
      }
      
      return result;
    } catch (error) {
      console.error('Erro na detecção de bot:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [confidenceThreshold, onBotDetected]);

  // Verificação rápida
  const quickCheck = useCallback(async (): Promise<boolean> => {
    try {
      return await BotDetectionUtils.quickBotCheck();
    } catch (error) {
      console.error('Erro na verificação rápida de bot:', error);
      return false;
    }
  }, []);

  // Aguardar interação humana
  const waitForHuman = useCallback(async (timeoutMs: number = 30000): Promise<boolean> => {
    try {
      return await BotDetectionUtils.waitForHumanInteraction(timeoutMs);
    } catch (error) {
      console.error('Erro ao aguardar interação humana:', error);
      return false;
    }
  }, []);

  // Reset de dados comportamentais
  const resetBehavior = useCallback(() => {
    botDetection.resetBehaviorData();
    setBehaviorData({
      mouseMovements: 0,
      keyboardInteractions: 0,
      timeOnPage: 0,
      hasInteracted: false
    });
  }, []);

  // Obter fingerprint do dispositivo
  const getDeviceFingerprint = useCallback((): string => {
    return BotDetectionUtils.getDeviceFingerprint();
  }, []);

  // Atualizar dados de comportamento periodicamente
  useEffect(() => {
    const updateBehaviorData = () => {
      const currentBehavior = botDetection.getBehaviorData();
      const newBehaviorData = {
        mouseMovements: currentBehavior.mouseMovements,
        keyboardInteractions: currentBehavior.keyboardInteractions,
        timeOnPage: currentBehavior.timeOnPage,
        hasInteracted: currentBehavior.mouseMovements > 0 || currentBehavior.keyboardInteractions > 0
      };
      
      setBehaviorData(prev => {
        // Verificar se houve mudança significativa no comportamento
        const wasHuman = prev.hasInteracted;
        const isNowHuman = newBehaviorData.hasInteracted;
        
        if (wasHuman !== isNowHuman && onBehaviorChange) {
          onBehaviorChange(isNowHuman);
        }
        
        return newBehaviorData;
      });
    };

    // Atualizar imediatamente
    updateBehaviorData();

    // Configurar intervalo para atualizações
    const interval = setInterval(updateBehaviorData, 1000);
    
    return () => clearInterval(interval);
  }, [onBehaviorChange]);

  // Verificação automática
  useEffect(() => {
    if (!autoCheck) return;

    // Verificação inicial (aguardar um pouco para coletar dados)
    const initialTimer = setTimeout(() => {
      checkBot();
    }, 3000);

    // Verificações periódicas
    const interval = setInterval(() => {
      checkBot();
    }, checkInterval);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [autoCheck, checkInterval, checkBot]);

  return {
    // Estado
    botResult,
    isBot,
    confidence,
    fingerprint,
    isHumanBehavior,
    isLoading,
    
    // Métodos
    checkBot,
    quickCheck,
    waitForHuman,
    resetBehavior,
    getDeviceFingerprint,
    
    // Dados de comportamento
    behaviorData
  };
}

// Hook especializado para formulários
export function useBotDetectionForForm(formName: string) {
  const {
    botResult,
    isBot,
    confidence,
    checkBot,
    waitForHuman,
    behaviorData
  } = useBotDetection({
    autoCheck: true,
    confidenceThreshold: 80,
    onBotDetected: (result) => {
      console.warn(`🤖 Bot detectado no formulário '${formName}':`, result);
    }
  });

  // Validar se é seguro submeter o formulário
  const validateFormSubmission = useCallback(async (): Promise<{
    allowed: boolean;
    reason?: string;
    confidence?: number;
  }> => {
    const result = await checkBot();
    
    if (result.isBot && result.confidence > 80) {
      return {
        allowed: false,
        reason: 'Comportamento automatizado detectado',
        confidence: result.confidence
      };
    }
    
    if (!behaviorData.hasInteracted && behaviorData.timeOnPage < 5000) {
      return {
        allowed: false,
        reason: 'Interação muito rápida - aguarde alguns segundos'
      };
    }
    
    return { allowed: true };
  }, [checkBot, behaviorData]);

  return {
    botResult,
    isBot,
    confidence,
    validateFormSubmission,
    waitForHuman,
    behaviorData
  };
}

// Hook para proteção de rotas administrativas
export function useBotDetectionForAdmin() {
  return useBotDetection({
    autoCheck: true,
    checkInterval: 60000, // 1 minuto
    confidenceThreshold: 60, // Mais rigoroso para admin
    onBotDetected: (result) => {
      console.warn('🚨 Possível bot detectado em área administrativa:', result);
      
      // Em produção, poderia disparar alertas ou logs de segurança
      if (process.env.NODE_ENV === 'production') {
        // Enviar alerta de segurança
        console.log('Alerta de segurança: Bot detectado em área administrativa');
      }
    }
  });
} 