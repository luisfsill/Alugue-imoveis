import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useSecureTokenStorage } from '../utils/secureTokenStorage';

interface TokenSecurityStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function TokenSecurityStatus({ 
  showDetails = false, 
  className = '' 
}: TokenSecurityStatusProps) {
  const { getSecurityStatus } = useSecureTokenStorage();
  const status = getSecurityStatus();

  const getStatusIcon = () => {
    if (process.env.NODE_ENV === 'development') {
      return <CheckCircle className="w-5 h-5 text-blue-600" />;
    }
    if (status.isSecure) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusColor = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'border-blue-200 bg-blue-50';
    }
    return status.isSecure 
      ? 'border-green-200 bg-green-50' 
      : 'border-yellow-200 bg-yellow-50';
  };

  const getStatusText = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'Desenvolvimento (localStorage)';
    }
    return status.isSecure 
      ? 'Conexão segura'
      : 'Conexão padrão';
  };

  const getDetailedStatusText = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'Desenvolvimento - Tokens em localStorage';
    }
    return status.isSecure 
      ? 'Tokens seguros com httpOnly'
      : `Tokens em ${status.storage}`;
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()} ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Status de Segurança dos Tokens</h3>
      </div>

      <div className="space-y-3">
        {/* Status Principal */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getDetailedStatusText()}</span>
        </div>

        {/* Detalhes do Storage */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Método de armazenamento:</span>
            <div className="font-medium flex items-center gap-1">
              {status.storage === 'httpOnly' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  httpOnly Cookies
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  localStorage
                </>
              )}
            </div>
          </div>

          <div>
            <span className="text-gray-600">Ambiente:</span>
            <div className="font-medium">
              {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
            </div>
          </div>
        </div>

        {/* Recursos de Segurança */}
        <div>
          <span className="text-gray-600 text-sm">Recursos ativos:</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {status.storage === 'httpOnly' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                <CheckCircle className="w-3 h-3" />
                httpOnly
              </span>
            )}
            
            {process.env.NODE_ENV === 'production' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                <CheckCircle className="w-3 h-3" />
                Secure
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              <CheckCircle className="w-3 h-3" />
              SameSite=Strict
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              <CheckCircle className="w-3 h-3" />
              PKCE
            </span>
          </div>
        </div>

        {/* Recomendações */}
        {status.recommendations.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Recomendações:</span>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {status.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Explicação técnica */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {process.env.NODE_ENV === 'development' ? (
              <>
                <strong>Ambiente de desenvolvimento</strong> detectado. Usando localStorage 
                para tokens. Em produção, será automaticamente upgradado para httpOnly cookies 
                com máxima segurança.
              </>
            ) : status.storage === 'httpOnly' ? (
              <>
                <strong>httpOnly cookies</strong> impedem que JavaScript acesse os tokens, 
                oferecendo proteção superior contra ataques XSS.
              </>
            ) : (
              <>
                <strong>localStorage</strong> é usado como fallback em desenvolvimento. 
                Em produção, configure httpOnly cookies para máxima segurança.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
} 