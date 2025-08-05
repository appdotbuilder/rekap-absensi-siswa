
import { serial, text, pgTable, timestamp, integer, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['siswa', 'guru']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['Hadir', 'Sakit', 'Izin', 'Alfa']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Students table (junction between users and classes)
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  student_number: text('student_number').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Attendance table
export const attendanceTable = pgTable('attendance', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').notNull(),
  recorded_by: integer('recorded_by').notNull().references(() => usersTable.id),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  students: many(studentsTable),
  recorded_attendance: many(attendanceTable, { relationName: 'recorder' }),
}));

export const classesRelations = relations(classesTable, ({ many }) => ({
  students: many(studentsTable),
  attendance: many(attendanceTable),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentsTable.user_id],
    references: [usersTable.id],
  }),
  class: one(classesTable, {
    fields: [studentsTable.class_id],
    references: [classesTable.id],
  }),
  attendance: many(attendanceTable),
}));

export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [attendanceTable.student_id],
    references: [studentsTable.id],
  }),
  class: one(classesTable, {
    fields: [attendanceTable.class_id],
    references: [classesTable.id],
  }),
  recorder: one(usersTable, {
    fields: [attendanceTable.recorded_by],
    references: [usersTable.id],
    relationName: 'recorder',
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;
export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;
export type Attendance = typeof attendanceTable.$inferSelect;
export type NewAttendance = typeof attendanceTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  classes: classesTable,
  students: studentsTable,
  attendance: attendanceTable,
};
