
import { db } from '../db';
import { attendanceTable, studentsTable, classesTable, usersTable } from '../db/schema';
import { type RecordAttendanceInput, type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function recordAttendance(input: RecordAttendanceInput): Promise<Attendance> {
  try {
    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error(`Student with ID ${input.student_id} not found`);
    }

    // Verify class exists
    const classRecord = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classRecord.length === 0) {
      throw new Error(`Class with ID ${input.class_id} not found`);
    }

    // Verify recorder exists
    const recorder = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recorded_by))
      .execute();

    if (recorder.length === 0) {
      throw new Error(`User with ID ${input.recorded_by} not found`);
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await db.select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.student_id, input.student_id),
          eq(attendanceTable.date, input.date)
        )
      )
      .execute();

    if (existingAttendance.length > 0) {
      throw new Error(`Attendance already recorded for student ${input.student_id} on ${input.date}`);
    }

    // Insert attendance record
    const result = await db.insert(attendanceTable)
      .values({
        student_id: input.student_id,
        class_id: input.class_id,
        date: input.date,
        status: input.status,
        recorded_by: input.recorded_by,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert date string to Date object to match schema expectation
    const attendance = result[0];
    return {
      ...attendance,
      date: new Date(attendance.date)
    };
  } catch (error) {
    console.error('Attendance recording failed:', error);
    throw error;
  }
}
