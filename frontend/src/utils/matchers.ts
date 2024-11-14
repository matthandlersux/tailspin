import { Matcher } from './splitter';

export const matchers: Matcher[] = [
  {
    type: 'quoted_string',
    matcher: /(("")|(".*?[^\\]"))/,
  },
  {
    // avoid decimals?
    type: 'timestamp',
    matcher: /(?<!\d+\.)\d{8,20}/,
  },
  {
    type: 'level',
    matcher: /\b(trace|debug|info|warn|error|fatal)\b/i,
  },
  {
    type: 'date',
    matcher: /\d{4}\/\d\d?\/\d\d?(\s*\d\d:\d\d:\d\d)?/,
  },
];
