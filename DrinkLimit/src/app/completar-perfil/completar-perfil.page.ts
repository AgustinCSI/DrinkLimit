import { Component, OnInit, inject, signal } from "@angular/core";
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {
  IonContent, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner,
} from "@ionic/angular";
import { AuthService } from "../services/auth.service";
import { UsersService } from "../services/users.service";

type Campo = "first_name" | "last_name" | "username" | "birth_date" | "gender" | "weight";

// La fecha de nacimiento no puede ser futura (YYYY-MM-DD se puede comparar como texto).
function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null;
  const hoy = new Date().toLocaleDateString("en-CA"); // formato YYYY-MM-DD, hora local
  return valor > hoy ? { fechaFutura: true } : null;
}

// Página que solo se usa la primera vez: crea la fila del usuario en `users`.
@Component({
  selector: "app-completar-perfil",
  templateUrl: "./completar-perfil.page.html",
  styleUrl: "./completar-perfil.page.scss",
  imports: [
    ReactiveFormsModule,
    IonContent, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner,
  ],
})
export class CompletarPerfilPage implements OnInit {
  private auth = inject(AuthService);
  private users = inject(UsersService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  cargando = signal(true);
  guardando = signal(false);
  intentado = signal(false);
  error = signal("");
  email = signal("");

  private userId = "";

  form = this.fb.nonNullable.group({
    first_name: ["", Validators.required],
    last_name: ["", Validators.required],
    username: ["", [Validators.required, Validators.minLength(3)]],
    birth_date: ["", [Validators.required, fechaNoFutura]],
    gender: ["", Validators.required],
    weight: [null as number | null, [Validators.min(20), Validators.max(300)]],
  });

  async ngOnInit() {
    try {
      const usuario = await this.auth.usuario();
      if (!usuario) {
        this.router.navigateByUrl("/login", { replaceUrl: true });
        return;
      }
      this.userId = usuario.id;
      this.email.set(usuario.email ?? ""); // <-- Capture the email

      const perfil = await this.users.obtener(this.userId);
      if (perfil) {
        this.router.navigateByUrl("/tabs/tab1", { replaceUrl: true });
        return;
      }
    } catch (e: unknown) {
      console.error(e);
      this.error.set("No pudimos cargar tus datos. Revisa tu conexión e intenta de nuevo.");
    } finally {
      this.cargando.set(false);
    }
  }

  // Mensaje de error de un campo ("" si no hay que mostrar nada).
  errorCampo(campo: Campo): string {
    if (!this.intentado()) return "";
    const errores = this.form.controls[campo].errors;
    if (!errores) return "";
    if (errores["required"]) return "Este campo es obligatorio.";
    if (errores["minlength"]) return "Escribe al menos 3 caracteres.";
    if (errores["fechaFutura"]) return "La fecha no puede ser futura.";
    if (errores["min"] || errores["max"]) return "Escribe un peso entre 20 y 300 kg.";
    return "";
  }

  limpiarError() {
    this.error.set("");
  }

  async guardar() {
    this.intentado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.error.set("");
    const v = this.form.getRawValue();
    try {
      await this.users.guardarPerfil(this.userId, {
        first_name: v.first_name.trim(),
        last_name: v.last_name.trim(),
        username: v.username.trim(),
        birth_date: v.birth_date,
        gender: v.gender,
        // Los inputs numéricos a veces entregan texto; lo convertimos.
        weight: v.weight === null || (v.weight as unknown) === "" ? null : Number(v.weight),
      });
      this.router.navigateByUrl("/tabs/tab1", { replaceUrl: true });
    } catch (e: unknown) {
      console.error(e);
      this.error.set(this.traducir(e));
    } finally {
      this.guardando.set(false);
    }
  }

  // Por si entró con la cuenta equivocada.
  async salir() {
    await this.auth.salir();
    this.router.navigateByUrl("/login", { replaceUrl: true });
  }

  private traducir(e: unknown): string {
    const { code = "", message = "" } = (e ?? {}) as { code?: string; message?: string };
    const texto = message.toLowerCase();

    if (code === "23505" || texto.includes("duplicate key")) {
      return "Ese nombre de usuario ya está en uso. Prueba con otro.";
    }
    if (code === "42501" || texto.includes("row-level security")) {
      return "No tienes permiso para guardar el perfil (revisa las políticas de la tabla users en Supabase).";
    }
    if (texto.includes("fetch") || texto.includes("network")) {
      return "No pudimos conectar. Revisa tu internet e intenta de nuevo.";
    }
    return "No se pudo guardar el perfil. Intenta de nuevo.";
  }

  
}