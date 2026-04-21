import { toast } from 'react-hot-toast';

export function handleSupabaseError(error: any, operation?: string) {
  if (!error) return;

  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('failed to fetch')) {
    toast.error('Network connection error. Please check your internet or disable ad-blockers.');
    return;
  }

  if (message.includes('jwt expired') || message.includes('invalid refresh token')) {
    // This is handled globally in App.tsx but good to have here
    return;
  }

  toast.error(`${operation ? operation + ' failed: ' : ''}${error.message}`);
}
