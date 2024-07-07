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
});
