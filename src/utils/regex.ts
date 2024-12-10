export function escapeRegexSource(regexSource: string) {
  return regexSource.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}
