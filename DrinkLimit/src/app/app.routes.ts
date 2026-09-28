import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { profileGuard } from './guards/profile.guard';
import { pendingProfileGuard } from './guards/pending-profile.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'completar-perfil',
    canActivate: [authGuard, pendingProfileGuard],
    loadComponent: () =>
      import('./completar-perfil/completar-perfil.page').then((m) => m.CompletarPerfilPage),
  },
  {
    path: '',
    canActivate: [authGuard, profileGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];