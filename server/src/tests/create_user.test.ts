
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different user roles
const testStudentInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@student.com',
  role: 'siswa'
};

const testTeacherInput: CreateUserInput = {
  name: 'Jane Smith',
  email: 'jane.smith@teacher.com',
  role: 'guru'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student user', async () => {
    const result = await createUser(testStudentInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@student.com');
    expect(result.role).toEqual('siswa');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a teacher user', async () => {
    const result = await createUser(testTeacherInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@teacher.com');
    expect(result.role).toEqual('guru');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testStudentInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@student.com');
    expect(users[0].role).toEqual('siswa');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testStudentInput);

    // Try to create another user with same email
    await expect(createUser(testStudentInput))
      .rejects.toThrow(/duplicate/i);
  });

  it('should create multiple users with different emails', async () => {
    const student = await createUser(testStudentInput);
    const teacher = await createUser(testTeacherInput);

    expect(student.id).not.toEqual(teacher.id);
    expect(student.role).toEqual('siswa');
    expect(teacher.role).toEqual('guru');

    // Verify both are saved in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
  });
});
