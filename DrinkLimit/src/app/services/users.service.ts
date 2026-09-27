import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface AppUser {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  username: string;
  weight: number | null;
}

// Lo que se puede editar desde el perfil: todo menos el id (ese lo pone Supabase Auth).
export type PerfilEditable = Omit<AppUser, 'id'>;

@Injectable({ providedIn: 'root' })
export class UsersService {

  // Trae el perfil de un usuario por su id.
  async obtener(id: string): Promise<AppUser | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as AppUser | undefined;
  }

  // Crea o actualiza el perfil del usuario logueado (upsert = "si existe, actualiza; si no, crea").
  async guardarPerfil(id: string, datos: PerfilEditable): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert({ id, ...datos });
    if (error) throw error;
  }
}