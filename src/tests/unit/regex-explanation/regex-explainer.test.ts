import { describe, expect, it } from 'vitest';

import RegexExplainer from '@/services/regex-explanation/RegexExplainer';

describe('Regex Explainer', () => {
  it('should explain a character set and its quantifier and capturing group ancestors', () => {
    const explanations = RegexExplainer.explainAt('/(\\d{2,4})\\w+/gi', 2);

    expect(explanations).toHaveLength(3);

    expect(explanations[0].token).toBe('\\d');
    expect(explanations[0].range).toEqual([2, 4]);
    expect(explanations[0].description).toContain('matches a digit');

    expect(explanations[1].token).toBe('{2,4}');
    expect(explanations[1].range).toEqual([4, 9]);
    expect(explanations[1].description).toContain('between 2 and 4 times');

    expect(explanations[2].token).toBe('(\\d{2,4})');
    expect(explanations[2].range).toEqual([1, 10]);
    expect(explanations[2].description).toBe('capturing group 1');
  });

  it('should explain a literal character', () => {
    const explanations = RegexExplainer.explainAt('/abc/', 1);

    expect(explanations).toHaveLength(1);
    expect(explanations[0].token).toBe('a');
    expect(explanations[0].range).toEqual([1, 2]);
    expect(explanations[0].description).toBe('matches the character `a` literally');
  });

  it('should explain an escaped control character', () => {
    const explanations = RegexExplainer.explainAt('/a\\nb/', 2);

    expect(explanations).toHaveLength(1);
    expect(explanations[0].token).toBe('\\n');
    expect(explanations[0].range).toEqual([2, 4]);
    expect(explanations[0].description).toContain('line feed');
  });

  it('should explain a character class and a range inside it', () => {
    const explanations = RegexExplainer.explainAt('/[a-z0-9]/', 3);

    expect(explanations).toHaveLength(2);

    expect(explanations[0].token).toBe('a-z');
    expect(explanations[0].range).toEqual([2, 5]);
    expect(explanations[0].description).toBe('matches a single character in the range `a` to `z`');

    expect(explanations[1].token).toBe('[a-z0-9]');
    expect(explanations[1].range).toEqual([1, 9]);
    expect(explanations[1].description).toBe('matches a single character present in the list');
  });

  it('should explain a negated character class', () => {
    const explanations = RegexExplainer.explainAt('/[^abc]/', 3);

    expect(explanations).toHaveLength(2);
    expect(explanations[0].token).toBe('a');
    expect(explanations[1].token).toBe('[^abc]');
    expect(explanations[1].description).toBe('matches a single character not present in the list');
  });

  it('should explain each quantifier form', () => {
    function quantifierAt(regexLine: string) {
      return RegexExplainer.explainAt(regexLine, 2)[0];
    }

    expect(quantifierAt('/a?/').token).toBe('?');
    expect(quantifierAt('/a?/').range).toEqual([2, 3]);
    expect(quantifierAt('/a?/').description).toContain('between zero and one time');

    expect(quantifierAt('/a*/').token).toBe('*');
    expect(quantifierAt('/a*/').description).toContain('zero or more times');

    expect(quantifierAt('/a+/').token).toBe('+');
    expect(quantifierAt('/a+/').description).toContain('one or more times');

    expect(quantifierAt('/a{3}/').token).toBe('{3}');
    expect(quantifierAt('/a{3}/').description).toContain('exactly 3 times');

    expect(quantifierAt('/a{2,}/').token).toBe('{2,}');
    expect(quantifierAt('/a{2,}/').description).toContain('2 or more times');

    expect(quantifierAt('/a{2,5}/').token).toBe('{2,5}');
    expect(quantifierAt('/a{2,5}/').description).toContain('between 2 and 5 times');
  });

  it('should mark a lazy quantifier as lazy', () => {
    const explanations = RegexExplainer.explainAt('/a+?/', 2);

    expect(explanations[0].token).toBe('+?');
    expect(explanations[0].range).toEqual([2, 4]);
    expect(explanations[0].description).toBe(
      'matches the previous token one or more times, as few times as possible (lazy)',
    );
  });

  it('should explain a named capturing group and a non-capturing group', () => {
    const namedGroupExplanations = RegexExplainer.explainAt('/(?<year>\\d)(?:x)/', 9);

    expect(namedGroupExplanations).toHaveLength(2);
    expect(namedGroupExplanations[1].token).toBe('(?<year>\\d)');
    expect(namedGroupExplanations[1].range).toEqual([1, 12]);
    expect(namedGroupExplanations[1].description).toBe('named capturing group `year` (group 1)');

    const groupExplanations = RegexExplainer.explainAt('/(?<year>\\d)(?:x)/', 15);

    expect(groupExplanations).toHaveLength(2);
    expect(groupExplanations[0].token).toBe('x');
    expect(groupExplanations[1].token).toBe('(?:x)');
    expect(groupExplanations[1].range).toEqual([12, 17]);
    expect(groupExplanations[1].description).toBe('non-capturing group');
  });

  it('should explain lookahead, negative lookahead, lookbehind and negative lookbehind', () => {
    const regexLine = '/(?=a)(?!b)(?<=c)(?<!d)/';

    expect(RegexExplainer.explainAt(regexLine, 4)[1].token).toBe('(?=a)');
    expect(RegexExplainer.explainAt(regexLine, 4)[1].description).toBe(
      'positive lookahead — asserts that the following text matches',
    );
    expect(RegexExplainer.explainAt(regexLine, 9)[1].description).toBe(
      'negative lookahead — asserts that the following text does not match',
    );
    expect(RegexExplainer.explainAt(regexLine, 15)[1].description).toBe(
      'positive lookbehind — asserts that the preceding text matches',
    );
    expect(RegexExplainer.explainAt(regexLine, 21)[1].description).toBe(
      'negative lookbehind — asserts that the preceding text does not match',
    );
  });

  it('should explain the start and end anchors and the word boundary', () => {
    const regexLine = '/^\\ba\\b$/';

    const startExplanations = RegexExplainer.explainAt(regexLine, 1);
    expect(startExplanations[0].token).toBe('^');
    expect(startExplanations[0].description).toBe(
      'asserts position at the start of the string (or line with the `m` flag)',
    );

    const wordBoundaryExplanations = RegexExplainer.explainAt(regexLine, 2);
    expect(wordBoundaryExplanations[0].token).toBe('\\b');
    expect(wordBoundaryExplanations[0].range).toEqual([2, 4]);
    expect(wordBoundaryExplanations[0].description).toBe('asserts a word boundary');

    const endExplanations = RegexExplainer.explainAt(regexLine, 7);
    expect(endExplanations[0].token).toBe('$');
    expect(endExplanations[0].description).toBe(
      'asserts position at the end of the string (or line with the `m` flag)',
    );
  });

  it('should explain a numeric backreference and a named backreference', () => {
    const numericExplanations = RegexExplainer.explainAt('/(a)\\1/', 4);

    expect(numericExplanations).toHaveLength(1);
    expect(numericExplanations[0].token).toBe('\\1');
    expect(numericExplanations[0].range).toEqual([4, 6]);
    expect(numericExplanations[0].description).toBe('matches the same text most recently matched by group 1');

    const namedExplanations = RegexExplainer.explainAt('/(?<x>a)\\k<x>/', 8);

    expect(namedExplanations[0].token).toBe('\\k<x>');
    expect(namedExplanations[0].range).toEqual([8, 13]);
    expect(namedExplanations[0].description).toBe('matches the same text most recently matched by the named group `x`');
  });

  it('should explain alternation when hovering the pipe', () => {
    const explanations = RegexExplainer.explainAt('/a|b/', 2);

    expect(explanations).toHaveLength(1);
    expect(explanations[0].token).toBe('|');
    expect(explanations[0].range).toEqual([2, 3]);
    expect(explanations[0].description).toContain('alternation');
  });

  it('should explain the hovered flag first and then the remaining flags', () => {
    const explanations = RegexExplainer.explainAt('/a/gim', 4);

    expect(explanations).toHaveLength(3);

    expect(explanations[0].token).toBe('i');
    expect(explanations[0].range).toEqual([4, 5]);
    expect(explanations[0].description).toBe('case-insensitive matching');

    expect(explanations[1].token).toBe('g');
    expect(explanations[1].range).toEqual([3, 4]);
    expect(explanations[1].description).toBe('global — finds all matches instead of stopping at the first');

    expect(explanations[2].token).toBe('m');
    expect(explanations[2].range).toEqual([5, 6]);
    expect(explanations[2].description).toBe('multiline — `^` and `$` match line boundaries');
  });

  it('should explain the dot as matching newlines when the s flag is set', () => {
    expect(RegexExplainer.explainAt('/./s', 1)[0].description).toBe(
      'matches any character, including line terminators (`s` flag)',
    );
    expect(RegexExplainer.explainAt('/./', 1)[0].description).toBe('matches any character except line terminators');
  });

  it('should explain a bare pattern line with no slash delimiters', () => {
    const explanations = RegexExplainer.explainAt('\\d+', 0);

    expect(explanations).toHaveLength(2);

    expect(explanations[0].token).toBe('\\d');
    expect(explanations[0].range).toEqual([0, 2]);
    expect(explanations[0].description).toContain('matches a digit');

    expect(explanations[1].token).toBe('+');
    expect(explanations[1].range).toEqual([2, 3]);
    expect(explanations[1].description).toContain('one or more times');
  });

  it('should return an empty array for the delimiter slashes', () => {
    expect(RegexExplainer.explainAt('/a/g', 0)).toEqual([]);
    expect(RegexExplainer.explainAt('/a/g', 2)).toEqual([]);
  });

  it('should return an empty array for an invalid regex', () => {
    expect(RegexExplainer.explainAt('/a(/', 1)).toEqual([]);
  });

  it('should return an empty array for a character index outside the line', () => {
    expect(RegexExplainer.explainAt('/a/g', 99)).toEqual([]);
  });
});
