import { describe, it, expect } from 'vitest';
import { generateImportTestData } from '../shared/testDataGenerators';
import fs from 'fs';
import path from 'path';

describe('testDataGenerators', () => {
  it('should generate the same JSON as import-tests.json', () => {
    const expected = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data', 'import-tests.json'), 'utf-8')
    );
    const actual = generateImportTestData();
    expect(actual).toEqual(expected);
  });
});