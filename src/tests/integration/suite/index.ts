import { glob } from 'glob';
import Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    void glob('**/**.test.js', { cwd: testsRoot }, (err: Error | null, files: string[]) => {
      if (err) {
        e(err);
        return;
      }

      files.forEach((file: string) => mocha.addFile(path.resolve(testsRoot, file)));

      try {
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
