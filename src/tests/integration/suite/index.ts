import { glob } from 'glob';
import Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000,
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise(async (resolve, reject) => {
    try {
      const files = await glob('**/**.test.js', { cwd: testsRoot });

      files.forEach((file: string) => mocha.addFile(path.resolve(testsRoot, file)));

      try {
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (error) {
        console.error('Failed to run tests:', error);
        reject(error);
      }
    } catch (error) {
      console.error('Failed to find test files:', error);
      reject(error);
    }
  });
}
