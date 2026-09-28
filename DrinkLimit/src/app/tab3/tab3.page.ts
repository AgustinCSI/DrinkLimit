import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonContent, IonAvatar, IonIcon, IonButton, IonInput,
  IonSelect, IonSelectOption, IonCard, IonCardContent, IonNote,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, logOutOutline } from 'ionicons/icons';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';
import { Sexo } from '../models/perfil-local.model';
import { PerfilLocalService } from '../services/perfil-local.service';
import { HistorialLocalService } from '../services/historial-local.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [
    IonHeader, IonContent, IonAvatar, IonIcon, IonButton, IonInput, IonSelect,
    IonSelectOption, IonCard, IonCardContent, IonNote, FormsModule, DatePipe, EncabezadoComponent,
  ],
})
export class Tab3Page implements OnDestroy {
  private servicio = inject(PerfilLocalService);
  private historial = inject(HistorialLocalService);
  private auth = inject(AuthService);
  private router = inject(Router);

  private hoy = signal(new Date());
  private lectorFoto: FileReader | null = null;

  perfil = this.servicio.perfil;
  vecesCurado = this.historial.vecesCurado;
  topeTragos = this.historial.topeTragos;
  limitePersonal = this.historial.limitePersonal;
  editando = signal(false);
  leyendoFoto = signal(false);
  fotoBorrador = signal<string | null>(null);
  error = signal('');
  aviso = signal('');
  borrador: { first_name: string; last_name: string; gender: Sexo } = {
    first_name: '', last_name: '', gender: 'Otro',
  };

  fotoVisible = computed(() => this.editando() ? this.fotoBorrador() : this.perfil().foto);

  edad = computed(() => {
    const [anio, mes, dia] = this.perfil().birth_date.split('-').map(Number);
    const hoy = this.hoy();
    let edad = hoy.getFullYear() - anio!;
    const faltaCumpleanos = hoy.getMonth() + 1 < mes! ||
      (hoy.getMonth() + 1 === mes! && hoy.getDate() < dia!);
    if (faltaCumpleanos) edad--;
    return edad;
  });

  constructor() {
    addIcons({ personOutline, logOutOutline });
  }

  ionViewWillEnter() {
    this.hoy.set(new Date());
  }

  async cerrarSesion() {
    try {
      await this.auth.salir();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch {
      this.error.set('No se pudo cerrar la sesión. Intenta nuevamente.');
    }
  }

  editar() {
    const perfil = this.perfil();
    this.borrador = { first_name: perfil.first_name, last_name: perfil.last_name, gender: perfil.gender };
    this.fotoBorrador.set(perfil.foto);
    this.error.set('');
    this.aviso.set('');
    this.editando.set(true);
  }

  cancelar() {
    this.cancelarLectura();
    this.editando.set(false);
    this.error.set('');
  }

  guardar() {
    if (!this.editando() || this.leyendoFoto()) return;
    try {
      this.servicio.guardar({ ...this.borrador, foto: this.fotoBorrador() });
      this.editando.set(false);
      this.error.set('');
      this.aviso.set('Perfil actualizado.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.');
    }
  }

  seleccionarFoto(evento: Event) {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    campo.value = '';
    if (!archivo || !this.editando()) return;
    this.cancelarLectura();
    this.error.set('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.error.set('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.error.set('La imagen debe pesar como máximo 5 MB.');
      return;
    }

    const lector = new FileReader();
    this.lectorFoto = lector;
    this.leyendoFoto.set(true);
    lector.onload = () => {
      if (this.editando() && typeof lector.result === 'string') this.fotoBorrador.set(lector.result);
      this.leyendoFoto.set(false);
      this.lectorFoto = null;
    };
    lector.onerror = () => {
      this.error.set('No se pudo leer la imagen. Intenta con otra.');
      this.leyendoFoto.set(false);
      this.lectorFoto = null;
    };
    lector.readAsDataURL(archivo);
  }

  ngOnDestroy() {
    this.cancelarLectura();
  }

  private cancelarLectura() {
    this.lectorFoto?.abort();
    this.lectorFoto = null;
    this.leyendoFoto.set(false);
  }
}