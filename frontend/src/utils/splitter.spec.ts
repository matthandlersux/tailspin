import { matchers } from './matchers';
import { splitByRegex } from './splitter';

describe('splitByRegex', () => {
  it('splits with a single matcher', () => {
    const result = splitByRegex('asdf 132423423 asdfadsf 2342342342', [
      {
        type: 'timestamp',
        matcher: /\d{8,20}/,
      },
    ]);
    expect(result).toEqual([
      { type: 'text', text: 'asdf ' },
      { type: 'timestamp', text: '132423423' },
      { type: 'text', text: ' asdfadsf ' },
      { type: 'timestamp', text: '2342342342' },
    ]);
  });

  it('splits with multiple matchers', () => {
    const result = splitByRegex('asdf 132423423 info asdfadsf warn 2342342342', matchers);
    expect(result).toEqual([
      { type: 'text', text: 'asdf ' },
      { type: 'timestamp', text: '132423423' },
      { type: 'text', text: ' ' },
      { type: 'level', text: 'info' },
      { type: 'text', text: ' asdfadsf ' },
      { type: 'level', text: 'warn' },
      { type: 'text', text: ' ' },
      { type: 'timestamp', text: '2342342342' },
    ]);
  });

  it('splits a real line', () => {
    const result = splitByRegex(
      'segment 2024/06/18 13:21:44 INFO: response 400 400 Bad Request – {',
      matchers,
    );
    expect(result).toEqual([
      { type: 'text', text: 'segment ' },
      { type: 'date', text: '2024/06/18 13:21:44' },
      { type: 'text', text: ' ' },
      { type: 'level', text: 'INFO' },
      { type: 'text', text: ': response 400 400 Bad Request – {' },
    ]);
  });

  describe('matchers', () => {
    it('does not capture part of a decimal string', () => {
      const result = splitByRegex('asdf 1.23456789', matchers);
      expect(result).toEqual([{ type: 'text', text: 'asdf 1.23456789' }]);
    });

    it('does capture part of a decimal string if it has a space', () => {
      const result = splitByRegex('asdf 1. 23456789', matchers);
      expect(result).toEqual([
        { type: 'text', text: 'asdf 1. ' },
        { type: 'timestamp', text: '23456789' },
      ]);
    });

    it('captures a non-empty string as a quoted string', () => {
      const result = splitByRegex('asdf "quoted"', matchers);
      expect(result).toEqual([
        { type: 'text', text: 'asdf ' },
        { type: 'quoted_string', text: '"quoted"' },
      ]);
    });

    it('captures a non-empty string with escaped quotes as a quoted string', () => {
      const result = splitByRegex('asdf "quo\\"ted"', matchers);
      expect(result).toEqual([
        { type: 'text', text: 'asdf ' },
        { type: 'quoted_string', text: '"quo\\"ted"' },
      ]);
    });

    it('captures an empty string as the quoted thing', () => {
      const result = splitByRegex('asdf 12345678: "" ok ""', matchers);
      expect(result).toEqual([
        { type: 'text', text: 'asdf ' },
        { type: 'timestamp', text: '12345678' },
        { type: 'text', text: ': ' },
        { type: 'quoted_string', text: '""' },
        { type: 'text', text: ' ok ' },
        { type: 'quoted_string', text: '""' },
      ]);
    });
  });
});
