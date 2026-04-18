import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setAuth: (user: User | null, profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setAuth: (user, profile) => set({ user, profile, isLoading: false }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, isLoading: false });
  },
}));
