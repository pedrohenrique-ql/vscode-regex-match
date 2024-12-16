import fs from 'fs';
import path from 'path';
import { Uri } from 'vscode';

import { DEFAULT_FILE_CONTENT } from '@/services/regex-match/FileCreator';
import { REGEX_TEST_FILE_PATH } from '@/services/regex-match/RegexMatchService';

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function writeDefaultTestFile() {
  const filePath: string = path.join(__dirname, `../../../${REGEX_TEST_FILE_PATH}`);
  fs.writeFileSync(filePath, DEFAULT_FILE_CONTENT);
}

export function createTemporaryFile(content: string): Uri {
  const tmpDir = path.join(__dirname, 'tmp');

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const tmpFilePath = path.join(tmpDir, 'test-file.txt');
  fs.writeFileSync(tmpFilePath, content, { encoding: 'utf-8' });

  return Uri.file(tmpFilePath);
}
