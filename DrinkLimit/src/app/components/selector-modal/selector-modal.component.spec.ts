import { SelectorModalComponent } from './selector-modal.component';

describe('SelectorModalComponent', () => {
  it('solo comunica la selección al confirmar y funciona con marcas de cerveza', () => {
    const selector = new SelectorModalComponent();
    selector.opciones = [
      { valor: 'corona', etiqueta: 'Corona' },
      { valor: 'austral', etiqueta: 'Austral' },
    ];
    selector.valorInicial = 'corona';
    selector.ngOnInit();
    const confirmar = vi.fn();
    selector.confirmado.subscribe(confirmar);

    selector.seleccion.set('austral');
    expect(confirmar).not.toHaveBeenCalled();
    selector.confirmar();
    expect(confirmar).toHaveBeenCalledWith('austral');
  });

  it('no confirma una opción inexistente', () => {
    const selector = new SelectorModalComponent();
    selector.opciones = [{ valor: '1', etiqueta: '1 ventana' }];
    const confirmar = vi.fn();
    selector.confirmado.subscribe(confirmar);
    selector.seleccion.set('7');
    selector.confirmar();
    expect(confirmar).not.toHaveBeenCalled();
  });
});
