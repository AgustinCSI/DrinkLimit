import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class FotosService {
  // Carga un archivo al bucket "fotos" de Supabase Storage y devuelve su URL pública.
  async cargar(archivo: File): Promise<string> {
    const extension = archivo.name.split('.').pop() ?? 'jpg';
    // getRandomValues también está disponible al probar por HTTP en la red local.
    // 16 bytes aleatorios, escritos en hexadecimal, identifican el archivo.
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const identificador = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const ruta = `${identificador}.${extension}`;

    const { error } = await supabase.storage.from('fotos').upload(ruta, archivo);
    if (error) throw error;

    const { data } = supabase.storage.from('fotos').getPublicUrl(ruta);
    return data.publicUrl;
  }
}
