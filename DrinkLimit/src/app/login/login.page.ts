import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {
  IonContent, IonInput, IonButton, IonSegment, IonSegmentButton,
  IonLabel, IonSpinner,
} from "@ionic/angular";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-login",
  templateUrl: "login.page.html",
  styleUrls: ["login.page.scss"],
  imports: [
    FormsModule, ReactiveFormsModule,
    IonContent, IonInput, IonButton, IonSegment, IonSegmentButton,
    IonLabel, IonSpinner,
  ],
})
export class LoginPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Lo que se ve en pantalla va en signals: cuando cambian, Angular sabe qué
  // redibujar, aunque el cambio llegue después de un await.
  modo = signal<"entrar" | "crear">("entrar");
  cargando = signal(false);
  error = signal("");
  aviso = signal("");
  // Los errores de cada campo solo se muestran después del primer intento de enviar.
  intentado = signal(false);

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  // Si ya hay sesión abierta, no tiene sentido mostrar el login.
  async ngOnInit() {
    if (await this.auth.sesion()) {
      this.router.navigateByUrl("/tabs/tab1", { replaceUrl: true });
    }
  }

  limpiarMensajes() {
    this.error.set("");
    this.aviso.set("");
  }

  cambiarModo() {
    this.limpiarMensajes();
    this.intentado.set(false);
  }

  // Mensaje de error para el campo de correo ("" si no hay que mostrar nada).
  errorEmail(): string {
    if (!this.intentado()) return "";
    const errores = this.form.controls.email.errors;
    if (errores?.["required"]) return "Escribe tu correo.";
    if (errores?.["email"]) return "Ese correo no parece válido.";
    return "";
  }

  // Mensaje de error para el campo de contraseña.
  errorPassword(): string {
    if (!this.intentado()) return "";
    const errores = this.form.controls.password.errors;
    if (errores?.["required"]) return "Escribe tu contraseña.";
    if (errores?.["minlength"]) return "Debe tener al menos 6 caracteres.";
    return "";
  }

  async enviar() {
    this.intentado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.limpiarMensajes();
    const { email, password } = this.form.getRawValue();
    try {
      if (this.modo() === "crear") {
        const resultado = await this.auth.registrarse(email, password);

        if (resultado === "ya-existe") {
          this.modo.set("entrar");
          this.error.set("Ese correo ya tiene cuenta. Entra con tu contraseña.");
          return;
        }
        if (resultado === "confirmar-correo") {
          this.modo.set("entrar");
          this.aviso.set(`Cuenta creada. Te enviamos un correo a ${email}: ábrelo para confirmarla y después entra.`);
          return;
        }
      } else {
        await this.auth.ingresar(email, password);
      }
      this.router.navigateByUrl("/tabs/tab1", { replaceUrl: true });
    } catch (e: unknown) {
      console.error(e); // para ver el error original en la consola mientras desarrollas
      this.error.set(this.traducir(e));
    } finally {
      this.cargando.set(false);
    }
  }

  // Supabase responde en inglés; aquí lo convertimos a mensajes que sirvan.
  private traducir(e: unknown): string {
    const { code = "", message = "" } = (e ?? {}) as { code?: string; message?: string };
    const texto = message.toLowerCase();

    if (code === "invalid_credentials" || texto.includes("invalid login credentials")) {
      return "Correo o contraseña incorrectos.";
    }
    if (code === "email_not_confirmed" || texto.includes("email not confirmed")) {
      return "Todavía no confirmas tu correo. Revisa tu bandeja de entrada.";
    }
    if (code === "weak_password" || texto.includes("password should")) {
      return "La contraseña es muy débil. Usa al menos 6 caracteres.";
    }
    if (code.includes("rate_limit") || texto.includes("rate limit") || texto.includes("too many")) {
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    }
    if (texto.includes("fetch") || texto.includes("network")) {
      return "No pudimos conectar. Revisa tu internet e intenta de nuevo.";
    }
    return "No se pudo completar la operación. Intenta de nuevo.";
  }
}