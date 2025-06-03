import React, { useState, useEffect } from 'react';
import { Building2, AlertTriangle, Clock, Shield, Bot } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, getUserRole } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useRateLimit } from '../hooks/useRateLimit';
import { RATE_LIMIT_CONFIGS } from '../utils/rateLimiter';
import { botDetection, type BotDetectionResult } from '../utils/botDetection';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botCheckResult, setBotCheckResult] = useState<BotDetectionResult | null>(null);
  const [showBotWarning, setShowBotWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Rate limiting usando o hook personalizado
  const {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    checkAllowed,
    recordAttempt,
    reset
  } = useRateLimit('login', RATE_LIMIT_CONFIGS.LOGIN);

  // Verificação de bot ao carregar a página
  useEffect(() => {
    const checkForBots = async () => {
      try {
        const result = await botDetection.detectBot();
        setBotCheckResult(result);
        
        if (result.isBot && result.confidence > 70) {
          setShowBotWarning(true);
          console.warn('🤖 Possível bot detectado no login:', result);
        }
      } catch (error) {
        console.error('Erro na detecção de bot:', error);
      }
    };

    // Aguardar um pouco para coletar dados de comportamento
    const timer = setTimeout(checkForBots, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Não redirecionar automaticamente - deixar o usuário escolher
      // o redirecionamento será feito após o login bem-sucedido
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast.error('Conta temporariamente bloqueada. Aguarde o tempo indicado.');
      return;
    }

    // Verificação adicional de bot antes do login
    const currentBotCheck = await botDetection.detectBot();
    
    // Se detectar bot com alta confiança, bloquear tentativa
    if (currentBotCheck.isBot && currentBotCheck.confidence > 80) {
      toast.error('Comportamento suspeito detectado. Tente novamente mais tarde.');
      recordAttempt(); // Registrar como tentativa suspeita
      
      console.warn('🤖 Tentativa de login bloqueada - Bot detectado:', {
        confidence: currentBotCheck.confidence,
        reasons: currentBotCheck.reasons,
        fingerprint: currentBotCheck.fingerprint.substring(0, 8)
      });
      
      return;
    }

    if (!checkAllowed()) {
      recordAttempt();
      toast.error('Muitas tentativas. Tente novamente mais tarde.');
      return;
    }

    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signIn(email, password);
      
      if (result.user) {
        // Sucesso no login - resetar rate limiting
        reset();
        
        // Log de login bem-sucedido com dados de segurança
        console.log('✅ Login bem-sucedido:', {
          user: result.user.email,
          botCheck: {
            isBot: currentBotCheck.isBot,
            confidence: currentBotCheck.confidence,
            fingerprint: currentBotCheck.fingerprint.substring(0, 8)
          }
        });
        
        // Detectar role do usuário e redirecionar apropriadamente
        try {
          const userRole = await getUserRole();
          
          const targetPath = userRole === 'admin' ? '/admin' : '/dashboard';
          toast.success('Login realizado com sucesso!');
          navigate(targetPath, { replace: true });
          
        } catch (roleError) {
          console.error('Erro ao detectar role do usuário:', roleError);
          
          // Fallback para detectar role
          try {
            const role = result.user.user_metadata?.role || 'standard';
            const targetPath = role === 'admin' ? '/admin' : '/dashboard';
            toast.success('Login realizado com sucesso!');
            navigate(targetPath, { replace: true });
            
          } catch (alternativeError) {
            console.error('Método alternativo falhou:', alternativeError);
            // Fallback seguro para dashboard
            toast.success('Login realizado com sucesso! Redirecionando...');
            navigate('/dashboard', { replace: true });
          }
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Registrar tentativa falhada
      recordAttempt();
      
      // Log de tentativa suspeita
      if (currentBotCheck.isBot) {
        console.warn('🚨 Tentativa de login falhada com bot detectado:', {
          email,
          botConfidence: currentBotCheck.confidence,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao fazer login');
      }
      
      // Aviso sobre tentativas restantes
      if (remainingAttempts <= 2) {
        toast.error(`${remainingAttempts} tentativa(s) restante(s) antes do bloqueio`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            Área Administrativa
          </h1>
          <p className="text-gray-600 mt-2">
            Entre para gerenciar os imóveis
          </p>
        </div>

        {/* Bot Detection Warning */}
        {showBotWarning && botCheckResult && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center">
              <Bot className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-orange-800 font-medium">Comportamento Automatizado Detectado</span>
            </div>
            <div className="mt-2 text-orange-700 text-sm">
              <p>Detectamos padrões que sugerem automação (confiança: {botCheckResult.confidence}%).</p>
              <p className="mt-1">Se você é humano, continue normalmente. O sistema está apenas protegendo contra bots.</p>
            </div>
            {botCheckResult.reasons.length > 0 && (
              <div className="mt-2 text-xs text-orange-600">
                Motivos: {botCheckResult.reasons.slice(0, 2).join(', ')}
                {botCheckResult.reasons.length > 2 && '...'}
              </div>
            )}
          </div>
        )}

        {/* Rate Limiting Warning */}
        {isBlocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Conta Temporariamente Bloqueada</span>
            </div>
            <div className="mt-2 flex items-center text-red-700">
              <Clock className="w-4 h-4 mr-1" />
              <span className="text-sm">
                Tente novamente em: {timeRemaining}
              </span>
            </div>
            <p className="text-red-600 text-sm mt-2">
              Muitas tentativas de login falharam. Por segurança, bloqueamos temporariamente esta conta.
            </p>
          </div>
        )}

        {/* Attempts Warning */}
        {!isBlocked && remainingAttempts <= 2 && remainingAttempts > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Aviso de Segurança</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              {remainingAttempts} tentativa(s) restante(s) antes do bloqueio temporário.
            </p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu email"
              required
              disabled={isBlocked}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
              placeholder="Digite sua senha"
              required
              minLength={6}
              disabled={isBlocked}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isBlocked}
            className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center ${
              (isLoading || isBlocked) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </>
            ) : isBlocked ? (
              'Bloqueado'
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Security Status - Espaço reservado fixo para evitar movimento do botão */}
        <div className="mt-6 h-[80px] flex items-center">
          {botCheckResult && !showBotWarning && (
            <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-green-800 text-sm font-medium">Proteção Ativa</span>
              </div>
              <p className="text-green-700 text-xs mt-1">
                Sistema de detecção de bots operacional. Sua sessão parece legítima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;