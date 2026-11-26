import { describe, expect, it } from 'vitest';
import { getRegexLanguage } from '@/providers/code-lenses/languages';
import type { DetectedRegex, RegexLanguage } from '@/providers/code-lenses/languages/RegexLanguage';

describe('Code Regex Detect (JavaScript)', () => {
  function getAllMatches(language: RegexLanguage, text: string): DetectedRegex[] {
    return language.detect(text);
  }

  it.each(['javascript', 'typescript', 'javascriptreact', 'typescriptreact'])(
    'should get regex detect for %s',
    (languageId) => {
      const language = getRegexLanguage(languageId);
      expect(language).toBeDefined();
      expect(language).toBe(getRegexLanguage('javascript'));
    },
  );

  describe('JavaScript [js, jsx, ts, tsx]', () => {
    const regexDetect = getRegexLanguage('javascript')!;

    it('should detect regex in variable declaration', () => {
      const code = 'const regex = /hello/g;';
      const matches = getAllMatches(regexDetect, code);
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.trim()).toEqual('/hello/g');
    });

    it('should detect regex in function call', () => {
      const code = 'const result = someFunction(/hello/g);';
      const matches = getAllMatches(regexDetect, code);
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.trim()).toEqual('/hello/g');
    });

    it('should detect regex in object property', () => {
      const code = 'const obj = { regex: /hello/g };';
      const matches = getAllMatches(regexDetect, code);
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.trim()).toEqual('/hello/g');
    });

    it('should not detect regex in import', () => {
      const code = "import { xpto } from '" + './' + "path/to/file';";
      expect(getAllMatches(regexDetect, code)).toHaveLength(0);
    });

    it('should not detect regex in string', () => {
      const code = "const str = 'hello /path/';";
      expect(getAllMatches(regexDetect, code)).toHaveLength(0);
    });

    it('should not detect regex in comment', () => {
      expect(getAllMatches(regexDetect, '// /path/g')).toHaveLength(0);
    });

    it('should not detect regex in multiline comment', () => {
      const code = '/* lorem ipsum /path/ */';
      expect(getAllMatches(regexDetect, code)).toHaveLength(0);
    });

    it('should not detect regex in comment started by "/*"', () => {
      const code = '{/* eslint-disable-next-line jsx-ally-/no-static-element/interactions */}';
      expect(getAllMatches(regexDetect, code)).toHaveLength(0);
    });

    it('should detect two regexes on the same line', () => {
      const code = ".replace(/ ./g, '.').replace(/ ,/, ',')";
      const matches = getAllMatches(regexDetect, code);
      expect(matches).toHaveLength(2);
      expect(matches[0].pattern.trim()).toEqual('/ ./g');
      expect(matches[1].pattern.trim()).toEqual('/ ,/');
    });

    it('should detect regex inside array', () => {
      let matches = getAllMatches(regexDetect, 'const array = [/hello/g];');
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.trim()).toEqual('/hello/g');

      matches = getAllMatches(regexDetect, 'const array = [/hello/g, /world/g];');
      expect(matches).toHaveLength(2);
      expect(matches[0].pattern.trim()).toEqual('/hello/g');
      expect(matches[1].pattern.trim()).toEqual('/world/g');
    });

    it('should detect regex with "/" in the middle of the regex', () => {
      let matches = getAllMatches(regexDetect, 'const regex = /(ab\\/)ab/g;');
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.trim()).toEqual('/(ab\\/)ab/g');

      matches = getAllMatches(regexDetect, 'const regex = /[^/]/g');
      expect(matches).toHaveLength(1);
      expect(matches[0].pattern.trim()).toEqual('/[^/]/g');
    });

    it.each(['g', 'i', 'm', 'u', 'y', 's', 'v'])(
      'should detect regex with flag %s',
      (flag) => {
        const code = 'const regex = /hello/' + flag + ';';
        const matches = getAllMatches(regexDetect, code);
        expect(matches).toHaveLength(1);
        expect(matches[0].pattern.trim()).toEqual('/hello/' + flag);
      },
    );
  });
});
