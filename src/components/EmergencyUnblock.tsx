import { useState } from 'react';
import { Unlock, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { rateLimiter } from '../utils/rateLimiter';

interface EmergencyUnblockProps {
  onUnlock?: () => void;
}

export function EmergencyUnblock({ onUnlock }: EmergencyUnblockProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [blockStatus, setBlockStatus] = useState(rateLimiter.getStatus('global'));

  const getBlockStatus = () => {
    // Exemplo: checa status global de bloqueio
    return rateLimiter.getStatus('global');
  };

  const handleUnlock = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsUnlocking(true);
    
    try {
      // Aguardar um pouco para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Desbloqueia removendo o registro do rate limiter
      rateLimiter.reset('global');
      
      toast.success('Desbloqueio realizado com sucesso!');
      
      if (onUnlock) {
        onUnlock();
      }
      
    } catch (error) {
      console.error('Erro no desbloqueio:', error);
      toast.error('Erro durante o desbloqueio');
    } finally {
      setIsUnlocking(false);
      setShowConfirm(false);
    }
  };

  const refreshStatus = () => {
    setBlockStatus(getBlockStatus());
    toast.success('Status atualizado');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Shield className="w-16 h-16 text-red-500" />
            <Unlock className="w-6 h-6 text-blue-500 absolute -top-1 -right-1" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Desbloqueio Emergencial
        </h2>
        <p className="text-gray-600 text-sm">
          Use esta ferramenta apenas se você for um usuário legítimo temporariamente bloqueado
        </p>
      </div>

      {/* Status dos Bloqueios */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Status Atual</h3>
          <button
            onClick={refreshStatus}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Bloqueio Ativo:</span>
            <span className={`font-medium ${blockStatus.isBlocked ? 'text-red-600' : 'text-green-600'}`}>{blockStatus.isBlocked ? 'Sim' : 'Não'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tentativas:</span>
            <span className="font-medium">{blockStatus.attempts}</span>
          </div>
          {blockStatus.isBlocked && blockStatus.blockedUntil && (
            <div className="flex justify-between">
              <span className="text-gray-600">Expira em:</span>
              <span className="font-medium text-red-600">{new Date(blockStatus.blockedUntil).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Aviso de Segurança */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="text-xs space-y-1">
              <li>• Use apenas se você é um usuário legítimo</li>
              <li>• Esta ação será registrada para auditoria</li>
              <li>• Não abuse desta funcionalidade</li>
              <li>• Se o problema persistir, entre em contato com o suporte</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="space-y-3">
        {!showConfirm ? (
          <button
            onClick={handleUnlock}
            disabled={isUnlocking || !blockStatus.isBlocked}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center ${
              blockStatus.isBlocked
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Unlock className="w-5 h-5 mr-2" />
            {blockStatus.isBlocked ? 'Desbloquear Agora' : 'Nenhum Bloqueio Detectado'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-red-800 font-medium mb-2">Confirmar Desbloqueio?</p>
              <p className="text-red-600 text-sm">
                Esta ação removerá todos os bloqueios ativos e será registrada.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                {isUnlocking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Desbloqueando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Voltar ao Início
        </button>
      </div>

      {/* Informações de Contato */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Se o problema persistir após o desbloqueio,<br />
          entre em contato com o suporte técnico
        </p>
      </div>
    </div>
  );
} 