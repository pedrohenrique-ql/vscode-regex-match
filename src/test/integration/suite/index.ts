/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { glob } from 'glob';
import Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    void glob('**/**.test.js', { cwd: testsRoot }, (err: any, files: any[]) => {
      if (err) {
        e(err);
        return;
      }

      // Add files to the test suite
      files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (_error) {
        console.error(err);
        e(err);
      }
    });
  });
}
