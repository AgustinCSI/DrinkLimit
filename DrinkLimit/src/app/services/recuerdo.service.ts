import { Injectable } from '@angular/core';

export interface DatosRecuerdo {
  vecesCurado: number | null;
  topeTragos: number | null;
  limitePersonal: number | null;
  foto: string | null;
}

@Injectable({ providedIn: 'root' })
export class RecuerdoService {
  async generar(datos: DatosRecuerdo): Promise<Blob> {
    const foto = await this.cargarImagen(datos.foto ?? 'assets/icon/DrinkLimitLogo.png');
    const lienzo = document.createElement('canvas');
    lienzo.width = 720;
    lienzo.height = 960;
    const contexto = lienzo.getContext('2d');
    if (!contexto) throw new Error('Este navegador no permite generar el recuerdo.');

    contexto.fillStyle = '#cf252b';
    contexto.fillRect(0, 0, 720, 960);
    contexto.fillStyle = '#ffffff';
    contexto.font = 'bold 48px Arial, sans-serif';
    contexto.fillText('Top AlcohilDrink', 48, 88);
    contexto.font = '30px Arial, sans-serif';
    contexto.fillText(`Veces curado: ${datos.vecesCurado ?? 'Sin datos'}`, 48, 166);
    contexto.fillText(`Tope de tragos: ${datos.topeTragos ?? 'Sin datos'}`, 48, 230);
    contexto.fillText(`Límite histórico: ${datos.limitePersonal ?? 'Sin datos'}`, 48, 294);

    contexto.fillStyle = '#ffb600';
    contexto.beginPath();
    contexto.roundRect(48, 342, 624, 558, 28);
    contexto.fill();
    contexto.fillStyle = '#171717';
    contexto.textAlign = 'center';
    contexto.font = 'bold 34px Arial, sans-serif';
    contexto.fillText('Desbloquea el recuerdo', 360, 402);

    // Recorte central cuadrado, equivalente a object-fit: cover en una imagen HTML.
    const lado = Math.min(foto.naturalWidth, foto.naturalHeight);
    contexto.drawImage(foto, (foto.naturalWidth - lado) / 2, (foto.naturalHeight - lado) / 2,
      lado, lado, 150, 448, 420, 420);

    return new Promise((resolve, reject) => {
      lienzo.toBlob((archivo) => {
        if (archivo) resolve(archivo);
        else reject(new Error('No se pudo generar la imagen. Intenta nuevamente.'));
      }, 'image/png');
    });
  }

  private cargarImagen(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const imagen = new Image();
      imagen.crossOrigin = 'anonymous';
      imagen.onload = () => resolve(imagen);
      imagen.onerror = () => reject(new Error('No se pudo cargar la foto. Revisa la foto del evento en el historial o vuelve a intentarlo.'));
      imagen.src = url;
    });
  }
}
