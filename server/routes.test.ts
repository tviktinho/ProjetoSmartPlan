import { describe, it, expect } from 'vitest';

// Testes de validação de regras de negócio (sem necessidade de servidor)

describe('Validação de Email', () => {
  const isValidUfuEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@ufu.br');
  };

  it('deve aceitar emails @ufu.br', () => {
    expect(isValidUfuEmail('aluno@ufu.br')).toBe(true);
    expect(isValidUfuEmail('professor@ufu.br')).toBe(true);
  });

  it('deve rejeitar emails de outros domínios', () => {
    expect(isValidUfuEmail('aluno@gmail.com')).toBe(false);
    expect(isValidUfuEmail('aluno@outlook.com')).toBe(false);
    expect(isValidUfuEmail('aluno@ufu.com')).toBe(false);
  });

  it('deve ser case-insensitive', () => {
    expect(isValidUfuEmail('ALUNO@UFU.BR')).toBe(true);
    expect(isValidUfuEmail('Aluno@Ufu.Br')).toBe(true);
  });
});

describe('Validação de Senha', () => {
  const isValidPassword = (password: string): boolean => {
    return (
      typeof password === 'string' &&
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  it('deve aceitar senha válida com todos os requisitos', () => {
    expect(isValidPassword('Senha@123')).toBe(true);
    expect(isValidPassword('MinhaSenha#2024')).toBe(true);
  });

  it('deve rejeitar senha muito curta', () => {
    expect(isValidPassword('Se@1')).toBe(false);
  });

  it('deve rejeitar senha sem letra maiúscula', () => {
    expect(isValidPassword('senha@123')).toBe(false);
  });

  it('deve rejeitar senha sem letra minúscula', () => {
    expect(isValidPassword('SENHA@123')).toBe(false);
  });

  it('deve rejeitar senha sem número', () => {
    expect(isValidPassword('Senha@abc')).toBe(false);
  });

  it('deve rejeitar senha sem símbolo especial', () => {
    expect(isValidPassword('Senha1234')).toBe(false);
  });
});

describe('Validação de Disciplina', () => {
  interface DisciplineData {
    name: string;
    code?: string;
    professor?: string;
    semester?: string;
    color?: string;
  }

  const isValidDiscipline = (data: DisciplineData): boolean => {
    if (!data.name || data.name.trim().length === 0) return false;
    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) return false;
    return true;
  };

  it('deve aceitar disciplina com nome válido', () => {
    expect(isValidDiscipline({ name: 'Cálculo I' })).toBe(true);
  });

  it('deve rejeitar disciplina sem nome', () => {
    expect(isValidDiscipline({ name: '' })).toBe(false);
    expect(isValidDiscipline({ name: '   ' })).toBe(false);
  });

  it('deve aceitar cor hexadecimal válida', () => {
    expect(isValidDiscipline({ name: 'Física', color: '#3B82F6' })).toBe(true);
    expect(isValidDiscipline({ name: 'Física', color: '#ffffff' })).toBe(true);
  });

  it('deve rejeitar cor inválida', () => {
    expect(isValidDiscipline({ name: 'Física', color: 'red' })).toBe(false);
    expect(isValidDiscipline({ name: 'Física', color: '#GGG' })).toBe(false);
  });
});

describe('Validação de Tarefa', () => {
  const validPriorities = ['high', 'medium', 'low'];
  const validStatuses = ['todo', 'in_progress', 'completed'];

  const isValidPriority = (priority: string): boolean => {
    return validPriorities.includes(priority);
  };

  const isValidStatus = (status: string): boolean => {
    return validStatuses.includes(status);
  };

  it('deve aceitar prioridades válidas', () => {
    expect(isValidPriority('high')).toBe(true);
    expect(isValidPriority('medium')).toBe(true);
    expect(isValidPriority('low')).toBe(true);
  });

  it('deve rejeitar prioridades inválidas', () => {
    expect(isValidPriority('urgent')).toBe(false);
    expect(isValidPriority('')).toBe(false);
  });

  it('deve aceitar status válidos', () => {
    expect(isValidStatus('todo')).toBe(true);
    expect(isValidStatus('in_progress')).toBe(true);
    expect(isValidStatus('completed')).toBe(true);
  });

  it('deve rejeitar status inválidos', () => {
    expect(isValidStatus('pending')).toBe(false);
    expect(isValidStatus('done')).toBe(false);
  });
});

describe('Validação de Lembrete', () => {
  const validReminderTypes = ['prova', 'trabalho', 'apresentacao', 'prazo'];

  const isValidReminderType = (type: string): boolean => {
    return validReminderTypes.includes(type);
  };

  it('deve aceitar tipos de lembrete válidos', () => {
    expect(isValidReminderType('prova')).toBe(true);
    expect(isValidReminderType('trabalho')).toBe(true);
    expect(isValidReminderType('apresentacao')).toBe(true);
    expect(isValidReminderType('prazo')).toBe(true);
  });

  it('deve rejeitar tipos de lembrete inválidos', () => {
    expect(isValidReminderType('reunião')).toBe(false);
    expect(isValidReminderType('')).toBe(false);
  });
});

describe('Validação de Reunião', () => {
  const validMeetingTypes = ['trabalho', 'disciplina', 'estudo', 'outro'];

  const isValidMeetingType = (type: string): boolean => {
    return validMeetingTypes.includes(type);
  };

  it('deve aceitar tipos de reunião válidos', () => {
    expect(isValidMeetingType('trabalho')).toBe(true);
    expect(isValidMeetingType('disciplina')).toBe(true);
    expect(isValidMeetingType('estudo')).toBe(true);
    expect(isValidMeetingType('outro')).toBe(true);
  });

  it('deve rejeitar tipos de reunião inválidos', () => {
    expect(isValidMeetingType('aula')).toBe(false);
    expect(isValidMeetingType('')).toBe(false);
  });
});

describe('Validação de Frequência', () => {
  const validAttendanceStatuses = ['present', 'absent', 'justified'];

  const isValidAttendanceStatus = (status: string): boolean => {
    return validAttendanceStatuses.includes(status);
  };

  it('deve aceitar status de frequência válidos', () => {
    expect(isValidAttendanceStatus('present')).toBe(true);
    expect(isValidAttendanceStatus('absent')).toBe(true);
    expect(isValidAttendanceStatus('justified')).toBe(true);
  });

  it('deve rejeitar status de frequência inválidos', () => {
    expect(isValidAttendanceStatus('late')).toBe(false);
    expect(isValidAttendanceStatus('')).toBe(false);
  });
});