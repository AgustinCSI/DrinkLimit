import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { UsersService } from "../services/users.service";

// Si hay sesión pero no hay fila en `users`, manda a /profile.
export const profileGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const users = inject(UsersService);
  const router = inject(Router);

  const usuario = await auth.usuario();
  if (!usuario) return true; // authGuard se encarga de este caso

  const perfil = await users.obtener(usuario.id);
  return perfil ? true : router.createUrlTree(["/profile"]);
};