/* eslint-disable no-useless-escape */
import { expect, beforeEach, describe, it } from 'vitest';

import { JAVASCRIPT_REGEX_DETECT, getRegexDetect } from '@/providers/code-lenses/utils';

describe('Code Regex Detect', () => {
  function getAllMatches(regex: RegExp, text: string): RegExpExecArray[] {
    if (!regex.global) {
      throw new Error("A expressão regular deve ter a flag global 'g' para capturar todas as correspondências.");
    }

    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match);
    }

    return matches;
  }

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

      const matches = getAllMatches(regexDetect!, code);

      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual('/hello/g');
    });

    it('should detect regex in function call', () => {
      expect(regexDetect).toBeDefined();

      const code = `
        const result = someFunction(/hello/g);
      `;

      const matches = getAllMatches(regexDetect!, code);

      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual('/hello/g');
    });

    it('should detect regex in object property', () => {
      const code = `
        const obj = {
          regex: /hello/g,
        };
      `;

      const matches = getAllMatches(regexDetect!, code);

      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual('/hello/g');
    });

    it('should not detect regex in import', () => {
      const code = `
        import { xpto } from './path/to/file';
      `;

      const matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(0);
    });

    it('should not detect regex in string', () => {
      const code = `
        const str = 'hello /path/';
      `;

      const matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(0);
    });

    it('should not detect regex in comment', () => {
      const code = `
        // /path/g
      `;

      const matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(0);
    });

    it('should not detect regex in multiline comment', () => {
      const code = `
        /*
         * lorem ipsum /path/
        */
      `;

      const matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(0);
    });

    it('should not detect regex in comment started by "/*"', () => {
      const code = `{/* eslint-disable-next-line jsx-ally-/no-static-element/interactions */}`;

      const matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(0);
    });

    it('should detect two regexes on the same line', () => {
      const code = `.replace(/ ./g, '.').replace(/ ,/, ',')`;

      const matches = getAllMatches(regexDetect!, code);

      expect(matches).toHaveLength(2);
      expect(matches[0][0].trim()).toEqual('/ ./g');
      expect(matches[1][0].trim()).toEqual('/ ,/');
    });

    it('should detect regex inside array', () => {
      let code = 'const array = [/hello/g];';

      let matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual('/hello/g');

      code = 'const array = [/hello/g, /world/g];';

      matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(2);
      expect(matches[0][0].trim()).toEqual('/hello/g');
      expect(matches[1][0].trim()).toEqual('/world/g');
    });

    it('should detect regex with "/" in the middle of the regex', () => {
      let code = 'const regex = /(ab\\/)ab/g;';

      let matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual('/(ab\\/)ab/g');

      code = 'const regex = /[^/]/g';

      matches = getAllMatches(regexDetect!, code);
      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual('/[^/]/g');
    });

    it.each(['g', 'i', 'm', 'u', 'y', 's', 'v'])(`should detect regex with flag '%s'`, (flag) => {
      const code = `const regex = /hello/${flag};`;

      const matches = getAllMatches(regexDetect!, code);

      expect(matches).toHaveLength(1);
      expect(matches[0][0].trim()).toEqual(`/hello/${flag}`);
    });
  });
});
