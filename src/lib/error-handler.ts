import { toast } from 'react-hot-toast';

export function handleSupabaseError(error: any, operation?: string) {
  if (!error) return;

  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('failed to fetch')) {
    toast.error('Network connection error. Please check your internet or disable ad-blockers.');
    return;
  }

  if (message.includes('jwt expired') || 
      message.includes('invalid refresh token') || 
      message.includes('refresh token not found') ||
      message.includes('refresh_token_not_found') ||
      message.includes('invalid_grant') ||
      message.includes('session_not_found') ||
      message.includes('token_not_found') ||
      (message.includes('refresh') && message.includes('token'))) {
    
    const isRecovery = window.location.hash.includes('access_token') || 
                      window.location.search.includes('type=recovery') ||
                      window.location.pathname === '/reset-password';

    if (!isRecovery) {
      // Clear storage and trigger a clean state reset
      window.localStorage.removeItem('sb-yisnyqrztkwxqnvslmqr-auth-token');
      window.localStorage.removeItem('supabase.auth.token');
      
      // Only redirect if not already on /auth
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return;
  }

  toast.error(`${operation ? operation + ' failed: ' : ''}${error.message}`);
}
