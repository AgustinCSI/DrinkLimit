import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

// Si no hay sesión, manda a /login.
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const sesion = await auth.sesion();
  return sesion ? true : router.createUrlTree(["/login"]);
};
