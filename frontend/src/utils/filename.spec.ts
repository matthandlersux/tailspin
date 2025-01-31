import { findCommonPrefix } from './filename';

describe('findCommonPrefix', () => {
  const filenames = [
    '/path/to/thing1',
    '/path/to/thing2',
    '/path/to/thing3',
    '/path/to/otherthing',
  ];

  it('finds the maximal common prefix', () => {
    expect(findCommonPrefix(filenames)).toEqual('/path/to/');
  });

  it('returns an empty string if nothing matches', () => {
    expect(findCommonPrefix(filenames.concat('asdf'))).toEqual('');
  });

  it('returns an empty string with an empty list', () => {
    expect(findCommonPrefix([])).toEqual('');
  });

  it('stops at boundaries and does not clip off actual letters', () => {
    const closeMatch = ['/path/to/thing1', '/path/to/that2'];
    expect(findCommonPrefix(closeMatch)).toEqual('/path/to/');
  });
});
