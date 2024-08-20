import fs from 'fs';
import path from 'path';

import { DEFAULT_FILE_CONTENT } from '@/services/regex-match/FileCreator';
import { REGEX_TEST_FILE_PATH } from '@/services/regex-match/RegexMatchService';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function writeDefaultTestFile() {
  const filePath: string = path.join(__dirname, `../../../${REGEX_TEST_FILE_PATH}`);
  fs.writeFileSync(filePath, DEFAULT_FILE_CONTENT);
}
