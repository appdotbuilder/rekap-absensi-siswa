
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendanceTable } from '../db/schema';
import { type GetAttendanceReportInput, type StudentAttendanceReport } from '../schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getAttendanceReport(input: GetAttendanceReportInput): Promise<StudentAttendanceReport[]> {
  try {
    // Build conditions array first
    const conditions: SQL<unknown>[] = [];

    if (input.class_id !== undefined) {
      conditions.push(eq(studentsTable.class_id, input.class_id));
    }

    if (input.student_id !== undefined) {
      conditions.push(eq(studentsTable.id, input.student_id));
    }

    if (input.start_date !== undefined) {
      conditions.push(gte(attendanceTable.date, input.start_date));
    }

    if (input.end_date !== undefined) {
      conditions.push(lte(attendanceTable.date, input.end_date));
    }

    // Build query with conditional where clause
    const query = db.select({
      student_id: studentsTable.id,
      student_name: usersTable.name,
      student_number: studentsTable.student_number,
      class_name: classesTable.name,
      attendance_date: attendanceTable.date,
      attendance_status: attendanceTable.status
    })
    .from(studentsTable)
    .innerJoin(usersTable, eq(studentsTable.user_id, usersTable.id))
    .innerJoin(classesTable, eq(studentsTable.class_id, classesTable.id))
    .leftJoin(attendanceTable, eq(attendanceTable.student_id, studentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.name), desc(attendanceTable.date));

    const results = await query.execute();

    // Group results by student to calculate attendance statistics
    const studentMap = new Map<number, {
      student_id: number;
      student_name: string;
      student_number: string;
      class_name: string;
      attendance_records: Array<{ date: string; status: string }>;
    }>();

    // Process results and group by student
    for (const result of results) {
      const studentId = result.student_id;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: result.student_id,
          student_name: result.student_name,
          student_number: result.student_number,
          class_name: result.class_name,
          attendance_records: []
        });
      }

      const student = studentMap.get(studentId)!;
      
      // Only add attendance records that exist (not null from left join)
      if (result.attendance_date && result.attendance_status) {
        student.attendance_records.push({
          date: result.attendance_date,
          status: result.attendance_status
        });
      }
    }

    // Calculate statistics for each student
    const reports: StudentAttendanceReport[] = [];

    for (const student of studentMap.values()) {
      const totalDays = student.attendance_records.length;
      const presentDays = student.attendance_records.filter(r => r.status === 'Hadir').length;
      const sickDays = student.attendance_records.filter(r => r.status === 'Sakit').length;
      const excusedDays = student.attendance_records.filter(r => r.status === 'Izin').length;
      const absentDays = student.attendance_records.filter(r => r.status === 'Alfa').length;
      
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      reports.push({
        student_id: student.student_id,
        student_name: student.student_name,
        student_number: student.student_number,
        class_name: student.class_name,
        total_days: totalDays,
        present_days: presentDays,
        sick_days: sickDays,
        excused_days: excusedDays,
        absent_days: absentDays,
        attendance_rate: Math.round(attendanceRate * 100) / 100 // Round to 2 decimal places
      });
    }

    // Sort reports by student name for consistent output
    return reports.sort((a, b) => a.student_name.localeCompare(b.student_name));

  } catch (error) {
    console.error('Attendance report generation failed:', error);
    throw error;
  }
}
