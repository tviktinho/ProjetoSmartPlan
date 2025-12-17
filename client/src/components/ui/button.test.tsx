import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button Component', () => {
  it('deve renderizar corretamente', () => {
    const { getByText } = render(<Button>Click Me</Button>);
    expect(getByText('Click Me')).toBeInTheDocument();
  });

  it('deve responder a cliques', async () => {
    const handleClick = vi.fn();
    const { getByText } = render(<Button onClick={handleClick}>Click Me</Button>);
    const button = getByText('Click Me');
    await fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar variante default corretamente', () => {
    const { getByRole } = render(<Button variant="default">Default</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('deve renderizar variante destructive corretamente', () => {
    const { getByRole } = render(<Button variant="destructive">Delete</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('deve renderizar variante outline corretamente', () => {
    const { getByRole } = render(<Button variant="outline">Outline</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('deve renderizar variante ghost corretamente', () => {
    const { getByRole } = render(<Button variant="ghost">Ghost</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('border-transparent');
  });

  it('deve aplicar tamanho sm corretamente', () => {
    const { getByRole } = render(<Button size="sm">Small</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('min-h-8');
  });

  it('deve aplicar tamanho lg corretamente', () => {
    const { getByRole } = render(<Button size="lg">Large</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('min-h-10');
  });

  it('deve estar desabilitado quando prop disabled é passada', () => {
    const { getByRole } = render(<Button disabled>Disabled</Button>);
    const button = getByRole('button');
    expect(button).toBeDisabled();
  });

  it('deve aplicar className customizado', () => {
    const { getByRole } = render(<Button className="custom-class">Custom</Button>);
    const button = getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});