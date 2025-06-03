// Guards de Proteção de Rotas
export { AuthGuard } from './AuthGuard';
export { RateLimitGuard, RateLimitStatus, useRouteRateLimit } from './RateLimitGuard';
export { 
  ProtectedRoute, 
  AdminRoute, 
  UserRoute, 
  HighSecurityRoute 
} from './ProtectedRoute';

// Tipos
export type { RateLimitConfig } from '../utils/rateLimiter'; 