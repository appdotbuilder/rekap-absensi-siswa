
import { db } from '../db';
import { studentsTable, usersTable } from '../db/schema';
import { type Student } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentsByClass(classId: number): Promise<Student[]> {
  try {
    // Query students with user information through join
    const results = await db.select({
      id: studentsTable.id,
      user_id: studentsTable.user_id,
      class_id: studentsTable.class_id,
      student_number: studentsTable.student_number,
      created_at: studentsTable.created_at,
      user_name: usersTable.name,
      user_email: usersTable.email,
      user_role: usersTable.role
    })
    .from(studentsTable)
    .innerJoin(usersTable, eq(studentsTable.user_id, usersTable.id))
    .where(eq(studentsTable.class_id, classId))
    .execute();

    // Map results to Student type with user information included
    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      class_id: result.class_id,
      student_number: result.student_number,
      created_at: result.created_at,
      // Include user information for convenience
      user_name: result.user_name,
      user_email: result.user_email,
      user_role: result.user_role
    })) as Student[];
  } catch (error) {
    console.error('Failed to get students by class:', error);
    throw error;
  }
}
