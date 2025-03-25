import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { toast } from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials'
        ? 'Email ou senha inválidos'
        : error.message
    );
  }

  return data;
};

export const signUp = async (email: string, password: string, role: 'admin' | 'standard' = 'standard') => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
      data: {
        role
      }
    }
  });

  if (error) {
    throw new Error(
      error.message === 'User already registered'
        ? 'Este email já está cadastrado'
        : error.message
    );
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session?.user;
};

export const getUserRole = async (): Promise<'admin' | 'standard'> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return (user?.user_metadata?.role as 'admin' | 'standard') || 'standard';
};

// Storage helper functions
export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString().substring(2)}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('property-images')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Erro ao fazer upload da imagem');
  }
};

export const deleteImage = async (url: string) => {
  try {
    const fileName = url.split('/').pop();
    if (!fileName) throw new Error('Invalid image URL');

    const { error } = await supabase.storage
      .from('property-images')
      .remove([fileName]);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Erro ao deletar imagem');
  }
};