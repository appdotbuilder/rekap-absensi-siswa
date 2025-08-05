
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { type EnrollStudentInput } from '../schema';
import { enrollStudent } from '../handlers/enroll_student';
import { eq } from 'drizzle-orm';

describe('enrollStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should enroll a student into a class', async () => {
    // Create prerequisite user with 'siswa' role
    const userResults = await db.insert(usersTable)
      .values({
        name: 'Test Student',
        email: 'student@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();
    const user = userResults[0];

    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        grade: '10'
      })
      .returning()
      .execute();
    const testClass = classResults[0];

    const input: EnrollStudentInput = {
      user_id: user.id,
      class_id: testClass.id,
      student_number: 'STU001'
    };

    const result = await enrollStudent(input);

    expect(result.user_id).toEqual(user.id);
    expect(result.class_id).toEqual(testClass.id);
    expect(result.student_number).toEqual('STU001');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save student record to database', async () => {
    // Create prerequisite user and class
    const userResults = await db.insert(usersTable)
      .values({
        name: 'Test Student',
        email: 'student@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();
    const user = userResults[0];

    const classResults = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        grade: '10'
      })
      .returning()
      .execute();
    const testClass = classResults[0];

    const input: EnrollStudentInput = {
      user_id: user.id,
      class_id: testClass.id,
      student_number: 'STU001'
    };

    const result = await enrollStudent(input);

    // Verify in database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].user_id).toEqual(user.id);
    expect(students[0].class_id).toEqual(testClass.id);
    expect(students[0].student_number).toEqual('STU001');
    expect(students[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        grade: '10'
      })
      .returning()
      .execute();
    const testClass = classResults[0];

    const input: EnrollStudentInput = {
      user_id: 999, // Non-existent user
      class_id: testClass.id,
      student_number: 'STU001'
    };

    await expect(enrollStudent(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when class does not exist', async () => {
    // Create prerequisite user
    const userResults = await db.insert(usersTable)
      .values({
        name: 'Test Student',
        email: 'student@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();
    const user = userResults[0];

    const input: EnrollStudentInput = {
      user_id: user.id,
      class_id: 999, // Non-existent class
      student_number: 'STU001'
    };

    await expect(enrollStudent(input)).rejects.toThrow(/class not found/i);
  });

  it('should throw error when user is not a student (role is not "siswa")', async () => {
    // Create prerequisite user with 'guru' role
    const userResults = await db.insert(usersTable)
      .values({
        name: 'Test Teacher',
        email: 'teacher@test.com',
        role: 'guru'
      })
      .returning()
      .execute();
    const user = userResults[0];

    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        grade: '10'
      })
      .returning()
      .execute();
    const testClass = classResults[0];

    const input: EnrollStudentInput = {
      user_id: user.id,
      class_id: testClass.id,
      student_number: 'STU001'
    };

    await expect(enrollStudent(input)).rejects.toThrow(/user must have role "siswa"/i);
  });

  it('should throw error when student number already exists', async () => {
    // Create prerequisite users
    const user1Results = await db.insert(usersTable)
      .values({
        name: 'Test Student 1',
        email: 'student1@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();
    const user1 = user1Results[0];

    const user2Results = await db.insert(usersTable)
      .values({
        name: 'Test Student 2',
        email: 'student2@test.com',
        role: 'siswa'
      })
      .returning()
      .execute();
    const user2 = user2Results[0];

    // Create prerequisite class
    const classResults = await db.insert(classesTable)
      .values({
        name: 'Kelas 10A',
        grade: '10'
      })
      .returning()
      .execute();
    const testClass = classResults[0];

    // Enroll first student
    const input1: EnrollStudentInput = {
      user_id: user1.id,
      class_id: testClass.id,
      student_number: 'STU001'
    };
    await enrollStudent(input1);

    // Try to enroll second student with same student number
    const input2: EnrollStudentInput = {
      user_id: user2.id,
      class_id: testClass.id,
      student_number: 'STU001' // Duplicate student number
    };

    await expect(enrollStudent(input2)).rejects.toThrow();
  });
});
