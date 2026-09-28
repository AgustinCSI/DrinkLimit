import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export interface Drink {
  id: string;
  brand: string;
}

export interface DrinkingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  user_id: string;
}

export interface SessionDrink {
  drinking_session_id: string;
  drunk_on: string;
  drink_id: string;
}

@Injectable({ providedIn: 'root' })
export class SessionsService {

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
  async iniciarSesion(userId: string): Promise<DrinkingSession> {
    const { data, error } = await supabase
      .from('drinking_sessions')
      .insert({
        user_id: userId,
        start_time: new Date().toISOString(),
        end_time: null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as DrinkingSession;
  }

  // Cierra la sesión.
  async terminarSesion(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('drinking_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  }

  // Historial: sesiones ya terminadas, más recientes primero.
  async historial(userId: string): Promise<DrinkingSession[]> {
    const { data, error } = await supabase
      .from('drinking_sessions')
      .select('*')
      .eq('user_id', userId)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false });
    if (error) throw error;
    return (data ?? []) as DrinkingSession[];
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