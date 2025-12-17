import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  insertDisciplineSchema,
  insertTaskSchema,
  insertReminderSchema,
  insertMeetingSchema,
  insertAttendanceSchema,
} from './schema';

describe('Schema de Disciplina', () => {
  it('deve validar disciplina com dados obrigatórios', () => {
    const validData = {
      userId: 'user-123',
      name: 'Cálculo I',
    };
    const result = insertDisciplineSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve validar disciplina com todos os campos', () => {
    const validData = {
      userId: 'user-123',
      name: 'Cálculo I',
      code: 'MAT001',
      professor: 'Dr. Silva',
      semester: '2024/1',
      color: '#3B82F6',
    };
    const result = insertDisciplineSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar disciplina sem nome', () => {
    const invalidData = {
      userId: 'user-123',
    };
    const result = insertDisciplineSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('deve rejeitar disciplina sem userId', () => {
    const invalidData = {
      name: 'Cálculo I',
    };
    const result = insertDisciplineSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Schema de Tarefa', () => {
  it('deve validar tarefa com dados obrigatórios', () => {
    const validData = {
      userId: 'user-123',
      title: 'Estudar para prova',
    };
    const result = insertTaskSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve validar tarefa com todos os campos', () => {
    const validData = {
      userId: 'user-123',
      disciplineId: 1,
      title: 'Estudar para prova',
      description: 'Revisar capítulos 1-5',
      priority: 'high',
      status: 'todo',
      dueDate: '2024-12-20',
    };
    const result = insertTaskSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve aceitar prioridades válidas', () => {
    const priorities = ['high', 'medium', 'low'];
    priorities.forEach((priority) => {
      const data = { userId: 'user-123', title: 'Task', priority };
      const result = insertTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('deve aceitar status válidos', () => {
    const statuses = ['todo', 'in_progress', 'completed'];
    statuses.forEach((status) => {
      const data = { userId: 'user-123', title: 'Task', status };
      const result = insertTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Schema de Lembrete', () => {
  it('deve validar lembrete com dados obrigatórios', () => {
    const validData = {
      userId: 'user-123',
      title: 'Prova de Cálculo',
      reminderType: 'prova',
      dueDate: '2024-12-20',
    };
    const result = insertReminderSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve validar lembrete com todos os campos', () => {
    const validData = {
      userId: 'user-123',
      disciplineId: 1,
      title: 'Prova de Cálculo',
      description: 'Prova final da disciplina',
      reminderType: 'prova',
      dueDate: '2024-12-20',
      dueTime: '14:00',
      priority: 'high',
      notificationEnabled: true,
      reminderTime: 60,
      status: 'pending',
    };
    const result = insertReminderSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar lembrete sem título', () => {
    const invalidData = {
      userId: 'user-123',
      reminderType: 'prova',
      dueDate: '2024-12-20',
    };
    const result = insertReminderSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Schema de Reunião', () => {
  it('deve validar reunião com dados obrigatórios', () => {
    const validData = {
      userId: 'user-123',
      title: 'Reunião de grupo',
      meetingType: 'trabalho',
      startDate: '2024-12-20',
      startTime: '14:00',
    };
    const result = insertMeetingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve validar reunião com participantes', () => {
    const validData = {
      userId: 'user-123',
      title: 'Reunião de grupo',
      meetingType: 'trabalho',
      startDate: '2024-12-20',
      startTime: '14:00',
      participants: ['joao@ufu.br', 'maria@ufu.br'],
    };
    const result = insertMeetingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve aceitar tipos de reunião válidos', () => {
    const types = ['trabalho', 'disciplina', 'estudo', 'outro'];
    types.forEach((meetingType) => {
      const data = {
        userId: 'user-123',
        title: 'Reunião',
        meetingType,
        startDate: '2024-12-20',
        startTime: '14:00',
      };
      const result = insertMeetingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

describe('Schema de Frequência', () => {
  it('deve validar frequência com dados obrigatórios', () => {
    const validData = {
      userId: 'user-123',
      disciplineId: 1,
      attendanceDate: '2024-12-17',
      status: 'present',
    };
    const result = insertAttendanceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve validar frequência com justificativa', () => {
    const validData = {
      userId: 'user-123',
      disciplineId: 1,
      attendanceDate: '2024-12-17',
      status: 'justified',
      justification: 'Atestado médico',
    };
    const result = insertAttendanceSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('deve aceitar status de frequência válidos', () => {
    const statuses = ['present', 'absent', 'justified'];
    statuses.forEach((status) => {
      const data = {
        userId: 'user-123',
        disciplineId: 1,
        attendanceDate: '2024-12-17',
        status,
      };
      const result = insertAttendanceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('deve rejeitar frequência sem disciplineId', () => {
    const invalidData = {
      userId: 'user-123',
      attendanceDate: '2024-12-17',
      status: 'present',
    };
    const result = insertAttendanceSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
