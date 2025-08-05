
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateClassInput = {
  name: 'Kelas 10A',
  grade: '10'
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('Kelas 10A');
    expect(result.grade).toEqual('10');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query using proper drizzle syntax
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Kelas 10A');
    expect(classes[0].grade).toEqual('10');
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create different classes with different inputs', async () => {
    const input1: CreateClassInput = {
      name: 'Kelas 11B',
      grade: '11'
    };

    const input2: CreateClassInput = {
      name: 'Kelas 12C',
      grade: '12'
    };

    const result1 = await createClass(input1);
    const result2 = await createClass(input2);

    expect(result1.name).toEqual('Kelas 11B');
    expect(result1.grade).toEqual('11');
    expect(result2.name).toEqual('Kelas 12C');
    expect(result2.grade).toEqual('12');
    expect(result1.id).not.toEqual(result2.id);
  });
});
