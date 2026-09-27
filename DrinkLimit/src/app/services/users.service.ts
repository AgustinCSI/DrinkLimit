import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface User {
  id: string;
  created_at?: string;
  nombre: string;
  tipo: string;
  raza: string;
  edad: string;
  sexo: string;
  tamano: string;
  vacunada: boolean;
  descripcion: string;
  foto: string;
  adoptado: boolean;
}

// Lo que viene del formulario: sin id ni created_at (esos los pone Supabase).
export type NuevoPerro = Omit<User, 'id' | 'created_at'>;

@Injectable({ providedIn: 'root' })
export class PerrosService {
  // Trae todos los perritos desde Supabase (los más nuevos primero).
  async todas(): Promise<User[]> {
    const { data, error } = await supabase
      .from('perros')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as User[];
  }

  // Trae un perrito por su id.
  async obtener(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('perros')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as User | undefined;
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
