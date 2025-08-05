
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendanceTable } from '../db/schema';
import { type RecordAttendanceInput } from '../schema';
import { recordAttendance } from '../handlers/record_attendance';
import { eq, and } from 'drizzle-orm';

describe('recordAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testClassId: number;
  let testStudentId: number;
  let testRecorderId: number;

  const setupTestData = async () => {
    // Create a student user
    const studentUser = await db.insert(usersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'siswa'
      })
      .returning()
      .execute();
    testUserId = studentUser[0].id;

    // Create a teacher user
    const teacherUser = await db.insert(usersTable)
      .values({
        name: 'Jane Teacher',
        email: 'jane@example.com',
        role: 'guru'
      })
      .returning()
      .execute();
    testRecorderId = teacherUser[0].id;

    // Create a class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Mathematics',
        grade: '10A'
      })
      .returning()
      .execute();
    testClassId = testClass[0].id;

    // Create a student record
    const student = await db.insert(studentsTable)
      .values({
        user_id: testUserId,
        class_id: testClassId,
        student_number: 'STU001'
      })
      .returning()
      .execute();
    testStudentId = student[0].id;
  };

  it('should record attendance successfully', async () => {
    await setupTestData();

    const input: RecordAttendanceInput = {
      student_id: testStudentId,
      class_id: testClassId,
      date: '2024-01-15',
      status: 'Hadir',
      recorded_by: testRecorderId,
      notes: 'On time'
    };

    const result = await recordAttendance(input);

    expect(result.student_id).toEqual(testStudentId);
    expect(result.class_id).toEqual(testClassId);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.status).toEqual('Hadir');
    expect(result.recorded_by).toEqual(testRecorderId);
    expect(result.notes).toEqual('On time');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save attendance to database', async () => {
    await setupTestData();

    const input: RecordAttendanceInput = {
      student_id: testStudentId,
      class_id: testClassId,
      date: '2024-01-15',
      status: 'Sakit',
      recorded_by: testRecorderId,
      notes: null
    };

    const result = await recordAttendance(input);

    const savedAttendance = await db.select()
      .from(attendanceTable)
      .where(eq(attendanceTable.id, result.id))
      .execute();

    expect(savedAttendance).toHaveLength(1);
    expect(savedAttendance[0].student_id).toEqual(testStudentId);
    expect(savedAttendance[0].status).toEqual('Sakit');
    expect(savedAttendance[0].notes).toBeNull();
  });

  it('should throw error for non-existent student', async () => {
    await setupTestData();

    const input: RecordAttendanceInput = {
      student_id: 99999,
      class_id: testClassId,
      date: '2024-01-15',
      status: 'Hadir',
      recorded_by: testRecorderId
    };

    expect(recordAttendance(input)).rejects.toThrow(/student.*not found/i);
  });

  it('should throw error for non-existent class', async () => {
    await setupTestData();

    const input: RecordAttendanceInput = {
      student_id: testStudentId,
      class_id: 99999,
      date: '2024-01-15',
      status: 'Hadir',
      recorded_by: testRecorderId
    };

    expect(recordAttendance(input)).rejects.toThrow(/class.*not found/i);
  });

  it('should throw error for non-existent recorder', async () => {
    await setupTestData();

    const input: RecordAttendanceInput = {
      student_id: testStudentId,
      class_id: testClassId,
      date: '2024-01-15',
      status: 'Hadir',
      recorded_by: 99999
    };

    expect(recordAttendance(input)).rejects.toThrow(/user.*not found/i);
  });

  it('should throw error for duplicate attendance on same date', async () => {
    await setupTestData();

    const input: RecordAttendanceInput = {
      student_id: testStudentId,
      class_id: testClassId,
      date: '2024-01-15',
      status: 'Hadir',
      recorded_by: testRecorderId
    };

    // Record attendance first time
    await recordAttendance(input);

    // Try to record again for same student and date
    expect(recordAttendance(input)).rejects.toThrow(/attendance already recorded/i);
  });

  it('should handle different attendance statuses', async () => {
    await setupTestData();

    const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa'] as const;

    for (let i = 0; i < statuses.length; i++) {
      const input: RecordAttendanceInput = {
        student_id: testStudentId,
        class_id: testClassId,
        date: `2024-01-${15 + i}`, // Different dates to avoid duplicates
        status: statuses[i],
        recorded_by: testRecorderId
      };

      const result = await recordAttendance(input);
      expect(result.status).toEqual(statuses[i]);
    }
  });

  it('should handle notes being optional', async () => {
    await setupTestData();

    const inputWithoutNotes: RecordAttendanceInput = {
      student_id: testStudentId,
      class_id: testClassId,
      date: '2024-01-15',
      status: 'Hadir',
      recorded_by: testRecorderId
    };

    const result = await recordAttendance(inputWithoutNotes);
    expect(result.notes).toBeNull();
  });
});
