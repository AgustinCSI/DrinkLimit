import { Injectable } from "@angular/core";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase.client";

// Qué pasó al crear la cuenta: quedó la sesión abierta, falta confirmar el
// correo, o ese correo ya tenía cuenta.
export type ResultadoRegistro = "sesion-iniciada" | "confirmar-correo" | "ya-existe";

@Injectable({ providedIn: "root" })
export class AuthService {
  // Crear una cuenta nueva (email + contraseña).
  async registrarse(email: string, password: string): Promise<ResultadoRegistro> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user && data.user.identities?.length === 0) return "ya-existe";

    return data.session ? "sesion-iniciada" : "confirmar-correo";
  }

  // Iniciar sesión con una cuenta existente.
  async ingresar(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  // Cerrar sesión.
  async salir() {
    await supabase.auth.signOut();
  }

  // La sesión actual (o null si no hay).
  async sesion(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  // El usuario logueado (o null).
  async usuario(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }
}
