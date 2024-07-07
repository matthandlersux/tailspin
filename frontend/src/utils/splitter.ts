export type Matcher = {
  matcher: RegExp;
  type: string;
};

type Matched = {
  type: string;
  text: string;
};

export const splitByRegex = (input: string, parsers: Matcher[]): Matched[] => {
  return parsers.reduce(
    (acc: Matched[], parser: Matcher) => {
      return acc.flatMap((p: Matched): Matched[] => {
        if (p.type === 'text') {
          return splitKeep(p.text, parser.matcher).map(textPart => {
            return parser.matcher.test(textPart)
              ? { type: parser.type, text: textPart }
              : { type: 'text', text: textPart };
          });
        } else return [p];
      });
    },
    [{ type: 'text', text: input }],
  );
};

const splitKeep = (str: string, regex: RegExp): string[] => {
  const globalRegex = new RegExp(
    regex.source,
    regex.flags.includes('g') ? regex.flags : regex.flags + 'g',
  );

  const result: string[] = [];
  let lastIndex = 0;

  str.replace(globalRegex, (match: string, ...args: any[]) => {
    const matchIndex = args[args.length - 2];
    if (lastIndex < matchIndex) {
      result.push(str.slice(lastIndex, matchIndex));
    }
    result.push(match);
    lastIndex = matchIndex + match.length;
    return match;
  });

  if (lastIndex < str.length) {
    result.push(str.slice(lastIndex));
  }

  return result;
};
