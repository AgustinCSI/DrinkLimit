import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecuerdoModalComponent } from './recuerdo-modal.component';
import { RecuerdoService } from '../../services/recuerdo.service';

describe('RecuerdoModalComponent', () => {
  let fixture: ComponentFixture<RecuerdoModalComponent>;
  let componente: RecuerdoModalComponent;
  const generar = vi.fn();
  const crearUrl = vi.fn(() => 'blob:recuerdo');
  const revocarUrl = vi.fn();

  beforeEach(() => {
    generar.mockReset();
    crearUrl.mockClear();
    revocarUrl.mockClear();
    vi.stubGlobal('URL', { createObjectURL: crearUrl, revokeObjectURL: revocarUrl });
    TestBed.configureTestingModule({ providers: [{ provide: RecuerdoService, useValue: { generar } }] });
    fixture = TestBed.createComponent(RecuerdoModalComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('datos', { vecesCurado: 0, topeTragos: null, limitePersonal: null, foto: null });
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('usa el mismo PNG para la vista previa y la descarga y libera su URL al cerrar', async () => {
    generar.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const imagen = fixture.nativeElement.querySelector('img');
    const boton = fixture.nativeElement.querySelector('ion-button[download]');
    expect(imagen.getAttribute('src')).toBe('blob:recuerdo');
    expect(boton.href).toBe('blob:recuerdo');
    expect(boton.download).toBe('drinklimit-recuerdo.png');
    expect(boton.disabled).toBe(false);
    fixture.destroy();
    expect(revocarUrl).toHaveBeenCalledWith('blob:recuerdo');
  });

  it('permite reintentar después de un error sin habilitar una descarga vacía', async () => {
    generar.mockRejectedValueOnce(new Error('Foto inválida'));
    await componente.generar();
    expect(componente.error()).toBe('Foto inválida');
    expect(componente.imagenUrl()).toBe('');
    generar.mockResolvedValueOnce(new Blob(['png']));
    await componente.generar();
    expect(componente.error()).toBe('');
    expect(componente.imagenUrl()).toBe('blob:recuerdo');
  });

  it('no crea una URL si se cierra mientras se prepara la imagen', async () => {
    let terminar!: (archivo: Blob) => void;
    generar.mockReturnValue(new Promise<Blob>((resolve) => { terminar = resolve; }));
    const preparando = componente.generar();
    await componente.generar();
    expect(generar).toHaveBeenCalledTimes(1);
    expect(componente.generando()).toBe(true);
    fixture.destroy();
    terminar(new Blob(['png']));
    await preparando;
    expect(crearUrl).not.toHaveBeenCalled();
  });
});
