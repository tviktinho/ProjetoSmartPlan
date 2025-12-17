import { describe, it, expect } from 'vitest';
import { reducer } from './use-toast';

describe('Toast Reducer', () => {
  const initialState = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('deve adicionar um toast ao estado', () => {
      const toast = { id: '1', title: 'Test Toast', open: true };
      const newState = reducer(initialState, { type: 'ADD_TOAST', toast });
      
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(toast);
    });

    it('deve limitar a quantidade de toasts (TOAST_LIMIT = 1)', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };
      
      let state = reducer(initialState, { type: 'ADD_TOAST', toast: toast1 });
      state = reducer(state, { type: 'ADD_TOAST', toast: toast2 });
      
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe('2'); // Novo toast fica no início
    });
  });

  describe('UPDATE_TOAST', () => {
    it('deve atualizar um toast existente', () => {
      const toast = { id: '1', title: 'Original', open: true };
      const stateWithToast = { toasts: [toast] };
      
      const newState = reducer(stateWithToast, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });
      
      expect(newState.toasts[0].title).toBe('Updated');
      expect(newState.toasts[0].open).toBe(true); // Mantém outras propriedades
    });

    it('não deve modificar toasts com ids diferentes', () => {
      const toast = { id: '1', title: 'Original', open: true };
      const stateWithToast = { toasts: [toast] };
      
      const newState = reducer(stateWithToast, {
        type: 'UPDATE_TOAST',
        toast: { id: '2', title: 'Updated' },
      });
      
      expect(newState.toasts[0].title).toBe('Original');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('deve fechar um toast específico', () => {
      const toast = { id: '1', title: 'Test', open: true };
      const stateWithToast = { toasts: [toast] };
      
      const newState = reducer(stateWithToast, {
        type: 'DISMISS_TOAST',
        toastId: '1',
      });
      
      expect(newState.toasts[0].open).toBe(false);
    });

    it('deve fechar todos os toasts quando toastId não é fornecido', () => {
      const toast1 = { id: '1', title: 'Test 1', open: true };
      const stateWithToast = { toasts: [toast1] };
      
      const newState = reducer(stateWithToast, {
        type: 'DISMISS_TOAST',
      });
      
      expect(newState.toasts.every(t => t.open === false)).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('deve remover um toast específico', () => {
      const toast = { id: '1', title: 'Test', open: true };
      const stateWithToast = { toasts: [toast] };
      
      const newState = reducer(stateWithToast, {
        type: 'REMOVE_TOAST',
        toastId: '1',
      });
      
      expect(newState.toasts).toHaveLength(0);
    });

    it('deve remover todos os toasts quando toastId não é fornecido', () => {
      const toast = { id: '1', title: 'Test', open: true };
      const stateWithToast = { toasts: [toast] };
      
      const newState = reducer(stateWithToast, {
        type: 'REMOVE_TOAST',
      });
      
      expect(newState.toasts).toHaveLength(0);
    });
  });
});
