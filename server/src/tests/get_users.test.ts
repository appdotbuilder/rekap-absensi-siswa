
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUsers: CreateUserInput[] = [
  {
    name: 'Ahmad Siswa',
    email: 'ahmad@example.com',
    role: 'siswa'
  },
  {
    name: 'Sari Guru',
    email: 'sari@example.com', 
    role: 'guru'
  },
  {
    name: 'Budi Siswa',
    email: 'budi@example.com',
    role: 'siswa'
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();

    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Ahmad Siswa');
    expect(result[0].email).toEqual('ahmad@example.com');
    expect(result[0].role).toEqual('siswa');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Sari Guru');
    expect(result[1].role).toEqual('guru');

    expect(result[2].name).toEqual('Budi Siswa'); 
    expect(result[2].role).toEqual('siswa');
  });

  it('should return users with correct types', async () => {
    // Create a single test user
    await db.insert(usersTable)
      .values([testUsers[0]])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(typeof user.id).toBe('number');
    expect(typeof user.name).toBe('string');
    expect(typeof user.email).toBe('string');
    expect(['siswa', 'guru']).toContain(user.role);
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should return users in insertion order', async () => {
    // Insert users one by one to verify order
    for (const userData of testUsers) {
      await db.insert(usersTable)
        .values([userData])
        .execute();
    }

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].email).toEqual('ahmad@example.com');
    expect(result[1].email).toEqual('sari@example.com');
    expect(result[2].email).toEqual('budi@example.com');
  });
});
