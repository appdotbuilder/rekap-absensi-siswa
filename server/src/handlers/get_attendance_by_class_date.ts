
import { db } from '../db';
import { attendanceTable, studentsTable, usersTable } from '../db/schema';
import { type Attendance } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getAttendanceByClassDate(classId: number, date: string): Promise<Attendance[]> {
  try {
    const results = await db.select({
      id: attendanceTable.id,
      student_id: attendanceTable.student_id,
      class_id: attendanceTable.class_id,
      date: attendanceTable.date,
      status: attendanceTable.status,
      recorded_by: attendanceTable.recorded_by,
      notes: attendanceTable.notes,
      created_at: attendanceTable.created_at,
    })
    .from(attendanceTable)
    .innerJoin(studentsTable, eq(attendanceTable.student_id, studentsTable.id))
    .innerJoin(usersTable, eq(studentsTable.user_id, usersTable.id))
    .where(and(
      eq(attendanceTable.class_id, classId),
      eq(attendanceTable.date, date)
    ))
    .execute();

    return results.map(result => ({
      id: result.id,
      student_id: result.student_id,
      class_id: result.class_id,
      date: new Date(result.date), // Convert string date to Date object
      status: result.status,
      recorded_by: result.recorded_by,
      notes: result.notes,
      created_at: result.created_at,
    }));
  } catch (error) {
    console.error('Failed to get attendance by class and date:', error);
    throw error;
  }
}
