
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendanceTable } from '../db/schema';
import { getAttendanceStats } from '../handlers/get_attendance_stats';

describe('getAttendanceStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats when no students exist', async () => {
    const result = await getAttendanceStats();

    expect(result.total_students).toEqual(0);
    expect(result.present_today).toEqual(0);
    expect(result.sick_today).toEqual(0);
    expect(result.excused_today).toEqual(0);
    expect(result.absent_today).toEqual(0);
    expect(result.attendance_rate).toEqual(0);
  });

  it('should calculate stats for all classes when no classId provided', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create test data
    const [user1, user2, user3] = await db.insert(usersTable)
      .values([
        { name: 'Student 1', email: 'student1@test.com', role: 'siswa' },
        { name: 'Student 2', email: 'student2@test.com', role: 'siswa' },
        { name: 'Teacher', email: 'teacher@test.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const [class1, class2] = await db.insert(classesTable)
      .values([
        { name: 'Class A', grade: '10' },
        { name: 'Class B', grade: '11' }
      ])
      .returning()
      .execute();

    const [student1, student2] = await db.insert(studentsTable)
      .values([
        { user_id: user1.id, class_id: class1.id, student_number: '001' },
        { user_id: user2.id, class_id: class2.id, student_number: '002' }
      ])
      .returning()
      .execute();

    // Create attendance records for today
    await db.insert(attendanceTable)
      .values([
        {
          student_id: student1.id,
          class_id: class1.id,
          date: today,
          status: 'Hadir',
          recorded_by: user3.id
        },
        {
          student_id: student2.id,
          class_id: class2.id,
          date: today,
          status: 'Sakit',
          recorded_by: user3.id
        }
      ])
      .execute();

    const result = await getAttendanceStats();

    expect(result.total_students).toEqual(2);
    expect(result.present_today).toEqual(1);
    expect(result.sick_today).toEqual(1);
    expect(result.excused_today).toEqual(0);
    expect(result.absent_today).toEqual(0);
    expect(result.attendance_rate).toEqual(50); // 1 present out of 2 total
  });

  it('should calculate stats for specific class when classId provided', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create test data
    const [user1, user2, user3] = await db.insert(usersTable)
      .values([
        { name: 'Student 1', email: 'student1@test.com', role: 'siswa' },
        { name: 'Student 2', email: 'student2@test.com', role: 'siswa' },
        { name: 'Teacher', email: 'teacher@test.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const [class1, class2] = await db.insert(classesTable)
      .values([
        { name: 'Class A', grade: '10' },
        { name: 'Class B', grade: '11' }
      ])
      .returning()
      .execute();

    const [student1, student2] = await db.insert(studentsTable)
      .values([
        { user_id: user1.id, class_id: class1.id, student_number: '001' },
        { user_id: user2.id, class_id: class2.id, student_number: '002' }
      ])
      .returning()
      .execute();

    // Create attendance records for today
    await db.insert(attendanceTable)
      .values([
        {
          student_id: student1.id,
          class_id: class1.id,
          date: today,
          status: 'Hadir',
          recorded_by: user3.id
        },
        {
          student_id: student2.id,
          class_id: class2.id,
          date: today,
          status: 'Sakit',
          recorded_by: user3.id
        }
      ])
      .execute();

    const result = await getAttendanceStats(class1.id);

    expect(result.total_students).toEqual(1); // Only 1 student in class1
    expect(result.present_today).toEqual(1);
    expect(result.sick_today).toEqual(0);
    expect(result.excused_today).toEqual(0);
    expect(result.absent_today).toEqual(0);
    expect(result.attendance_rate).toEqual(100); // 1 present out of 1 total
  });

  it('should handle all attendance status types correctly', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Create test data
    const [user1, user2, user3, user4, teacher] = await db.insert(usersTable)
      .values([
        { name: 'Student 1', email: 'student1@test.com', role: 'siswa' },
        { name: 'Student 2', email: 'student2@test.com', role: 'siswa' },
        { name: 'Student 3', email: 'student3@test.com', role: 'siswa' },
        { name: 'Student 4', email: 'student4@test.com', role: 'siswa' },
        { name: 'Teacher', email: 'teacher@test.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const [class1] = await db.insert(classesTable)
      .values([{ name: 'Class A', grade: '10' }])
      .returning()
      .execute();

    const [student1, student2, student3, student4] = await db.insert(studentsTable)
      .values([
        { user_id: user1.id, class_id: class1.id, student_number: '001' },
        { user_id: user2.id, class_id: class1.id, student_number: '002' },
        { user_id: user3.id, class_id: class1.id, student_number: '003' },
        { user_id: user4.id, class_id: class1.id, student_number: '004' }
      ])
      .returning()
      .execute();

    // Create attendance records with all status types
    await db.insert(attendanceTable)
      .values([
        {
          student_id: student1.id,
          class_id: class1.id,
          date: today,
          status: 'Hadir',
          recorded_by: teacher.id
        },
        {
          student_id: student2.id,
          class_id: class1.id,
          date: today,
          status: 'Sakit',
          recorded_by: teacher.id
        },
        {
          student_id: student3.id,
          class_id: class1.id,
          date: today,
          status: 'Izin',
          recorded_by: teacher.id
        },
        {
          student_id: student4.id,
          class_id: class1.id,
          date: today,
          status: 'Alfa',
          recorded_by: teacher.id
        }
      ])
      .execute();

    const result = await getAttendanceStats(class1.id);

    expect(result.total_students).toEqual(4);
    expect(result.present_today).toEqual(1);
    expect(result.sick_today).toEqual(1);
    expect(result.excused_today).toEqual(1);
    expect(result.absent_today).toEqual(1);
    expect(result.attendance_rate).toEqual(25); // 1 present out of 4 total
  });

  it('should return zero attendance rate when no attendance recorded today', async () => {
    // Create test data but no attendance for today
    const [user1, user2] = await db.insert(usersTable)
      .values([
        { name: 'Student 1', email: 'student1@test.com', role: 'siswa' },
        { name: 'Teacher', email: 'teacher@test.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const [class1] = await db.insert(classesTable)
      .values([{ name: 'Class A', grade: '10' }])
      .returning()
      .execute();

    await db.insert(studentsTable)
      .values([{ user_id: user1.id, class_id: class1.id, student_number: '001' }])
      .execute();

    const result = await getAttendanceStats(class1.id);

    expect(result.total_students).toEqual(1);
    expect(result.present_today).toEqual(0);
    expect(result.sick_today).toEqual(0);
    expect(result.excused_today).toEqual(0);
    expect(result.absent_today).toEqual(0);
    expect(result.attendance_rate).toEqual(0);
  });
});
