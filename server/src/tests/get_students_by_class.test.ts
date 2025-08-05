
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, classesTable, studentsTable } from '../db/schema';
import { getStudentsByClass } from '../handlers/get_students_by_class';

describe('getStudentsByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return students enrolled in a specific class', async () => {
    // Create a teacher user first
    const teacherResult = await db.insert(usersTable)
      .values({
        name: 'Teacher One',
        email: 'teacher@example.com',
        role: 'guru'
      })
      .returning()
      .execute();

    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Math 101',
        grade: '10A'
      })
      .returning()
      .execute();

    // Create student users
    const studentUsersResult = await db.insert(usersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'siswa'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'siswa'
        }
      ])
      .returning()
      .execute();

    // Enroll students in the class
    await db.insert(studentsTable)
      .values([
        {
          user_id: studentUsersResult[0].id,
          class_id: classResult[0].id,
          student_number: 'STU001'
        },
        {
          user_id: studentUsersResult[1].id,
          class_id: classResult[0].id,
          student_number: 'STU002'
        }
      ])
      .execute();

    // Get students by class
    const students = await getStudentsByClass(classResult[0].id);

    // Verify results
    expect(students).toHaveLength(2);
    
    // Check first student
    expect(students[0].class_id).toEqual(classResult[0].id);
    expect(students[0].student_number).toEqual('STU001');
    expect((students[0] as any).user_name).toEqual('John Doe');
    expect((students[0] as any).user_email).toEqual('john@example.com');
    expect((students[0] as any).user_role).toEqual('siswa');
    expect(students[0].created_at).toBeInstanceOf(Date);

    // Check second student
    expect(students[1].class_id).toEqual(classResult[0].id);
    expect(students[1].student_number).toEqual('STU002');
    expect((students[1] as any).user_name).toEqual('Jane Smith');
    expect((students[1] as any).user_email).toEqual('jane@example.com');
    expect((students[1] as any).user_role).toEqual('siswa');
    expect(students[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for class with no students', async () => {
    // Create a class with no students
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        grade: '10B'
      })
      .returning()
      .execute();

    const students = await getStudentsByClass(classResult[0].id);

    expect(students).toHaveLength(0);
  });

  it('should return empty array for non-existent class', async () => {
    const students = await getStudentsByClass(99999);

    expect(students).toHaveLength(0);
  });

  it('should only return students from the specified class', async () => {
    // Create two classes
    const classesResult = await db.insert(classesTable)
      .values([
        {
          name: 'Math 101',
          grade: '10A'
        },
        {
          name: 'Science 101',
          grade: '10B'
        }
      ])
      .returning()
      .execute();

    // Create student users
    const studentUsersResult = await db.insert(usersTable)
      .values([
        {
          name: 'Student One',
          email: 'student1@example.com',
          role: 'siswa'
        },
        {
          name: 'Student Two',
          email: 'student2@example.com',
          role: 'siswa'
        }
      ])
      .returning()
      .execute();

    // Enroll students in different classes
    await db.insert(studentsTable)
      .values([
        {
          user_id: studentUsersResult[0].id,
          class_id: classesResult[0].id, // Math class
          student_number: 'STU001'
        },
        {
          user_id: studentUsersResult[1].id,
          class_id: classesResult[1].id, // Science class
          student_number: 'STU002'
        }
      ])
      .execute();

    // Get students from first class only
    const mathStudents = await getStudentsByClass(classesResult[0].id);

    expect(mathStudents).toHaveLength(1);
    expect(mathStudents[0].class_id).toEqual(classesResult[0].id);
    expect((mathStudents[0] as any).user_name).toEqual('Student One');
  });
});
