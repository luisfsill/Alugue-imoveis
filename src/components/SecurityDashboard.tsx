/**
 * 🛡️ Dashboard de Segurança
 * 
 * Componente centralizado que mostra o status de todas as medidas de segurança:
 * - Detecção de Bots
 * - Rate Limiting
 * - CORS Protection
 * - Token Security
 * - Device Fingerprinting
 */

import { Shield, AlertTriangle, CheckCircle, Clock, Bot, Fingerprint, Eye, Activity } from 'lucide-react';
import { useBotDetection } from '../hooks/useBotDetection';
import { CORSStatus } from './CORSStatus';
import { RateLimitStatus } from '../guards';

interface SecurityDashboardProps {
  showDetails?: boolean;
  className?: string;
  layout?: 'grid' | 'horizontal' | 'vertical';
}

export function SecurityDashboard({ 
  showDetails = true, 
  className = '',
  layout = 'grid'
}: SecurityDashboardProps) {
  const {
    isBot,
    confidence,
    fingerprint,
    isHumanBehavior,
    behaviorData,
    isLoading
  } = useBotDetection({
    autoCheck: true,
    checkInterval: 30000
  });

  const securityStatus = {
    botDetection: {
      status: isBot ? 'danger' : 'safe',
      label: isBot ? 'Bot Detectado' : 'Usuário Legítimo',
      confidence: confidence,
      icon: isBot ? AlertTriangle : Shield
    },
    behavior: {
      status: isHumanBehavior ? 'safe' : 'warning',
      label: isHumanBehavior ? 'Comportamento Humano' : 'Aguardando Interação',
      interactions: behaviorData.mouseMovements + behaviorData.keyboardInteractions,
      icon: isHumanBehavior ? CheckCircle : Clock
    },
    fingerprint: {
      status: fingerprint ? 'safe' : 'warning',
      label: fingerprint ? 'Dispositivo Identificado' : 'Gerando Identificação',
      value: fingerprint?.substring(0, 8) + '...',
      icon: Fingerprint
    },
    activity: {
      status: 'info',
      label: 'Monitoramento Ativo',
      details: `${behaviorData.timeOnPage}ms na página`,
      icon: Activity
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'vertical':
        return 'space-y-4';
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(securityStatus.botDetection.status)} ${className}`}>
        <Shield className="w-4 h-4" />
        <span className="text-sm font-medium">
          Proteção {isBot ? 'Ativa - Bot Detectado' : 'Ativa'}
        </span>
        {isLoading && <Clock className="w-3 h-3 animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Dashboard de Segurança</h2>
        {isLoading && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4 animate-pulse" />
            Analisando...
          </div>
        )}
      </div>

      {/* Main Security Cards */}
      <div className={getLayoutClasses()}>
        {/* Bot Detection */}
        <div className={`p-4 rounded-lg border ${getStatusColor(securityStatus.botDetection.status)}`}>
          <div className="flex items-center gap-3 mb-3">
            <Bot className="w-5 h-5" />
            <h3 className="font-semibold">Detecção de Bots</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <securityStatus.botDetection.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{securityStatus.botDetection.label}</span>
            </div>
            {confidence > 0 && (
              <div className="text-xs opacity-75">
                Confiança: {confidence}%
              </div>
            )}
          </div>
        </div>

        {/* Behavior Analysis */}
        <div className={`p-4 rounded-lg border ${getStatusColor(securityStatus.behavior.status)}`}>
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5" />
            <h3 className="font-semibold">Análise Comportamental</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <securityStatus.behavior.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{securityStatus.behavior.label}</span>
            </div>
            <div className="text-xs opacity-75">
              {securityStatus.behavior.interactions} interações detectadas
            </div>
          </div>
        </div>

        {/* Device Fingerprint */}
        <div className={`p-4 rounded-lg border ${getStatusColor(securityStatus.fingerprint.status)}`}>
          <div className="flex items-center gap-3 mb-3">
            <securityStatus.fingerprint.icon className="w-5 h-5" />
            <h3 className="font-semibold">Identificação do Dispositivo</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{securityStatus.fingerprint.label}</span>
            </div>
            {securityStatus.fingerprint.value && (
              <div className="text-xs opacity-75 font-mono">
                ID: {securityStatus.fingerprint.value}
              </div>
            )}
          </div>
        </div>

        {/* Activity Monitor */}
        <div className={`p-4 rounded-lg border ${getStatusColor(securityStatus.activity.status)}`}>
          <div className="flex items-center gap-3 mb-3">
            <securityStatus.activity.icon className="w-5 h-5" />
            <h3 className="font-semibold">Monitor de Atividade</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">{securityStatus.activity.label}</span>
            </div>
            <div className="text-xs opacity-75">
              {Math.round(behaviorData.timeOnPage / 1000)}s na página
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Security Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CORS Status */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <CORSStatus showDetails={true} />
        </div>

        {/* Rate Limiting Status */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <RateLimitStatus action="security_dashboard" />
        </div>
      </div>

      {/* Detailed Behavior Data */}
      {showDetails && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Dados Comportamentais Detalhados
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Movimentos do Mouse:</span>
              <div className="font-semibold">{behaviorData.mouseMovements}</div>
            </div>
            <div>
              <span className="text-gray-600">Interações do Teclado:</span>
              <div className="font-semibold">{behaviorData.keyboardInteractions}</div>
            </div>
            <div>
              <span className="text-gray-600">Tempo na Página:</span>
              <div className="font-semibold">{Math.round(behaviorData.timeOnPage / 1000)}s</div>
            </div>
            <div>
              <span className="text-gray-600">Interagiu:</span>
              <div className="font-semibold">
                {behaviorData.hasInteracted ? (
                  <span className="text-green-600">Sim</span>
                ) : (
                  <span className="text-yellow-600">Não</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Status de Segurança
        </h3>
        <div className="text-sm text-blue-800">
          {isBot ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span>
                Possível automação detectada. Monitoramento ativo para garantir segurança.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>
                Todas as proteções estão funcionando normalmente. Usuário verificado como legítimo.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SecurityDashboard; 