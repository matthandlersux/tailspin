import React, { Fragment } from 'react';
import styled from 'styled-components';
import { splitByRegex } from '../utils/splitter';
import { matchers } from '../utils/matchers';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
const colorMap: Record<LogLevel, string> = {
  trace: 'grey',
  debug: 'white',
  info: 'turquoise',
  warn: 'yellow',
  error: 'red',
  fatal: 'maroon',
};

const LogData = styled.span<{ level: LogLevel }>`
  color: ${p => colorMap[p.level]};
`;

const DateData = styled.span`
  text-decoration: underline;
`;

const String = styled.span`
  color: green;
  font-weight: bold;
`;

const Timestamp = styled.span`
  color: white;
  font-weight: bolder;
`;

export const Highlight = (props: { text: string }) => {
  const inner = splitByRegex(props.text, matchers).map(({ type, text }) => {
    if (type === 'timestamp') {
      // @ts-expect-error
      return <Timestamp title={new Date(+text)}>{text}</Timestamp>;
    } else if (type === 'level') {
      return <LogData level={text.toLowerCase() as LogLevel}>{text}</LogData>;
    } else if (type === 'quoted_string') {
      return <String>{text}</String>;
    } else if (type === 'date') {
      return <DateData>{text}</DateData>;
    } else {
      return <span>{text}</span>;
    }
  });

  return <Fragment>{inner}</Fragment>;
};
