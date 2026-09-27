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

// Lo que viene del formulario: sin id ni created_at (esos los pone Supabase).
export type NuevoPerro = Omit<AppUser, 'id' | 'created_at'>;

@Injectable({ providedIn: 'root' })
export class PerrosService {
  // Trae todos los perritos desde Supabase (los más nuevos primero).
  async todas(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('perros')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AppUser[];
  }

  // Trae un perrito por su id.
  async obtener(id: string): Promise<AppUser | undefined> {
    const { data, error } = await supabase
      .from('perros')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as AppUser | undefined;
  }

  // Guarda un perrito nuevo.
  async agregar(datos: NuevoPerro): Promise<void> {
    const { error } = await supabase.from('perros').insert(datos);
    if (error) throw error;
  }

  // Marca un perrito como adoptado.
  async adoptar(id: string): Promise<void> {
    const { error } = await supabase
      .from('perros')
      .update({ adoptado: true })
      .eq('id', id);
    if (error) throw error;
  }
}
