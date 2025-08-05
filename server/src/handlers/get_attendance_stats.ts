
import { db } from '../db';
import { studentsTable, attendanceTable, classesTable } from '../db/schema';
import { type AttendanceStats } from '../schema';
import { eq, and, count, sql } from 'drizzle-orm';

export async function getAttendanceStats(classId?: number): Promise<AttendanceStats> {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Get total students count
    const totalStudentsResult = classId 
      ? await db.select({ count: count() })
          .from(studentsTable)
          .where(eq(studentsTable.class_id, classId))
          .execute()
      : await db.select({ count: count() })
          .from(studentsTable)
          .execute();

    const total_students = totalStudentsResult[0]?.count || 0;

    // If no students, return empty stats
    if (total_students === 0) {
      return {
        total_students: 0,
        present_today: 0,
        sick_today: 0,
        excused_today: 0,
        absent_today: 0,
        attendance_rate: 0
      };
    }

    // Get today's attendance stats
    const attendanceResults = classId
      ? await db.select({
          status: attendanceTable.status,
          count: count()
        })
        .from(attendanceTable)
        .where(
          and(
            eq(attendanceTable.date, today),
            eq(attendanceTable.class_id, classId)
          )
        )
        .groupBy(attendanceTable.status)
        .execute()
      : await db.select({
          status: attendanceTable.status,
          count: count()
        })
        .from(attendanceTable)
        .where(eq(attendanceTable.date, today))
        .groupBy(attendanceTable.status)
        .execute();

    // Initialize counters
    let present_today = 0;
    let sick_today = 0;
    let excused_today = 0;
    let absent_today = 0;

    // Process attendance results
    for (const result of attendanceResults) {
      const statusCount = result.count;
      switch (result.status) {
        case 'Hadir':
          present_today = statusCount;
          break;
        case 'Sakit':
          sick_today = statusCount;
          break;
        case 'Izin':
          excused_today = statusCount;
          break;
        case 'Alfa':
          absent_today = statusCount;
          break;
      }
    }

    // Calculate attendance rate
    const total_recorded_today = present_today + sick_today + excused_today + absent_today;
    const attendance_rate = total_recorded_today > 0 
      ? Math.round((present_today / total_recorded_today) * 100 * 100) / 100 // Round to 2 decimal places
      : 0;

    return {
      total_students,
      present_today,
      sick_today,
      excused_today,
      absent_today,
      attendance_rate
    };
  } catch (error) {
    console.error('Get attendance stats failed:', error);
    throw error;
  }
}
