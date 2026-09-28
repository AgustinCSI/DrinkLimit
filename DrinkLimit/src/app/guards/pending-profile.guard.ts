import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { UsersService } from "../services/users.service";

// Protects /completar-perfil: if profile already exists, send back to app.
export const pendingProfileGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const users = inject(UsersService);
  const router = inject(Router);

  const usuario = await auth.usuario();
  if (!usuario) return router.createUrlTree(["/login"]);

  try {
    const perfil = await users.obtener(usuario.id);
    return perfil ? router.createUrlTree(["/tabs/tab1"]) : true;
  } catch (error) {
    console.error("Error al comprobar perfil:", error);
    return true;
  }
};