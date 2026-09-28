import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { MotivoCierre } from '../models/sesion-finalizada.model';

export interface Drink {
  id: string;
  brand: string;
}

export interface DrinkingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  user_id: string;
  window_count: number | null;
  end_reason: MotivoCierre | null;
  photo_url?: string | null;
}

export interface SessionDrink {
  drinking_session_id: string;
  drunk_on: string;
  drink_id: string;
}

@Injectable({ providedIn: 'root' })
export class SessionsService {

  // La foto es opcional y solo se adjunta a un evento terminado.
  async guardarFoto(sessionId: string, fotoUrl: string): Promise<DrinkingSession> {
    const { data, error } = await supabase.from('drinking_sessions')
      .update({ photo_url: fotoUrl }).eq('id', sessionId)
      .not('end_time', 'is', null).select().single();
    if (error) throw error;
    return data as DrinkingSession;
  }

  // Catálogo de tragos disponibles.
  async listaDrinks(): Promise<Drink[]> {
    const { data, error } = await supabase
      .from('drinks')
      .select('*')
      .order('brand');
    if (error) throw error;
    return (data ?? []) as Drink[];
  }

  // La sesión abierta del usuario, si tiene una (end_time nulo = en curso).
  async sesionActiva(userId: string): Promise<DrinkingSession | undefined> {
    const { data, error } = await supabase
      .from('drinking_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('end_time', null)
      .maybeSingle();
    if (error) throw error;
    return (data ?? undefined) as DrinkingSession | undefined;
  }

  // Empieza una sesión nueva y devuelve la fila creada (para tener su id).
  async iniciarSesion(userId: string, ventanas: number): Promise<DrinkingSession> {
    const { data, error } = await supabase
      .from('drinking_sessions')
      .insert({
        user_id: userId,
        start_time: new Date().toISOString(),
        end_time: null,
        window_count: ventanas,
      })
      .select()
      .single();
    if (error) throw error;
    return data as DrinkingSession;
  }

  // Permite completar la duración de una sesión antigua que aún esté abierta.
  async definirVentanas(sessionId: string, ventanas: number): Promise<DrinkingSession> {
    const { data, error } = await supabase.from('drinking_sessions')
      .update({ window_count: ventanas }).eq('id', sessionId).is('end_time', null)
      .is('window_count', null).select().maybeSingle();
    if (error) throw error;
    return data ?? await this.obtenerSesion(sessionId);
  }

  async obtenerSesion(sessionId: string): Promise<DrinkingSession> {
    const { data, error } = await supabase.from('drinking_sessions').select('*').eq('id', sessionId).single();
    if (error) throw error;
    return data as DrinkingSession;
  }

  // Un reintento no cambia el motivo ni la hora de una sesión ya cerrada.
  async terminarSesion(sessionId: string, motivo: MotivoCierre, fin: string): Promise<DrinkingSession> {
    const { data, error } = await supabase.from('drinking_sessions')
      .update({ end_time: fin, end_reason: motivo }).eq('id', sessionId).is('end_time', null)
      .select().maybeSingle();
    if (error) throw error;
    return data ?? await this.obtenerSesion(sessionId);
  }

  // Historial: sesiones ya terminadas, más recientes primero.
  async historial(userId: string): Promise<DrinkingSession[]> {
    const sesiones: DrinkingSession[] = [];
    const cantidad = 500;
    for (let desde = 0; ; desde += cantidad) {
      const { data, error } = await supabase.from('drinking_sessions').select('*')
        .eq('user_id', userId).not('end_time', 'is', null)
        .order('start_time', { ascending: false }).order('id')
        .range(desde, desde + cantidad - 1);
      if (error) throw error;
      sesiones.push(...(data ?? []) as DrinkingSession[]);
      if (!data || data.length < cantidad) return sesiones;
    }
  }

  // +1: registra un trago tomado en la sesión (cada tap = una fila).
  async agregarTrago(sessionId: string, drinkId: string): Promise<void> {
    const { error } = await supabase
      .from('session_drinks')
      .insert({
        drinking_session_id: sessionId,
        drink_id: drinkId,
        drunk_on: new Date().toISOString(),
      });
    if (error) throw error;
  }

  // -1: borra el registro más reciente de ese trago en la sesión.
  async quitarTrago(sessionId: string, drinkId: string): Promise<void> {
    const { data, error } = await supabase
      .from('session_drinks')
      .select('drinking_session_id, drunk_on')
      .eq('drinking_session_id', sessionId)
      .eq('drink_id', drinkId)
      .order('drunk_on', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return; // no hay nada que quitar

    const { error: delError } = await supabase
      .from('session_drinks')
      .delete()
      .eq('drinking_session_id', data.drinking_session_id)
      .eq('drink_id', drinkId)
      .eq('drunk_on', data.drunk_on);
    if (delError) throw delError;
  }

  // Todos los tragos registrados en una sesión, con el nombre del trago incluido.
  async tragosDeSesion(sessionId: string): Promise<(SessionDrink & { drinks: Drink })[]> {
    const { data, error } = await supabase
      .from('session_drinks')
      .select('*, drinks(*)')
      .eq('drinking_session_id', sessionId)
      .order('drunk_on');
    if (error) throw error;
    return (data ?? []) as (SessionDrink & { drinks: Drink })[];
  }

  // Cuántas veces se registró cada trago en una sesión (para pintar los contadores al abrir/reabrir).
  async conteoPorDrink(sessionId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('session_drinks')
      .select('drink_id')
      .eq('drinking_session_id', sessionId);
    if (error) throw error;

    const conteo: Record<string, number> = {};
    for (const fila of data ?? []) {
      conteo[fila.drink_id] = (conteo[fila.drink_id] ?? 0) + 1;
    }
    return conteo;
  }
}
