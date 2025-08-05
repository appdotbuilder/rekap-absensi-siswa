
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { getClasses } from '../handlers/get_classes';

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();

    expect(result).toEqual([]);
  });

  it('should return all classes from database', async () => {
    // Create test classes
    await db.insert(classesTable)
      .values([
        {
          name: 'Kelas 10A',
          grade: '10'
        },
        {
          name: 'Kelas 11B',
          grade: '11'
        },
        {
          name: 'Kelas 12C',
          grade: '12'
        }
      ])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);
    
    // Verify first class
    expect(result[0].name).toEqual('Kelas 10A');
    expect(result[0].grade).toEqual('10');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second class
    expect(result[1].name).toEqual('Kelas 11B');
    expect(result[1].grade).toEqual('11');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Verify third class
    expect(result[2].name).toEqual('Kelas 12C');
    expect(result[2].grade).toEqual('12');
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return classes in insertion order', async () => {
    // Create test classes in specific order
    const class1 = await db.insert(classesTable)
      .values({
        name: 'First Class',
        grade: '10'
      })
      .returning()
      .execute();

    const class2 = await db.insert(classesTable)
      .values({
        name: 'Second Class',
        grade: '11'
      })
      .returning()
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Class');
    expect(result[1].name).toEqual('Second Class');
    expect(result[0].id).toEqual(class1[0].id);
    expect(result[1].id).toEqual(class2[0].id);
  });
});
