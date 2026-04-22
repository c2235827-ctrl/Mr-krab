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
      message.includes('invalid_grant')) {
    // This is handled globally in App.tsx but good to have here
    console.warn('Handling auth terminal error in global handler');
    window.localStorage.removeItem('supabase.auth.token');
    return;
  }

  toast.error(`${operation ? operation + ' failed: ' : ''}${error.message}`);
}
