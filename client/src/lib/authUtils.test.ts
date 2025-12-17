import { describe, it, expect } from 'vitest';
import { isUnauthorizedError } from './authUtils';

describe('isUnauthorizedError', () => {
  it('deve retornar true para erro 401 Unauthorized', () => {
    const error = new Error('401: Unauthorized');
    expect(isUnauthorizedError(error)).toBe(true);
  });

  it('deve retornar true para erro 401 com mensagem adicional', () => {
    const error = new Error('401: User Unauthorized - Session expired');
    expect(isUnauthorizedError(error)).toBe(true);
  });

  it('deve retornar false para outros códigos de erro', () => {
    const error400 = new Error('400: Bad Request');
    const error403 = new Error('403: Forbidden');
    const error500 = new Error('500: Internal Server Error');
    
    expect(isUnauthorizedError(error400)).toBe(false);
    expect(isUnauthorizedError(error403)).toBe(false);
    expect(isUnauthorizedError(error500)).toBe(false);
  });

  it('deve retornar false para mensagens sem código de status', () => {
    const error = new Error('Unauthorized access');
    expect(isUnauthorizedError(error)).toBe(false);
  });

  it('deve retornar false para erro genérico', () => {
    const error = new Error('Something went wrong');
    expect(isUnauthorizedError(error)).toBe(false);
  });
});
