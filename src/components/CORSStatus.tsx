/**
 * 🛡️ Componente de Status CORS
 * 
 * Mostra o status atual das configurações CORS para administradores
 */

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { corsConfig, isOriginAllowed } from '../config/cors';

interface CORSStatusProps {
  showDetails?: boolean;
}

export const CORSStatus: React.FC<CORSStatusProps> = ({ showDetails = false }) => {
  const [currentOrigin, setCurrentOrigin] = useState<string>('');
  const [isOriginValid, setIsOriginValid] = useState<boolean>(false);
  const [isProduction, setIsProduction] = useState<boolean>(false);

  useEffect(() => {
    const origin = window.location.origin;
    setCurrentOrigin(origin);
    setIsOriginValid(isOriginAllowed(origin));
    setIsProduction(process.env.NODE_ENV === 'production');
  }, []);

  const getStatusColor = () => {
    if (isOriginValid) {
      return isProduction ? 'text-green-600' : 'text-blue-600';
    }
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (isOriginValid) {
      return isProduction ? 'Produção Segura' : 'Desenvolvimento Autorizado';
    }
    return 'Origem Não Autorizada';
  };

  const getStatusIcon = () => {
    if (isOriginValid) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        <Shield className="w-4 h-4" />
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Status CORS</h3>
        </div>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Origem Atual
          </label>
          <div className="flex items-center space-x-2">
            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
              {currentOrigin}
            </code>
            {isOriginValid ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Origens Permitidas ({corsConfig.allowedOrigins.length})
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {corsConfig.allowedOrigins.map((origin, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
              >
                <code className="font-mono text-gray-800">{origin}</code>
                {origin === currentOrigin && (
                  <span className="text-green-600 text-xs font-medium">ATUAL</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Métodos Permitidos
            </label>
            <div className="text-xs text-gray-600">
              {corsConfig.allowedMethods.join(', ')}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Credenciais
            </label>
            <div className="text-xs text-gray-600">
              {corsConfig.credentials ? '✅ Habilitadas' : '❌ Desabilitadas'}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ambiente
          </label>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              isProduction 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
            </span>
            <span className="text-xs text-gray-500">
              {isProduction ? 'Segurança máxima' : 'Configuração permissiva'}
            </span>
          </div>
        </div>

        {!isOriginValid && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 mb-1">
                  ⚠️ Origem Não Autorizada
                </p>
                <p className="text-red-700">
                  Esta origem não está na lista de domínios permitidos. 
                  {isProduction ? (
                    ' Em produção, isso bloqueará requisições.'
                  ) : (
                    ' Configure os domínios corretos em produção.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Configuração: src/config/cors.ts</span>
            <button
              onClick={() => window.open('https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', '_blank')}
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              <span>Documentação CORS</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 