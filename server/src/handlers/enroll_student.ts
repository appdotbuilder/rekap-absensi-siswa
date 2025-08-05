
import { db } from '../db';
import { studentsTable, usersTable, classesTable } from '../db/schema';
import { type EnrollStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const enrollStudent = async (input: EnrollStudentInput): Promise<Student> => {
  try {
    // Verify user exists and has role 'siswa'
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    if (users[0].role !== 'siswa') {
      throw new Error('User must have role "siswa" to be enrolled as student');
    }

    // Verify class exists
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classes.length === 0) {
      throw new Error('Class not found');
    }

    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        user_id: input.user_id,
        class_id: input.class_id,
        student_number: input.student_number
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student enrollment failed:', error);
    throw error;
  }
};
