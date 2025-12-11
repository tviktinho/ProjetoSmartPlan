import { sql } from 'drizzle-orm';
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disciplines/Subjects table
export const disciplines = pgTable("disciplines", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  professor: varchar("professor", { length: 255 }),
  semester: varchar("semester", { length: 50 }),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Events table (aulas, provas, apresentações, etc.)
export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  disciplineId: integer("discipline_id").references(() => disciplines.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'aula', 'prova', 'apresentacao', 'monitoria', 'outro'
  startDate: date("start_date").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  location: varchar("location", { length: 255 }),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern", { length: 50 }), // 'daily', 'weekly', 'monthly'
  recurrenceDays: text("recurrence_days").array(), // ['monday', 'wednesday'] for weekly
  recurrenceEndDate: date("recurrence_end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  disciplineId: integer("discipline_id").references(() => disciplines.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // 'high', 'medium', 'low'
  status: varchar("status", { length: 20 }).notNull().default("todo"), // 'todo', 'in_progress', 'completed'
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study goals table
export const studyGoals = pgTable("study_goals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  targetHours: integer("target_hours").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // 'weekly', 'monthly'
  currentHours: integer("current_hours").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reminders table (lembretes de provas, trabalhos, etc)
export const reminders = pgTable("reminders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  disciplineId: integer("discipline_id").references(() => disciplines.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(), // 'prova', 'trabalho', 'apresentacao', 'prazo'
  dueDate: date("due_date").notNull(),
  dueTime: time("due_time"),
  priority: varchar("priority", { length: 20 }).default("medium"), // 'high', 'medium', 'low'
  notificationEnabled: boolean("notification_enabled").default(true),
  reminderTime: integer("reminder_time"), // minutos antes do evento
  status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'completed', 'cancelled'
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meetings table (reuniões de trabalho, disciplina, etc)
export const meetings = pgTable("meetings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  disciplineId: integer("discipline_id").references(() => disciplines.id, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  meetingType: varchar("meeting_type", { length: 50 }).notNull(), // 'trabalho', 'disciplina', 'estudo', 'outro'
  startDate: date("start_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  location: varchar("location", { length: 255 }),
  participants: text("participants").array(), // emails ou nomes dos participantes
  isRecurring: boolean("is_recurring").default(false),
  recurrencePattern: varchar("recurrence_pattern", { length: 50 }), // 'daily', 'weekly', 'monthly'
  recurrenceDays: text("recurrence_days").array(), // ['monday', 'wednesday']
  recurrenceEndDate: date("recurrence_end_date"),
  videoCallUrl: varchar("video_call_url"),
  notesUrl: varchar("notes_url"),
  status: varchar("status", { length: 20 }).default("scheduled"), // 'scheduled', 'ongoing', 'completed', 'cancelled'
  isCancelled: boolean("is_cancelled").default(false),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance/Absences table (faltas em aulas)
export const attendances = pgTable("attendances", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: "cascade" }),
  meetingId: integer("meeting_id").references(() => meetings.id, { onDelete: "set null" }),
  attendanceDate: date("attendance_date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'present', 'absent', 'justified'
  justification: text("justification"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  disciplines: many(disciplines),
  events: many(events),
  tasks: many(tasks),
  studyGoals: many(studyGoals),
  reminders: many(reminders),
  meetings: many(meetings),
  attendances: many(attendances),
}));

export const disciplinesRelations = relations(disciplines, ({ one, many }) => ({
  user: one(users, {
    fields: [disciplines.userId],
    references: [users.id],
  }),
  events: many(events),
  tasks: many(tasks),
  attendances: many(attendances),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
  discipline: one(disciplines, {
    fields: [events.disciplineId],
    references: [disciplines.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  discipline: one(disciplines, {
    fields: [tasks.disciplineId],
    references: [disciplines.id],
  }),
}));

export const studyGoalsRelations = relations(studyGoals, ({ one }) => ({
  user: one(users, {
    fields: [studyGoals.userId],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  discipline: one(disciplines, {
    fields: [reminders.disciplineId],
    references: [disciplines.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  user: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
  discipline: one(disciplines, {
    fields: [meetings.disciplineId],
    references: [disciplines.id],
  }),
  attendances: many(attendances),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  user: one(users, {
    fields: [attendances.userId],
    references: [users.id],
  }),
  discipline: one(disciplines, {
    fields: [attendances.disciplineId],
    references: [disciplines.id],
  }),
  meeting: one(meetings, {
    fields: [attendances.meetingId],
    references: [meetings.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertDisciplineSchema = createInsertSchema(disciplines).omit({
  id: true,
  createdAt: true,
});
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export const insertStudyGoalSchema = createInsertSchema(studyGoals).omit({
  id: true,
  createdAt: true,
});
export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});
export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
});
export const insertAttendanceSchema = createInsertSchema(attendances).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type Discipline = typeof disciplines.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertStudyGoal = z.infer<typeof insertStudyGoalSchema>;
export type StudyGoal = typeof studyGoals.$inferSelect;

export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof reminders.$inferSelect;

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendances.$inferSelect;
