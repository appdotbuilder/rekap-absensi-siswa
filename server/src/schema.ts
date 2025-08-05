
import { z } from 'zod';

// Enum for attendance status
export const attendanceStatusEnum = z.enum(['Hadir', 'Sakit', 'Izin', 'Alfa']);
export type AttendanceStatus = z.infer<typeof attendanceStatusEnum>;

// User role enum
export const userRoleEnum = z.enum(['siswa', 'guru']);
export type UserRole = z.infer<typeof userRoleEnum>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleEnum,
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  grade: z.string(),
  created_at: z.coerce.date()
});

export type Class = z.infer<typeof classSchema>;

// Student schema (users who are enrolled in classes)
export const studentSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  class_id: z.number(),
  student_number: z.string(),
  created_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Attendance record schema
export const attendanceSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  class_id: z.number(),
  date: z.coerce.date(),
  status: attendanceStatusEnum,
  recorded_by: z.number(), // user_id of who recorded the attendance
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Attendance = z.infer<typeof attendanceSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createClassInputSchema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1)
});

export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const enrollStudentInputSchema = z.object({
  user_id: z.number(),
  class_id: z.number(),
  student_number: z.string().min(1)
});

export type EnrollStudentInput = z.infer<typeof enrollStudentInputSchema>;

export const recordAttendanceInputSchema = z.object({
  student_id: z.number(),
  class_id: z.number(),
  date: z.string().date(), // YYYY-MM-DD format
  status: attendanceStatusEnum,
  recorded_by: z.number(),
  notes: z.string().nullable().optional()
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceInputSchema>;

export const bulkRecordAttendanceInputSchema = z.object({
  class_id: z.number(),
  date: z.string().date(),
  recorded_by: z.number(),
  attendance_records: z.array(z.object({
    student_id: z.number(),
    status: attendanceStatusEnum,
    notes: z.string().nullable().optional()
  }))
});

export type BulkRecordAttendanceInput = z.infer<typeof bulkRecordAttendanceInputSchema>;

export const getAttendanceReportInputSchema = z.object({
  class_id: z.number().optional(),
  student_id: z.number().optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional()
});

export type GetAttendanceReportInput = z.infer<typeof getAttendanceReportInputSchema>;

// Output schemas for dashboard
export const attendanceStatsSchema = z.object({
  total_students: z.number(),
  present_today: z.number(),
  sick_today: z.number(),
  excused_today: z.number(),
  absent_today: z.number(),
  attendance_rate: z.number()
});

export type AttendanceStats = z.infer<typeof attendanceStatsSchema>;

export const studentAttendanceReportSchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  student_number: z.string(),
  class_name: z.string(),
  total_days: z.number(),
  present_days: z.number(),
  sick_days: z.number(),
  excused_days: z.number(),
  absent_days: z.number(),
  attendance_rate: z.number()
});

export type StudentAttendanceReport = z.infer<typeof studentAttendanceReportSchema>;
