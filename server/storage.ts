import { type User, type Discipline, type Event, type Task, type StudyGoal, type Reminder, type Meeting, type Attendance } from "@shared/schema";
import { users, disciplines, events, tasks, studyGoals, reminders, meetings, attendances } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(data: Partial<User>): Promise<User> {
    const hashedPassword = data.password 
      ? await bcrypt.hash(data.password, 10)
      : await bcrypt.hash("", 10);
    
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      email: data.email?.toLowerCase() || "",
      password: hashedPassword,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      profileImageUrl: data.profileImageUrl ?? null,
    }).returning();
    
    return user;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Disciplines
  async getDisciplines(userId: string): Promise<Discipline[]> {
    return db.select().from(disciplines).where(eq(disciplines.userId, userId));
  }

  async createDiscipline(data: Partial<Discipline>): Promise<Discipline> {
    const [discipline] = await db.insert(disciplines).values({
      userId: data.userId || "",
      name: data.name || "",
      code: data.code ?? null,
      professor: data.professor ?? null,
      semester: data.semester ?? null,
      color: data.color || "#3B82F6",
    }).returning();
    return discipline;
  }

  async updateDiscipline(id: number, data: Partial<Discipline>): Promise<Discipline> {
    const [discipline] = await db.update(disciplines)
      .set(data)
      .where(eq(disciplines.id, id))
      .returning();
    if (!discipline) throw new Error("Not found");
    return discipline;
  }

  async deleteDiscipline(id: number): Promise<void> {
    await db.delete(disciplines).where(eq(disciplines.id, id));
  }

  // Events
  async getEvents(userId: string): Promise<Event[]> {
    return db.select().from(events).where(eq(events.userId, userId));
  }

  async createEvent(data: Partial<Event>): Promise<Event> {
    const [event] = await db.insert(events).values({
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
    }).returning();
    return event;
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const [event] = await db.update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    if (!event) throw new Error("Not found");
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Tasks
  async getTasks(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    const [task] = await db.insert(tasks).values({
      userId: data.userId || "",
      disciplineId: data.disciplineId ?? null,
      title: data.title || "",
      description: data.description ?? null,
      priority: data.priority || "medium",
      status: data.status || "todo",
      dueDate: data.dueDate ?? null,
      completedAt: data.completedAt ?? null,
    }).returning();
    return task;
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    const [task] = await db.update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();
    if (!task) throw new Error("Not found");
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Goals
  async getGoals(userId: string): Promise<StudyGoal[]> {
    return db.select().from(studyGoals).where(eq(studyGoals.userId, userId));
  }

  async createGoal(data: Partial<StudyGoal>): Promise<StudyGoal> {
    const [goal] = await db.insert(studyGoals).values({
      userId: data.userId || "",
      title: data.title || "",
      targetHours: data.targetHours || 0,
      periodType: data.periodType || "weekly",
      currentHours: data.currentHours || 0,
    }).returning();
    return goal;
  }

  async updateGoal(id: number, data: Partial<StudyGoal>): Promise<StudyGoal> {
    const [goal] = await db.update(studyGoals)
      .set(data)
      .where(eq(studyGoals.id, id))
      .returning();
    if (!goal) throw new Error("Not found");
    return goal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(studyGoals).where(eq(studyGoals.id, id));
  }

  // Reminders
  async getReminders(userId: string): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async createReminder(data: Partial<Reminder>): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values({
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
    }).returning();
    return reminder;
  }

  async updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder> {
    const [reminder] = await db.update(reminders)
      .set(data)
      .where(eq(reminders.id, id))
      .returning();
    if (!reminder) throw new Error("Not found");
    return reminder;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  // Meetings
  async getMeetings(userId: string): Promise<Meeting[]> {
    return db.select().from(meetings).where(eq(meetings.userId, userId));
  }

  async createMeeting(data: Partial<Meeting>): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values({
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
      isCancelled: data.isCancelled || false,
      cancellationReason: data.cancellationReason ?? null,
    }).returning();
    return meeting;
  }

  async updateMeeting(id: number, data: Partial<Meeting>): Promise<Meeting> {
    const [meeting] = await db.update(meetings)
      .set(data)
      .where(eq(meetings.id, id))
      .returning();
    if (!meeting) throw new Error("Not found");
    return meeting;
  }

  async deleteMeeting(id: number): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // Attendances
  async getAttendances(userId: string, disciplineId?: number): Promise<Attendance[]> {
    if (disciplineId) {
      return db.select().from(attendances).where(
        and(eq(attendances.userId, userId), eq(attendances.disciplineId, disciplineId))
      );
    }
    return db.select().from(attendances).where(eq(attendances.userId, userId));
  }

  async createAttendance(data: Partial<Attendance>): Promise<Attendance> {
    const [attendance] = await db.insert(attendances).values({
      userId: data.userId || "",
      disciplineId: data.disciplineId || 0,
      meetingId: data.meetingId ?? null,
      attendanceDate: data.attendanceDate || new Date().toISOString().split("T")[0],
      status: data.status || "present",
      justification: data.justification ?? null,
    }).returning();
    return attendance;
  }

  async updateAttendance(id: number, data: Partial<Attendance>): Promise<Attendance> {
    const [attendance] = await db.update(attendances)
      .set(data)
      .where(eq(attendances.id, id))
      .returning();
    if (!attendance) throw new Error("Not found");
    return attendance;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendances).where(eq(attendances.id, id));
  }

  async getAttendanceStats(userId: string, disciplineId: number) {
    const attendanceList = await this.getAttendances(userId, disciplineId);
    const total = attendanceList.length;
    const present = attendanceList.filter(a => a.status === "present").length;
    const absent = attendanceList.filter(a => a.status === "absent").length;
    const justified = attendanceList.filter(a => a.status === "justified").length;
    const attendance_rate = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;
    
    return { total, present, absent, justified, attendance_rate };
  }
}

// Exportar instância do DatabaseStorage em vez de MemStorage
export const storage = new DatabaseStorage();
