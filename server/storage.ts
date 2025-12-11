import { type User, type Discipline, type Event, type Task, type StudyGoal, type Reminder, type Meeting, type Attendance } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  validatePassword(email: string, password: string): Promise<User | null>;
  
  // Disciplines
  getDisciplines(userId: string): Promise<Discipline[]>;
  createDiscipline(discipline: Partial<Discipline>): Promise<Discipline>;
  updateDiscipline(id: number, data: Partial<Discipline>): Promise<Discipline>;
  deleteDiscipline(id: number): Promise<void>;
  
  // Events
  getEvents(userId: string): Promise<Event[]>;
  createEvent(event: Partial<Event>): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  
  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(task: Partial<Task>): Promise<Task>;
  updateTask(id: number, data: Partial<Task>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  
  // Study Goals
  getGoals(userId: string): Promise<StudyGoal[]>;
  createGoal(goal: Partial<StudyGoal>): Promise<StudyGoal>;
  updateGoal(id: number, data: Partial<StudyGoal>): Promise<StudyGoal>;
  deleteGoal(id: number): Promise<void>;

  // Reminders
  getReminders(userId: string): Promise<Reminder[]>;
  createReminder(reminder: Partial<Reminder>): Promise<Reminder>;
  updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder>;
  deleteReminder(id: number): Promise<void>;

  // Meetings
  getMeetings(userId: string): Promise<Meeting[]>;
  createMeeting(meeting: Partial<Meeting>): Promise<Meeting>;
  updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting>;
  deleteMeeting(id: number): Promise<void>;

  // Attendances
  getAttendances(userId: string, disciplineId?: number): Promise<Attendance[]>;
  createAttendance(attendance: Partial<Attendance>): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<Attendance>): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;
  getAttendanceStats(userId: string, disciplineId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private disciplines: Map<number, Discipline> = new Map();
  private events: Map<number, Event> = new Map();
  private tasks: Map<number, Task> = new Map();
  private goals: Map<number, StudyGoal> = new Map();
  private reminders: Map<number, Reminder> = new Map();
  private meetings: Map<number, Meeting> = new Map();  private attendances: Map<number, Attendance> = new Map();  private nextDisciplineId = 1;
  private nextEventId = 1;
  private nextTaskId = 1;
  private nextGoalId = 1;
  private nextReminderId = 1;
  private nextMeetingId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email.toLowerCase());
  }

  async createUser(data: Partial<User>): Promise<User> {
    const hashedPassword = data.password 
      ? await bcrypt.hash(data.password, 10)
      : await bcrypt.hash("", 10);
    const user: User = {
      id: randomUUID(),
      email: data.email || "",
      password: hashedPassword,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      profileImageUrl: data.profileImageUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getDisciplines(userId: string): Promise<Discipline[]> {
    return Array.from(this.disciplines.values()).filter((d) => d.userId === userId);
  }

  async createDiscipline(data: Partial<Discipline>): Promise<Discipline> {
    const discipline: Discipline = {
      id: this.nextDisciplineId++,
      userId: data.userId || "",
      name: data.name || "",
      code: data.code ?? null,
      professor: data.professor ?? null,
      semester: data.semester ?? null,
      color: data.color || "#3B82F6",
      createdAt: new Date(),
    };
    this.disciplines.set(discipline.id, discipline);
    return discipline;
  }

  async updateDiscipline(id: number, data: Partial<Discipline>): Promise<Discipline> {
    const discipline = this.disciplines.get(id);
    if (!discipline) throw new Error("Not found");
    const updated = { ...discipline, ...data };
    this.disciplines.set(id, updated);
    return updated;
  }

  async deleteDiscipline(id: number): Promise<void> {
    this.disciplines.delete(id);
  }

  async getEvents(userId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter((e) => e.userId === userId);
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    const event: Event = {
      id: this.nextEventId++,
      userId: data.userId || "",
      disciplineId: data.disciplineId ?? null,
      title: data.title || "",
      description: data.description ?? null,
      eventType: data.eventType || "aula",
      startDate: data.startDate || "",
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      location: data.location ?? null,
      isRecurring: data.isRecurring || false,
      recurrencePattern: data.recurrencePattern ?? null,
      recurrenceDays: data.recurrenceDays ?? null,
      recurrenceEndDate: data.recurrenceEndDate ?? null,
      createdAt: new Date(),
    };
    this.events.set(event.id, event);
    return event;
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error("Not found");
    const updated = { ...event, ...data };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
  }

  async getTasks(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter((t) => t.userId === userId);
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: this.nextTaskId++,
      userId: data.userId || "",
      disciplineId: data.disciplineId ?? null,
      title: data.title || "",
      description: data.description ?? null,
      priority: data.priority || "medium",
      status: data.status || "todo",
      dueDate: data.dueDate ?? null,
      completedAt: data.completedAt ?? null,
      createdAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Not found");
    const updated = { ...task, ...data };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    this.tasks.delete(id);
  }

  async getGoals(userId: string): Promise<StudyGoal[]> {
    return Array.from(this.goals.values()).filter((g) => g.userId === userId);
  }

  async createGoal(data: Partial<StudyGoal>): Promise<StudyGoal> {
    const goal: StudyGoal = {
      id: this.nextGoalId++,
      userId: data.userId || "",
      title: data.title || "",
      targetHours: data.targetHours || 0,
      periodType: data.periodType || "weekly",
      currentHours: data.currentHours || 0,
      createdAt: new Date(),
    };
    this.goals.set(goal.id, goal);
    return goal;
  }

  async updateGoal(id: number, data: Partial<StudyGoal>): Promise<StudyGoal> {
    const goal = this.goals.get(id);
    if (!goal) throw new Error("Not found");
    const updated = { ...goal, ...data };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: number): Promise<void> {
    this.goals.delete(id);
  }

  // Reminders
  async getReminders(userId: string): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter((r) => r.userId === userId);
  }

  async createReminder(data: Partial<Reminder>): Promise<Reminder> {
    const reminder: Reminder = {
      id: this.nextReminderId++,
      userId: data.userId || "",
      disciplineId: data.disciplineId ?? null,
      title: data.title || "",
      description: data.description ?? null,
      reminderType: data.reminderType || "prazo",
      dueDate: data.dueDate || "",
      dueTime: data.dueTime ?? null,
      priority: data.priority || "medium",
      notificationEnabled: data.notificationEnabled ?? true,
      reminderTime: data.reminderTime ?? null,
      status: data.status || "pending",
      completedAt: data.completedAt ?? null,
      createdAt: new Date(),
    };
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder> {
    const reminder = this.reminders.get(id);
    if (!reminder) throw new Error("Not found");
    const updated = { ...reminder, ...data };
    this.reminders.set(id, updated);
    return updated;
  }

  async deleteReminder(id: number): Promise<void> {
    this.reminders.delete(id);
  }

  // Meetings
  async getMeetings(userId: string): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter((m) => m.userId === userId);
  }

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    const meeting: Meeting = {
      id: this.nextMeetingId++,
      userId: data.userId || "",
      disciplineId: data.disciplineId ?? null,
      title: data.title || "",
      description: data.description ?? null,
      meetingType: data.meetingType || "outro",
      startDate: data.startDate || "",
      startTime: data.startTime || "",
      endTime: data.endTime ?? null,
      location: data.location ?? null,
      participants: data.participants ?? null,
      isRecurring: data.isRecurring || false,
      recurrencePattern: data.recurrencePattern ?? null,
      recurrenceDays: data.recurrenceDays ?? null,
      recurrenceEndDate: data.recurrenceEndDate ?? null,
      videoCallUrl: data.videoCallUrl ?? null,
      notesUrl: data.notesUrl ?? null,
      status: data.status || "scheduled",
      createdAt: new Date(),
    };
    this.meetings.set(meeting.id, meeting);
    return meeting;
  }

  async updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting> {
    const meeting = this.meetings.get(id);
    if (!meeting) throw new Error("Not found");
    const updated = { ...meeting, ...data };
    this.meetings.set(id, updated);
    return updated;
  }

  async deleteMeeting(id: number): Promise<void> {
    this.meetings.delete(id);
  }

  // Attendances
  async getAttendances(userId: string, disciplineId?: number): Promise<Attendance[]> {
    const attendances = Array.from(this.attendances.values()).filter(
      a => a.userId === userId && (!disciplineId || a.disciplineId === disciplineId)
    );
    return attendances;
  }

  async createAttendance(attendance: Partial<Attendance>): Promise<Attendance> {
    const id = this.nextId++;
    const newAttendance: Attendance = {
      id,
      userId: attendance.userId || "",
      disciplineId: attendance.disciplineId || 0,
      meetingId: attendance.meetingId,
      attendanceDate: attendance.attendanceDate || new Date().toISOString().split("T")[0],
      status: attendance.status as "present" | "absent" | "justified" || "present",
      justification: attendance.justification,
      createdAt: new Date().toISOString(),
    };
    this.attendances.set(id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, data: Partial<Attendance>): Promise<Attendance> {
    const attendance = this.attendances.get(id);
    if (!attendance) throw new Error("Not found");
    const updated = { ...attendance, ...data };
    this.attendances.set(id, updated);
    return updated;
  }

  async deleteAttendance(id: number): Promise<void> {
    this.attendances.delete(id);
  }

  async getAttendanceStats(userId: string, disciplineId: number) {
    const attendances = await this.getAttendances(userId, disciplineId);
    const total = attendances.length;
    const present = attendances.filter(a => a.status === "present").length;
    const absent = attendances.filter(a => a.status === "absent").length;
    const justified = attendances.filter(a => a.status === "justified").length;
    const attendance_rate = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;
    
    return { total, present, absent, justified, attendance_rate };
  }
}

export const storage = new MemStorage();
