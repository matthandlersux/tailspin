const colors: string[] = [
  '#f032e6',
  '#46f0f0',
  '#9a6324',
  '#000075',
  '#fffac8',
  '#800000',
  '#ffd8b1',
  '#4363d8',
  '#fabebe',
  '#bcf60c',
  '#e6194b',
  '#aaffc3',
  '#ffe119',
  '#f58231',
  '#911eb4',
  '#3cb44b',
  '#808080',
  '#e6beff',
  '#808000',
  '#008080',
];

/** provides a consistent mapping from string => color */
export const nameToColor = (name: string): string => {
  const hash = name.split('').reduce((acc: number, char: string) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/** provides a consistent mapping from index => color */
export const indexToColor = (i: number): string => {
  return colors[i % colors.length];
};
