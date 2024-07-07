import { unzip } from 'lodash';

export const findCommonPrefix = (strings: string[]): string => {
  const transposed: (string | undefined)[][] = unzip(strings.map(s => s.split('')));
  const { running } = transposed.reduce(
    ({ running, done }, chars) => {
      return !done && chars.every(c => chars[0] && chars[0] === c)
        ? { running: running + chars[0], done: false }
        : { running, done: true };
    },
    { running: '', done: false },
  );
  return running;
};
