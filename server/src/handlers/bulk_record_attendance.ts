
import { db } from '../db';
import { attendanceTable, studentsTable, classesTable, usersTable } from '../db/schema';
import { type BulkRecordAttendanceInput, type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function bulkRecordAttendance(input: BulkRecordAttendanceInput): Promise<Attendance[]> {
  try {
    // Validate that the class exists
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error(`Class with id ${input.class_id} not found`);
    }

    // Validate that the recorder exists and is a teacher
    const recorder = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recorded_by))
      .execute();

    if (recorder.length === 0) {
      throw new Error(`User with id ${input.recorded_by} not found`);
    }

    if (recorder[0].role !== 'guru') {
      throw new Error('Only teachers can record attendance');
    }

    // Validate that all students exist and belong to the specified class
    const studentIds = input.attendance_records.map(record => record.student_id);
    const students = await db.select()
      .from(studentsTable)
      .where(and(
        eq(studentsTable.class_id, input.class_id)
      ))
      .execute();

    const validStudentIds = new Set(students.map(s => s.id));
    const invalidStudentIds = studentIds.filter(id => !validStudentIds.has(id));

    if (invalidStudentIds.length > 0) {
      throw new Error(`Students with ids [${invalidStudentIds.join(', ')}] not found in class ${input.class_id}`);
    }

    // Prepare attendance records for insertion
    const attendanceRecords = input.attendance_records.map(record => ({
      student_id: record.student_id,
      class_id: input.class_id,
      date: input.date,
      status: record.status,
      recorded_by: input.recorded_by,
      notes: record.notes || null
    }));

    // Insert all attendance records
    const result = await db.insert(attendanceTable)
      .values(attendanceRecords)
      .returning()
      .execute();

    return result.map(record => ({
      ...record,
      date: new Date(record.date)
    }));
  } catch (error) {
    console.error('Bulk attendance recording failed:', error);
    throw error;
  }
}
