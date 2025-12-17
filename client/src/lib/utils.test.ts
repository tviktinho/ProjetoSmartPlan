import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (classNames utility)', () => {
  it('deve combinar classes simples', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('deve lidar com valores undefined e null', () => {
    expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2');
  });

  it('deve lidar com classes condicionais', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });

  it('deve mesclar classes do Tailwind corretamente', () => {
    // tailwind-merge deve resolver conflitos
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('deve lidar com arrays de classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
  });

  it('deve lidar com objetos de classes', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('deve retornar string vazia quando não há classes', () => {
    expect(cn()).toBe('');
  });
});
