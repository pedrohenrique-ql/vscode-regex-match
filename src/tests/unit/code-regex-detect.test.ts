import { expect, beforeEach, describe, it } from 'vitest';

import { JAVASCRIPT_REGEX_DETECT, getRegexDetect } from '@/providers/code-lenses/utils';

describe('Code Regex Detect', () => {
  it.each(['javascript', 'typescript', 'javascriptreact', 'typescriptreact'])(
    'should get regex detect for %s',
    (languageId) => {
      const regexDetect = getRegexDetect(languageId);
      expect(regexDetect).toBeDefined();
      expect(regexDetect).toEqual(JAVASCRIPT_REGEX_DETECT);
    },
  );

  describe('JavaScript [js, jsx, ts, tsx]', () => {
    const regexDetect = getRegexDetect('javascript');

    beforeEach(() => {
      regexDetect!.lastIndex = 0;
    });

    it('should detect regex in variable declaration', () => {
      const code = `
        const regex = /hello/g;
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).not.toBeNull();
      expect(matches!).toHaveLength(1);
      expect(matches![0].trim()).toEqual('/hello/g');
    });

    it('should detect regex in function call', () => {
      expect(regexDetect).toBeDefined();

      const code = `
        const result = someFunction(/hello/g);
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).not.toBeNull();
      expect(matches!).toHaveLength(1);
      expect(matches![0].trim()).toEqual('/hello/g');
    });

    it('should detect regex in object property', () => {
      const code = `
        const obj = {
          regex: /hello/g,
        };
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).not.toBeNull();
      expect(matches!).toHaveLength(1);
      expect(matches![0].trim()).toEqual('/hello/g');
    });

    it('should not detect regex in import', () => {
      const code = `
        import { xpto } from './path/to/file';
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).toBeNull();
    });

    it('should not detect regex in string', () => {
      const code = `
        const str = 'hello /path/';
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).toBeNull();
    });

    it('should not detect regex in comment', () => {
      const code = `
        // /path/g
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).toBeNull();
    });

    it('should not detect regex in multiline comment', () => {
      const code = `
        /*
         * lorem ipsum /path/
        */
      `;

      const matches = regexDetect!.exec(code);
      expect(matches).toBeNull();
    });

    it('should not detect regex in comment started by "/*"', () => {
      const code = `{/* eslint-disable-next-line jsx-ally-/no-static-element/interactions */}`;

      const matches = regexDetect!.exec(code);
      expect(matches).toBeNull();
    });
  });
});
