# Etapa 2: encabezado reutilizable y diseño compartido

## Objetivo

Mostrar el mismo logo y estilo de encabezado en Inicio, Historial y Perfil, cambiando solo el título. Dar a las pestañas inferiores la apariencia del mockup.

Esta guía documenta el código ya aplicado en `LevantamientoDrinkLimit`: no es necesario pegarlo de nuevo. Los bloques muestran el contenido completo de cada archivo de esta etapa.

## Conceptos

- Una página tiene ruta propia; un componente es una pieza que se reutiliza dentro de las páginas.
- `@Input() titulo` recibe información de la página; `{{ titulo }}` la presenta en el HTML.
- `ion-header` permanece directamente en cada página y contiene `app-encabezado`, que dibuja la barra. Así la estructura principal sigue siendo encabezado más contenido.
- `:root` define colores compartidos. `var(--drinklimit-rojo)` lee el color, evitando repetirlo en varios archivos.
- `:host` aplica estilos al elemento del componente actual.
- Ionic asigna `tab-selected` a la pestaña activa; CSS utiliza esa clase para cambiar el color y el grosor del texto.
- Las reglas de las pestañas heredan un fondo claro a sus páginas, siguiendo el mockup.

## Archivos y código completo

### DrinkLimit/src/theme/variables.scss

Colores compartidos. Se agregó un bloque :root con variables CSS que consumen el encabezado, Inicio y las pestañas.

```scss
// For information on how to create your own theme, please refer to:
// https://ionicframework.com/docs/theming/

:root {
  --drinklimit-rojo: #cf252b;
  --drinklimit-rojo-oscuro: #b51f25;
  --drinklimit-fondo: #ffffff;
  --drinklimit-texto: #171717;
  --drinklimit-borde: #dddddd;
}
```

### DrinkLimit/src/app/components/encabezado/encabezado.component.ts

Componente nuevo: declara su vista, estilos y componentes Ionic. @Input permite recibir el título desde cada página.

```ts
import { Component, Input } from '@angular/core';
import { IonToolbar, IonTitle } from '@ionic/angular';

@Component({
  selector: 'app-encabezado',
  templateUrl: './encabezado.component.html',
  styleUrls: ['./encabezado.component.scss'],
  imports: [IonToolbar, IonTitle],
})
export class EncabezadoComponent {
  @Input() titulo = 'DrinkLimit';
}
```

### DrinkLimit/src/app/components/encabezado/encabezado.component.html

Vista nueva del encabezado: logo y título. {{ titulo }} muestra el valor recibido.

```html
<ion-toolbar>
  <img
    slot="start"
    class="logo"
    src="assets/icon/DrinkLimitLogo.png"
    alt="DrinkLimit"
    width="56"
    height="56"
  />
  <ion-title>{{ titulo }}</ion-title>
</ion-toolbar>
```

### DrinkLimit/src/app/components/encabezado/encabezado.component.scss

Estilos nuevos del encabezado. Aquí se trasladaron los estilos que antes pertenecían a Inicio.

```scss
:host {
  display: block;
}

ion-toolbar {
  --background: var(--drinklimit-fondo);
  --color: var(--drinklimit-texto);
  --min-height: 80px;
  --padding-start: 16px;
  --padding-end: 16px;
  border-bottom: 1px solid var(--drinklimit-borde);
}

.logo {
  border-radius: 50%;
  object-fit: cover;
}

ion-title {
  position: static;
  padding-inline: 16px;
  font-size: 28px;
  font-weight: 500;
  text-align: start;
}
```

### DrinkLimit/src/app/tab1/tab1.page.ts

Se sustituyeron IonToolbar e IonTitle por EncabezadoComponent en las importaciones y en imports.

```ts
import { Component } from '@angular/core';
import { IonHeader, IonContent, IonButton } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonContent, IonButton, EncabezadoComponent],
})
export class Tab1Page {}
```

### DrinkLimit/src/app/tab1/tab1.page.html

Se reemplazó la barra del encabezado por app-encabezado. Se conservó el contenido de Inicio.

```html
<ion-header class="ion-no-border">
  <app-encabezado titulo="Inicio"></app-encabezado>
</ion-header>

<ion-content>
  <div class="inicio">
    <img
      class="ilustracion"
      src="assets/images/inicio-bebidas.png"
      alt="Ilustración de bebidas y una jarra de cerveza tocando un acordeón"
      width="730"
      height="1000"
    />

    <!-- El selector de ventanas se conectará en la etapa de interacción. -->
    <ion-button class="boton-iniciar" type="button">
      Iniciar Ventana
    </ion-button>
  </div>
</ion-content>
```

### DrinkLimit/src/app/tab1/tab1.page.scss

Se quitaron los estilos trasladados al componente y se sustituyeron colores literales por las variables del tema.

```scss
ion-content {
  --background: var(--drinklimit-fondo);
}

.inicio {
  box-sizing: border-box;
  min-height: 100%;
  max-width: 560px;
  margin-inline: auto;
  padding: 24px 24px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}

.ilustracion {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
}

.boton-iniciar {
  --background: var(--drinklimit-rojo);
  --background-hover: var(--drinklimit-rojo-oscuro);
  --background-activated: var(--drinklimit-rojo-oscuro);
  --color: var(--drinklimit-fondo);
  --border-radius: 16px;
  --box-shadow: none;
  --padding-start: 20px;
  --padding-end: 20px;
  min-height: 54px;
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  text-transform: none;
}
```

### DrinkLimit/src/app/tab2/tab2.page.ts

Historial importa el componente reutilizable; mantiene IonHeader e IonContent como estructura de página.

```ts
import { Component } from '@angular/core';
import { IonHeader, IonContent } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonHeader, IonContent, EncabezadoComponent]
})
export class Tab2Page {

  constructor() {}

}
```

### DrinkLimit/src/app/tab2/tab2.page.html

Se reemplazó el encabezado por el componente y se agregó el cuerpo ion-content, todavía vacío.

```html
<ion-header class="ion-no-border">
  <app-encabezado titulo="Historial"></app-encabezado>
</ion-header>

<ion-content></ion-content>
```

### DrinkLimit/src/app/tab3/tab3.page.ts

Perfil importa el componente reutilizable; mantiene IonHeader e IonContent como estructura de página.

```ts
import { Component } from '@angular/core';
import { IonHeader, IonContent } from '@ionic/angular';
import { EncabezadoComponent } from '../components/encabezado/encabezado.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonHeader, IonContent, EncabezadoComponent],
})
export class Tab3Page {
  constructor() {}
}
```

### DrinkLimit/src/app/tab3/tab3.page.html

Se reemplazó el encabezado por el componente y se agregó el cuerpo ion-content, todavía vacío.

```html
<ion-header class="ion-no-border">
  <app-encabezado titulo="Perfil"></app-encabezado>
</ion-header>

<ion-content></ion-content>
```

### DrinkLimit/src/app/tabs/tabs.page.scss

Estilos de la navegación inferior: colores, tamaño, iconos y estado seleccionado. El HTML y las rutas existentes se conservan.

```scss
:host {
  --ion-background-color: var(--drinklimit-fondo);
  --ion-text-color: var(--drinklimit-texto);
}

ion-tab-bar {
  --background: var(--drinklimit-fondo);
  --border: 1px solid var(--drinklimit-borde);
  height: 88px;
}

ion-tab-button {
  --color: var(--drinklimit-texto);
  --color-selected: var(--drinklimit-rojo-oscuro);
  --padding-top: 8px;
  --padding-bottom: 8px;
  max-width: 120px;
}

ion-icon {
  box-sizing: content-box;
  width: 30px;
  height: 30px;
  padding: 6px 14px;
  border-radius: 24px;
  background: var(--drinklimit-rojo);
  color: var(--drinklimit-fondo);
}

ion-label {
  margin-top: 4px;
  font-size: 14px;
}

ion-tab-button.tab-selected ion-label {
  font-weight: 700;
}

ion-tab-button.tab-selected ion-icon {
  background: var(--drinklimit-rojo-oscuro);
}
```

## Comprobación

Se ejecutó `npm run build`: compilación correcta. `git diff --check` no encontró errores de formato. Solo permanece el aviso previo sobre navegadores antiguos de Browserslist. No se realizó una comprobación visual automatizada en navegador.

Para comprobar la interfaz:

```bash
cd /home/fyro/DrinkLimit/DrinkLimit
ionic serve
```

1. Abre la dirección indicada por la terminal (normalmente http://localhost:8100).
2. Revisa Inicio: logo y título sobre la ilustración existente.
3. Pulsa Historial y Perfil: debe conservarse el encabezado y cambiar su título.
4. Comprueba los iconos blancos sobre rojo y la etiqueta resaltada de la pestaña activa.
5. Regresa a Inicio y revisa que permanezcan la ilustración y el botón.
6. Reduce el ancho del navegador y revisa que los títulos y las tres pestañas sigan siendo visibles.

Historial y Perfil siguen sin contenido funcional; el botón Iniciar Ventana todavía no tiene una acción. El botón de salida se conectará en la etapa de autenticación.

## Errores comunes

- `app-encabezado is not a known element`: falta importar EncabezadoComponent o añadirlo a imports de la página.
- Título predeterminado DrinkLimit: falta pasar el atributo titulo al componente.
- Colores incorrectos: comprobar los nombres de las variables y que variables.scss siga registrado entre los estilos del proyecto.
- No aparecen cambios: confirmar que ionic serve se ejecuta desde la carpeta interior DrinkLimit y revisar los errores de la terminal.

## Avance de backend observado, pendiente de integrar

- Existen servicios, guard y login; las rutas actuales todavía no conectan el login ni el guard.
- Supabase JS está declarado en package.json, pero npm ls no lo encontró instalado en este entorno.
- La tabla public.users compartida vincula id con auth.users. La fecha de nacimiento debe permanecer fija según los requisitos, aunque el tipo PerfilEditable actual todavía la incluye.
- La tabla compartida no contiene aún un campo para la foto de perfil. No se modificaron tablas ni servicios en esta etapa.

## Referencias

- [Ejemplo del profesor: componente reutilizable y @Input](https://udd-web-mobile.vercel.app/aprende/clase-1/guia).
- [Angular: entradas de componentes](https://angular.dev/guide/components/inputs).
- [Ionic: barra de pestañas](https://ionicframework.com/docs/api/tab-bar).
- [Ionic: botones de pestañas](https://ionicframework.com/docs/api/tab-button).
