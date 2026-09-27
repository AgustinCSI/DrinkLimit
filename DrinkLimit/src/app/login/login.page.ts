import { Component, inject, signal } from "@angular/core";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput,
  IonButton, IonSegment, IonSegmentButton, IonLabel, IonText, IonSpinner,
} from "@ionic/angular";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-login",
  templateUrl: "login.page.html",
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonInput,
    IonButton, IonSegment, IonSegmentButton, IonLabel, IonText, IonSpinner,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Lo que se ve en pantalla va en signals: cuando cambian, Angular sabe qué
  // redibujar, aunque el cambio llegue después de un await.
  modo = signal<"entrar" | "crear">("entrar");
  cargando = signal(false);
  error = signal("");
  aviso = signal("");

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  limpiarMensajes() {
    this.error.set("");
    this.aviso.set("");
  }

  async enviar() {
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
      this.router.navigateByUrl("/profile", { replaceUrl: true });
    } catch (e: unknown) {
      this.error.set((e as { message?: string })?.message ?? "No se pudo completar la operación.");
    } finally {
      this.cargando.set(false);
    }
  }
}
