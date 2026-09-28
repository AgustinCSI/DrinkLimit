import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonContent, IonAvatar, IonIcon, IonButton, IonInput,
  IonSelect, IonSelectOption, IonCard, IonCardContent, IonSpinner, IonNote,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, logOutOutline } from 'ionicons/icons';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';
import { HistorialLocalService } from '../services/historial-local.service';
import { AuthService } from '../services/auth.service';
import { AppUser, PerfilEditable, UsersService } from '../services/users.service';
import { FotosService } from '../services/fotos.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader, IonContent, IonAvatar, IonIcon, IonButton, IonInput, IonSelect,
    IonSelectOption, IonCard, IonCardContent, IonSpinner, IonNote, FormsModule, DatePipe, EncabezadoComponent,
  ],
})
export class Tab3Page {
  private users = inject(UsersService);
  private auth = inject(AuthService);
  private fotos = inject(FotosService);
  private router = inject(Router);
  private historial = inject(HistorialLocalService);

  private hoy = signal(new Date());
  private userId = '';

  perfil = signal<AppUser | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  editando = signal(false);
  error = signal('');
  aviso = signal('');

  // Manejo de la foto
  archivoPendiente = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  // Estadísticas del historial
  vecesCurado = this.historial.vecesCurado;
  topeTragos = this.historial.topeTragos;
  limitePersonal = this.historial.limitePersonal;

  borrador = {
    first_name: '',
    last_name: '',
    gender: 'Otro',
  };

  fotoVisible = computed(() => {
    if (this.editando() && this.previewUrl()) {
      return this.previewUrl();
    }
    return this.perfil()?.avatar_url ?? null;
  });

  edad = computed(() => {
    const nacimiento = this.perfil()?.birth_date;
    if (!nacimiento) return 0;
    const [anio, mes, dia] = nacimiento.split('-').map(Number);
    const hoy = this.hoy();
    let edad = hoy.getFullYear() - anio!;
    const faltaCumpleanos =
      hoy.getMonth() + 1 < mes! ||
      (hoy.getMonth() + 1 === mes! && hoy.getDate() < dia!);
    if (faltaCumpleanos) edad--;
    return edad;
  });

  constructor() {
    addIcons({ personOutline, logOutOutline });
  }

  async ionViewWillEnter() {
    this.hoy.set(new Date());
    await this.cargarPerfil();
  }

  async cargarPerfil() {
    this.cargando.set(true);
    this.error.set('');
    try {
      const usuario = await this.auth.usuario();
      if (!usuario) {
        await this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }
      this.userId = usuario.id;
      const datos = await this.users.obtener(this.userId);
      if (datos) {
        this.perfil.set(datos);
      }
    } catch (e: unknown) {
      console.error(e);
      this.error.set('No pudimos cargar los datos de tu perfil.');
    } finally {
      this.cargando.set(false);
    }
  }

  editar() {
    const p = this.perfil();
    if (!p) return;
    this.borrador = {
      first_name: p.first_name,
      last_name: p.last_name,
      gender: p.gender,
    };
    this.archivoPendiente.set(null);
    this.previewUrl.set(null);
    this.error.set('');
    this.aviso.set('');
    this.editando.set(true);
  }

  cancelar() {
    this.archivoPendiente.set(null);
    this.previewUrl.set(null);
    this.editando.set(false);
    this.error.set('');
  }

  seleccionarFoto(evento: Event) {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';

    if (!archivo) return;
    this.error.set('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.error.set('Selecciona una imagen en formato JPG, PNG o WebP.');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.error.set('La imagen debe pesar menos de 5 MB.');
      return;
    }

    this.archivoPendiente.set(archivo);
    this.previewUrl.set(URL.createObjectURL(archivo));
  }

  async guardar() {
    const actual = this.perfil();
    if (!this.editando() || !actual || !this.userId) return;

    const nombre = this.borrador.first_name.trim();
    const apellido = this.borrador.last_name.trim();
    if (!nombre || !apellido) {
      this.error.set('Completa el nombre y el apellido.');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    try {
      let avatarUrl = actual.avatar_url ?? null;

      // Si el usuario eligió una foto nueva, la subimos a Supabase Storage
      const nuevaFoto = this.archivoPendiente();
      if (nuevaFoto) {
        avatarUrl = await this.fotos.cargar(nuevaFoto);
      }

      const datosActualizados: PerfilEditable = {
        first_name: nombre,
        last_name: apellido,
        gender: this.borrador.gender,
        username: actual.username,
        birth_date: actual.birth_date,
        weight: actual.weight,
        avatar_url: avatarUrl,
      };

      await this.users.guardarPerfil(this.userId, datosActualizados);
      this.perfil.set({ id: this.userId, ...datosActualizados });
      this.archivoPendiente.set(null);
      this.previewUrl.set(null);
      this.editando.set(false);
      this.aviso.set('Perfil actualizado.');
    } catch (e: unknown) {
      console.error(e);
      this.error.set('No se pudo actualizar el perfil.');
    } finally {
      this.guardando.set(false);
    }
  }

  async cerrarSesion() {
    try {
      await this.auth.salir();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.error.set('No se pudo cerrar la sesión. Intenta nuevamente.');
    }
  }
}