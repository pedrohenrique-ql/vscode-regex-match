import { describe, expect, it } from 'vitest';
import { getRegexLanguage } from '@/providers/code-lenses/languages';

describe('Code Regex Detect (Python)', () => {
  const language = getRegexLanguage('python')!;
  const patterns = (source: string) => language.detect(source).map((match) => match.pattern);

  it.each(['compile', 'match', 'search', 'fullmatch', 'findall', 'finditer', 'sub', 'subn', 'split'])(
    'detects only the first string argument of re.%s',
    (name) => {
      expect(patterns('re.' + name + '(r"\\d+", r"\\1-x", value)')).toEqual(['\\d+']);
    },
  );

  it('keeps an already escaped slash unchanged', () => {
    const match = language.detect('re.compile(r"a\\/b")')[0];
    expect(language.toPattern(match)).toBe('/a\\/b/');
  });

  it('maps supported Python flags from positional, keyword and inline forms', () => {
    const positional = language.detect('re.compile(r"abc", re.IGNORECASE | re.MULTILINE)')[0];
    const keyword = language.detect('re.search(r"abc", text, flags=re.DOTALL)')[0];
    const inline = language.detect('re.compile(r"(?i)abc")')[0];
    expect(language.toPattern(positional)).toBe('/abc/im');
    expect(language.toPattern(keyword)).toBe('/abc/s');
    expect(language.toPattern(inline)).toBe('/abc/i');
  });

  it('skips flags and syntax that cannot be represented by JavaScript', () => {
    expect(patterns('re.compile(r"abc", re.VERBOSE)')).toEqual([]);
    expect(patterns('re.compile(r"(?i:abc)")')).toEqual([]);
  });

  it('translates Python named groups, named backreferences and anchors', () => {
    const namedGroup = language.detect('re.compile(r"(?P<year>\\d{4})")')[0];
    const namedBackreference = language.detect('re.compile(r"(?P<year>\\d{4})-(?P=year)")')[0];
    const anchors = language.detect('re.compile(r"\\Astart\\Z", re.MULTILINE)')[0];
    expect(language.toPattern(namedGroup)).toBe('/(?<year>\\d{4})/');
    expect(language.toPattern(namedBackreference)).toBe('/(?<year>\\d{4})-\\k<year>/');
    expect(language.toPattern(anchors)).toBe('/(?<![\\s\\S])start(?![\\s\\S])/m');
  });

  it('detects patterns with slashes and preserves the slash in a literal', () => {
    const match = language.detect('re.compile(r"/usr/bin/a/b")')[0];
    expect(language.toPattern(match)).toBe('/\\/usr\\/bin\\/a\\/b/');
  });

  it('ignores comments and hashes in strings', () => {
    expect(patterns('re.compile(r"a")  # comment')).toEqual(['a']);
    expect(patterns('re.sub(r"#+", "", s); re.compile(r"b")')).toEqual(['#+', 'b']);
    expect(patterns('# re.compile(r"ignored")\nre.compile(r"kept")')).toEqual(['kept']);
    expect(patterns('message = "# text"; re.compile(r"b")')).toEqual(['b']);
  });

  it.each([
    'my_re.compile(r"x")', 'are.compile(r"x")', 're.escape(r"x")',
    're.compile(rb"x")', 're.compile(f"{p}x")', 're.compile(u"x")',
    're.compile(r"""x""")', 're.compile(r"")',
  ])('rejects unsupported forms: %s', (source) => expect(patterns(source)).toEqual([]));

  it('supports uppercase raw prefix, normal strings, whitespace, newlines and opposite quotes', () => {
    expect(patterns('re.compile(R"\\d+")')).toEqual(['\\d+']);
    expect(patterns("re.compile('\\\\w+')")).toEqual(['\\w+']);
    expect(patterns('re.compile(\n    r"x")')).toEqual(['x']);
    expect(patterns("re.compile(r\"it's\")")).toEqual(["it's"]);
  });

  it.each([
    ['\\a', '\\x07'],
    ['\\b', '\\x08'],
    ['\\f', '\\f'],
    ['\\n', '\\n'],
    ['\\r', '\\r'],
    ['\\t', '\\t'],
    ['\\v', '\\v'],
    ['\\\\', '\\'],
    ["\\'", "'"],
    ['\\"', '"'],
    ['\\d+', '\\d+'],
  ])('normalizes Python escape %s', (input, expected) => {
    expect(patterns('re.compile("' + input + '")')).toEqual([expected]);
  });
});
