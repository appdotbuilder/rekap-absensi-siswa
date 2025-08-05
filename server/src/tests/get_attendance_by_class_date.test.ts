
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendanceTable } from '../db/schema';
import { getAttendanceByClassDate } from '../handlers/get_attendance_by_class_date';

describe('getAttendanceByClassDate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attendance records for a specific class and date', async () => {
    // Create test data
    const teacher = await db.insert(usersTable)
      .values({
        name: 'Teacher One',
        email: 'teacher@example.com',
        role: 'guru'
      })
      .returning()
      .execute();

    const student = await db.insert(usersTable)
      .values({
        name: 'Student One',
        email: 'student@example.com',
        role: 'siswa'
      })
      .returning()
      .execute();

    const testClass = await db.insert(classesTable)
      .values({
        name: 'Class A',
        grade: '10'
      })
      .returning()
      .execute();

    const enrollment = await db.insert(studentsTable)
      .values({
        user_id: student[0].id,
        class_id: testClass[0].id,
        student_number: 'STU001'
      })
      .returning()
      .execute();

    const testDate = '2024-01-15';
    await db.insert(attendanceTable)
      .values({
        student_id: enrollment[0].id,
        class_id: testClass[0].id,
        date: testDate,
        status: 'Hadir',
        recorded_by: teacher[0].id,
        notes: 'Present in class'
      })
      .execute();

    const result = await getAttendanceByClassDate(testClass[0].id, testDate);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toEqual(enrollment[0].id);
    expect(result[0].class_id).toEqual(testClass[0].id);
    expect(result[0].date).toEqual(new Date(testDate));
    expect(result[0].status).toEqual('Hadir');
    expect(result[0].recorded_by).toEqual(teacher[0].id);
    expect(result[0].notes).toEqual('Present in class');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no attendance records exist for the class and date', async () => {
    // Create test data without attendance records
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Class B',
        grade: '11'
      })
      .returning()
      .execute();

    const result = await getAttendanceByClassDate(testClass[0].id, '2024-01-15');

    expect(result).toHaveLength(0);
  });

  it('should return only attendance records for the specified date', async () => {
    // Create test data
    const teacher = await db.insert(usersTable)
      .values({
        name: 'Teacher Two',
        email: 'teacher2@example.com',
        role: 'guru'
      })
      .returning()
      .execute();

    const student = await db.insert(usersTable)
      .values({
        name: 'Student Two',
        email: 'student2@example.com',
        role: 'siswa'
      })
      .returning()
      .execute();

    const testClass = await db.insert(classesTable)
      .values({
        name: 'Class C',
        grade: '12'
      })
      .returning()
      .execute();

    const enrollment = await db.insert(studentsTable)
      .values({
        user_id: student[0].id,
        class_id: testClass[0].id,
        student_number: 'STU002'
      })
      .returning()
      .execute();

    // Insert attendance for two different dates
    await db.insert(attendanceTable)
      .values([
        {
          student_id: enrollment[0].id,
          class_id: testClass[0].id,
          date: '2024-01-15',
          status: 'Hadir',
          recorded_by: teacher[0].id,
          notes: 'Present on 15th'
        },
        {
          student_id: enrollment[0].id,
          class_id: testClass[0].id,
          date: '2024-01-16',
          status: 'Sakit',
          recorded_by: teacher[0].id,
          notes: 'Sick on 16th'
        }
      ])
      .execute();

    const result = await getAttendanceByClassDate(testClass[0].id, '2024-01-15');

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual(new Date('2024-01-15'));
    expect(result[0].status).toEqual('Hadir');
    expect(result[0].notes).toEqual('Present on 15th');
  });

  it('should handle multiple students in the same class on the same date', async () => {
    // Create test data
    const teacher = await db.insert(usersTable)
      .values({
        name: 'Teacher Three',
        email: 'teacher3@example.com',
        role: 'guru'
      })
      .returning()
      .execute();

    const students = await db.insert(usersTable)
      .values([
        {
          name: 'Student Three',
          email: 'student3@example.com',
          role: 'siswa'
        },
        {
          name: 'Student Four',
          email: 'student4@example.com',
          role: 'siswa'
        }
      ])
      .returning()
      .execute();

    const testClass = await db.insert(classesTable)
      .values({
        name: 'Class D',
        grade: '9'
      })
      .returning()
      .execute();

    const enrollments = await db.insert(studentsTable)
      .values([
        {
          user_id: students[0].id,
          class_id: testClass[0].id,
          student_number: 'STU003'
        },
        {
          user_id: students[1].id,
          class_id: testClass[0].id,
          student_number: 'STU004'
        }
      ])
      .returning()
      .execute();

    const testDate = '2024-01-17';
    await db.insert(attendanceTable)
      .values([
        {
          student_id: enrollments[0].id,
          class_id: testClass[0].id,
          date: testDate,
          status: 'Hadir',
          recorded_by: teacher[0].id,
          notes: 'Student 3 present'
        },
        {
          student_id: enrollments[1].id,
          class_id: testClass[0].id,
          date: testDate,
          status: 'Izin',
          recorded_by: teacher[0].id,
          notes: 'Student 4 excused'
        }
      ])
      .execute();

    const result = await getAttendanceByClassDate(testClass[0].id, testDate);

    expect(result).toHaveLength(2);
    
    const presentRecord = result.find(r => r.status === 'Hadir');
    const excusedRecord = result.find(r => r.status === 'Izin');
    
    expect(presentRecord).toBeDefined();
    expect(presentRecord!.notes).toEqual('Student 3 present');
    expect(excusedRecord).toBeDefined();
    expect(excusedRecord!.notes).toEqual('Student 4 excused');
  });
});
