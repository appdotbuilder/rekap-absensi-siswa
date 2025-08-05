
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable, attendanceTable } from '../db/schema';
import { type BulkRecordAttendanceInput } from '../schema';
import { bulkRecordAttendance } from '../handlers/bulk_record_attendance';
import { eq, and } from 'drizzle-orm';

describe('bulkRecordAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let teacherId: number;
  let studentId: number;
  let classId: number;
  let student2Id: number;

  beforeEach(async () => {
    // Create a teacher
    const teacher = await db.insert(usersTable)
      .values({
        name: 'Teacher John',
        email: 'teacher@test.com',
        role: 'guru'
      })
      .returning()
      .execute();
    teacherId = teacher[0].id;

    // Create students
    const student1 = await db.insert(usersTable)
      .values({
        name: 'Student One',
        email: 'student1@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();

    const student2 = await db.insert(usersTable)
      .values({
        name: 'Student Two',
        email: 'student2@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();

    // Create a class
    const testClass = await db.insert(classesTable)
      .values({
        name: 'Class A',
        grade: '10'
      })
      .returning()
      .execute();
    classId = testClass[0].id;

    // Enroll students in the class
    const enrolledStudent1 = await db.insert(studentsTable)
      .values({
        user_id: student1[0].id,
        class_id: classId,
        student_number: 'STU001'
      })
      .returning()
      .execute();
    studentId = enrolledStudent1[0].id;

    const enrolledStudent2 = await db.insert(studentsTable)
      .values({
        user_id: student2[0].id,
        class_id: classId,
        student_number: 'STU002'
      })
      .returning()
      .execute();
    student2Id = enrolledStudent2[0].id;
  });

  it('should record attendance for multiple students', async () => {
    const input: BulkRecordAttendanceInput = {
      class_id: classId,
      date: '2024-01-15',
      recorded_by: teacherId,
      attendance_records: [
        {
          student_id: studentId,
          status: 'Hadir',
          notes: 'Present and on time'
        },
        {
          student_id: student2Id,
          status: 'Sakit',
          notes: 'Sick with fever'
        }
      ]
    };

    const result = await bulkRecordAttendance(input);

    expect(result).toHaveLength(2);
    
    // Check first attendance record
    expect(result[0].student_id).toEqual(studentId);
    expect(result[0].class_id).toEqual(classId);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].status).toEqual('Hadir');
    expect(result[0].recorded_by).toEqual(teacherId);
    expect(result[0].notes).toEqual('Present and on time');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second attendance record
    expect(result[1].student_id).toEqual(student2Id);
    expect(result[1].status).toEqual('Sakit');
    expect(result[1].notes).toEqual('Sick with fever');
  });

  it('should save attendance records to database', async () => {
    const input: BulkRecordAttendanceInput = {
      class_id: classId,
      date: '2024-01-15',
      recorded_by: teacherId,
      attendance_records: [
        {
          student_id: studentId,
          status: 'Hadir'
        },
        {
          student_id: student2Id,
          status: 'Izin',
          notes: 'Family emergency'
        }
      ]
    };

    const result = await bulkRecordAttendance(input);

    // Verify records were saved to database
    const savedRecords = await db.select()
      .from(attendanceTable)
      .where(and(
        eq(attendanceTable.class_id, classId),
        eq(attendanceTable.date, '2024-01-15')
      ))
      .execute();

    expect(savedRecords).toHaveLength(2);
    
    const record1 = savedRecords.find(r => r.student_id === studentId);
    const record2 = savedRecords.find(r => r.student_id === student2Id);

    expect(record1).toBeDefined();
    expect(record1!.status).toEqual('Hadir');
    expect(record1!.notes).toBeNull();

    expect(record2).toBeDefined();
    expect(record2!.status).toEqual('Izin');
    expect(record2!.notes).toEqual('Family emergency');
  });

  it('should handle records without notes', async () => {
    const input: BulkRecordAttendanceInput = {
      class_id: classId,
      date: '2024-01-15',
      recorded_by: teacherId,
      attendance_records: [
        {
          student_id: studentId,
          status: 'Hadir'
        }
      ]
    };

    const result = await bulkRecordAttendance(input);

    expect(result).toHaveLength(1);
    expect(result[0].notes).toBeNull();
  });

  it('should throw error if class does not exist', async () => {
    const input: BulkRecordAttendanceInput = {
      class_id: 9999,
      date: '2024-01-15',
      recorded_by: teacherId,
      attendance_records: [
        {
          student_id: studentId,
          status: 'Hadir'
        }
      ]
    };

    expect(bulkRecordAttendance(input)).rejects.toThrow(/Class with id 9999 not found/i);
  });

  it('should throw error if recorder does not exist', async () => {
    const input: BulkRecordAttendanceInput = {
      class_id: classId,
      date: '2024-01-15',
      recorded_by: 9999,
      attendance_records: [
        {
          student_id: studentId,
          status: 'Hadir'
        }
      ]
    };

    expect(bulkRecordAttendance(input)).rejects.toThrow(/User with id 9999 not found/i);
  });

  it('should throw error if recorder is not a teacher', async () => {
    // Create a student user
    const studentUser = await db.insert(usersTable)
      .values({
        name: 'Student User',
        email: 'student.user@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();

    const input: BulkRecordAttendanceInput = {
      class_id: classId,
      date: '2024-01-15',
      recorded_by: studentUser[0].id,
      attendance_records: [
        {
          student_id: studentId,
          status: 'Hadir'
        }
      ]
    };

    expect(bulkRecordAttendance(input)).rejects.toThrow(/Only teachers can record attendance/i);
  });

  it('should throw error if student does not belong to specified class', async () => {
    // Create another class and student
    const anotherClass = await db.insert(classesTable)
      .values({
        name: 'Class B',
        grade: '11'
      })
      .returning()
      .execute();

    const anotherStudent = await db.insert(usersTable)
      .values({
        name: 'Another Student',
        email: 'another@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();

    const enrolledInDifferentClass = await db.insert(studentsTable)
      .values({
        user_id: anotherStudent[0].id,
        class_id: anotherClass[0].id,
        student_number: 'STU003'
      })
      .returning()
      .execute();

    const input: BulkRecordAttendanceInput = {
      class_id: classId, // Different class than where student is enrolled
      date: '2024-01-15',
      recorded_by: teacherId,
      attendance_records: [
        {
          student_id: enrolledInDifferentClass[0].id,
          status: 'Hadir'
        }
      ]
    };

    expect(bulkRecordAttendance(input)).rejects.toThrow(/Students with ids .* not found in class/i);
  });
});
