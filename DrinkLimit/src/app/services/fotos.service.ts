import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class FotosService {
  // Carga un archivo al bucket "fotos" de Supabase Storage y devuelve su URL pública.
  async cargar(archivo: File): Promise<string> {
    const extension = archivo.name.split('.').pop() ?? 'jpg';
    const ruta = `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from('fotos').upload(ruta, archivo);
    if (error) throw error;

    const { data } = supabase.storage.from('fotos').getPublicUrl(ruta);
    return data.publicUrl;
  }
}
