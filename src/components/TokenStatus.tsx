import { Clock, Shield, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface TokenStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function TokenStatus({ className = '', showDetails = false }: TokenStatusProps) {
  const { getTokenInfo, refreshToken } = useAuth();
  const tokenInfo = getTokenInfo();

  if (!tokenInfo) return null;

  const { timeUntilExpiry, isExpiring } = tokenInfo;

  const handleRefresh = async () => {
    await refreshToken();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Indicador visual */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isExpiring 
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {isExpiring ? (
          <AlertTriangle className="w-3 h-3" />
        ) : (
          <Shield className="w-3 h-3" />
        )}
        <span>{isExpiring ? 'Expirando' : 'Ativo'}</span>
      </div>

      {/* Tempo restante */}
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Clock className="w-3 h-3" />
        <span>{timeUntilExpiry}</span>
      </div>

      {/* Botão de refresh manual */}
      {(isExpiring || showDetails) && (
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
          title="Renovar token manualmente"
        >
          <RefreshCw className="w-3 h-3" />
          Renovar
        </button>
      )}

      {/* Detalhes expandidos */}
      {showDetails && (
        <div className="text-xs text-gray-500">
          <span>Expira: {new Date(tokenInfo.expiresAt * 1000).toLocaleString('pt-BR')}</span>
        </div>
      )}
    </div>
  );
} 