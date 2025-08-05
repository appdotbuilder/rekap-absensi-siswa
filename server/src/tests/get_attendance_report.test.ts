
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendanceTable } from '../db/schema';
import { type GetAttendanceReportInput } from '../schema';
import { getAttendanceReport } from '../handlers/get_attendance_report';

describe('getAttendanceReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate attendance report for all students', async () => {
    // Create test users
    const teachers = await db.insert(usersTable)
      .values([
        { name: 'Teacher One', email: 'teacher1@school.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice Student', email: 'alice@school.com', role: 'siswa' },
        { name: 'Bob Student', email: 'bob@school.com', role: 'siswa' }
      ])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Kelas 10A', grade: '10' }
      ])
      .returning()
      .execute();

    // Enroll students
    const students = await db.insert(studentsTable)
      .values([
        { user_id: users[0].id, class_id: classes[0].id, student_number: 'S001' },
        { user_id: users[1].id, class_id: classes[0].id, student_number: 'S002' }
      ])
      .returning()
      .execute();

    // Create attendance records
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-16', status: 'Sakit', recorded_by: teachers[0].id },
        { student_id: students[1].id, class_id: classes[0].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[1].id, class_id: classes[0].id, date: '2024-01-16', status: 'Hadir', recorded_by: teachers[0].id }
      ])
      .execute();

    const input: GetAttendanceReportInput = {};
    const result = await getAttendanceReport(input);

    expect(result).toHaveLength(2);
    
    // Check Alice's report
    const aliceReport = result.find(r => r.student_name === 'Alice Student');
    expect(aliceReport).toBeDefined();
    expect(aliceReport!.student_number).toEqual('S001');
    expect(aliceReport!.class_name).toEqual('Kelas 10A');
    expect(aliceReport!.total_days).toEqual(2);
    expect(aliceReport!.present_days).toEqual(1);
    expect(aliceReport!.sick_days).toEqual(1);
    expect(aliceReport!.excused_days).toEqual(0);
    expect(aliceReport!.absent_days).toEqual(0);
    expect(aliceReport!.attendance_rate).toEqual(50);

    // Check Bob's report
    const bobReport = result.find(r => r.student_name === 'Bob Student');
    expect(bobReport).toBeDefined();
    expect(bobReport!.student_number).toEqual('S002');
    expect(bobReport!.total_days).toEqual(2);
    expect(bobReport!.present_days).toEqual(2);
    expect(bobReport!.attendance_rate).toEqual(100);
  });

  it('should filter by class_id', async () => {
    // Create test users
    const teachers = await db.insert(usersTable)
      .values([
        { name: 'Teacher One', email: 'teacher1@school.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice Student', email: 'alice@school.com', role: 'siswa' },
        { name: 'Bob Student', email: 'bob@school.com', role: 'siswa' }
      ])
      .returning()
      .execute();

    // Create test classes
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Kelas 10A', grade: '10' },
        { name: 'Kelas 10B', grade: '10' }
      ])
      .returning()
      .execute();

    // Enroll students in different classes
    const students = await db.insert(studentsTable)
      .values([
        { user_id: users[0].id, class_id: classes[0].id, student_number: 'S001' },
        { user_id: users[1].id, class_id: classes[1].id, student_number: 'S002' }
      ])
      .returning()
      .execute();

    // Create attendance records
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[1].id, class_id: classes[1].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id }
      ])
      .execute();

    const input: GetAttendanceReportInput = {
      class_id: classes[0].id
    };
    const result = await getAttendanceReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('Alice Student');
    expect(result[0].class_name).toEqual('Kelas 10A');
  });

  it('should filter by student_id', async () => {
    // Create test users
    const teachers = await db.insert(usersTable)
      .values([
        { name: 'Teacher One', email: 'teacher1@school.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice Student', email: 'alice@school.com', role: 'siswa' },
        { name: 'Bob Student', email: 'bob@school.com', role: 'siswa' }
      ])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Kelas 10A', grade: '10' }
      ])
      .returning()
      .execute();

    // Enroll students
    const students = await db.insert(studentsTable)
      .values([
        { user_id: users[0].id, class_id: classes[0].id, student_number: 'S001' },
        { user_id: users[1].id, class_id: classes[0].id, student_number: 'S002' }
      ])
      .returning()
      .execute();

    // Create attendance records
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[1].id, class_id: classes[0].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id }
      ])
      .execute();

    const input: GetAttendanceReportInput = {
      student_id: students[0].id
    };
    const result = await getAttendanceReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('Alice Student');
    expect(result[0].student_id).toEqual(students[0].id);
  });

  it('should filter by date range', async () => {
    // Create test users
    const teachers = await db.insert(usersTable)
      .values([
        { name: 'Teacher One', email: 'teacher1@school.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice Student', email: 'alice@school.com', role: 'siswa' }
      ])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Kelas 10A', grade: '10' }
      ])
      .returning()
      .execute();

    // Enroll student
    const students = await db.insert(studentsTable)
      .values([
        { user_id: users[0].id, class_id: classes[0].id, student_number: 'S001' }
      ])
      .returning()
      .execute();

    // Create attendance records across different dates
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-10', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'Sakit', recorded_by: teachers[0].id },
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-20', status: 'Hadir', recorded_by: teachers[0].id }
      ])
      .execute();

    const input: GetAttendanceReportInput = {
      start_date: '2024-01-12',
      end_date: '2024-01-18'
    };
    const result = await getAttendanceReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_days).toEqual(1); // Only one record in date range
    expect(result[0].sick_days).toEqual(1);
    expect(result[0].present_days).toEqual(0);
  });

  it('should handle students with no attendance records', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice Student', email: 'alice@school.com', role: 'siswa' }
      ])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Kelas 10A', grade: '10' }
      ])
      .returning()
      .execute();

    // Enroll student but don't create attendance records
    await db.insert(studentsTable)
      .values([
        { user_id: users[0].id, class_id: classes[0].id, student_number: 'S001' }
      ])
      .execute();

    const input: GetAttendanceReportInput = {};
    const result = await getAttendanceReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('Alice Student');
    expect(result[0].total_days).toEqual(0);
    expect(result[0].present_days).toEqual(0);
    expect(result[0].attendance_rate).toEqual(0);
  });

  it('should calculate attendance rate correctly', async () => {
    // Create test users
    const teachers = await db.insert(usersTable)
      .values([
        { name: 'Teacher One', email: 'teacher1@school.com', role: 'guru' }
      ])
      .returning()
      .execute();

    const users = await db.insert(usersTable)
      .values([
        { name: 'Alice Student', email: 'alice@school.com', role: 'siswa' }
      ])
      .returning()
      .execute();

    // Create test class
    const classes = await db.insert(classesTable)
      .values([
        { name: 'Kelas 10A', grade: '10' }
      ])
      .returning()
      .execute();

    // Enroll student
    const students = await db.insert(studentsTable)
      .values([
        { user_id: users[0].id, class_id: classes[0].id, student_number: 'S001' }
      ])
      .returning()
      .execute();

    // Create attendance records: 3 present out of 4 total
    await db.insert(attendanceTable)
      .values([
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-15', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-16', status: 'Hadir', recorded_by: teachers[0].id },
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-17', status: 'Alfa', recorded_by: teachers[0].id },
        { student_id: students[0].id, class_id: classes[0].id, date: '2024-01-18', status: 'Hadir', recorded_by: teachers[0].id }
      ])
      .execute();

    const input: GetAttendanceReportInput = {};
    const result = await getAttendanceReport(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_days).toEqual(4);
    expect(result[0].present_days).toEqual(3);
    expect(result[0].absent_days).toEqual(1);
    expect(result[0].attendance_rate).toEqual(75); // 3/4 * 100 = 75%
  });
});
