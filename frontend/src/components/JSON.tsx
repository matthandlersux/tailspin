import React, { Fragment } from 'react';
import styled from 'styled-components';
import { sortBy } from 'lodash';

const Wrapper = styled.div`
  font-family: mono, monospace;
  font-weight: bold;
`;

const String = styled.span<{ underline?: boolean }>`
  margin-left: 10px;
  color: lime;
  text-decoration: ${props => (props.underline ? 'underline' : 'none')};
`;

const MultiLineString = styled.span`
  margin-left: 10px;
  color: lime;
`;

const MultiSingleLine = styled.span<{ underline?: boolean }>`
  display: inline-block;
  word-break: break-word;
  margin-left: 15px;
  white-space: pre-wrap;
  text-indent: -20px;
  padding-left: 20px;
  text-decoration: ${props => (props.underline ? 'underline' : 'none')};
`;

const Number = styled.span`
  margin-left: 10px;
  color: red;
`;

const Bool = styled.span`
  color: blue;
`;

const Null = styled.span`
  margin-left: 10px;
  color: salmon;
`;

const Brackets = styled.div<{ inline?: boolean }>`
  display: ${props => (props.inline ? 'inline-block' : 'block')};
  font-size: 80%;
  color: yellow;
`;

const ObjectBody = styled.div``;

const ObjectEntry = styled.div`
  margin-left: 20px;
`;

const ObjectKey = styled.span`
  display: inline-block;
  color: aqua;
  min-width: 30px;
`;

const ObjectValue = styled.span``;

const ArrayBody = styled.div``;

const ArrayEntry = styled.div`
  margin-left: 10px;
`;

const levelColors: Record<string, { background: string; text: string }> = {
  trace: { background: '#2d2d2d', text: '#cccccc' },
  debug: { background: '#1f3a93', text: '#d0e7ff' },
  info: { background: '#1e824c', text: '#d5f5e3' },
  warn: { background: '#f39c12', text: '#fff3cd' },
  error: { background: '#c0392b', text: '#f9d6d5' },
  fatal: { background: '#8e44ad', text: '#fceff9' },
};

export const LogLevel = styled.span<{ level: string }>`
  margin-left: 10px;
  padding: 2px 4px;
  background-color: ${({ level }) => levelColors[level].background};
  color: ${({ level }) => levelColors[level].text};
  font-weight: 500;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const messageKeys = ['msg', 'message'];
const sortPriorityFields = ['level', 'time', 'timestamp', 'msg', 'message'];

export const JSON = (props: { json: unknown }) => {
  return (
    <Wrapper>
      <JSONValue json={props.json} />
    </Wrapper>
  );
};

type Props = {
  json: unknown;
  isChild?: boolean;
  hasComma?: boolean;
};

const JSONValue = ({ json, hasComma, jsonKey }: Props & { jsonKey?: string }) => {
  if (typeof json == 'string') {
    const underline = messageKeys.includes(jsonKey ?? '');
    if (json.includes('\n')) {
      return (
        <MultiLineString>
          "
          {json.split('\n').map(line => {
            return (
              <Fragment>
                <br />
                <MultiSingleLine underline={underline}>{line}</MultiSingleLine>
              </Fragment>
            );
          })}
          <br />"
        </MultiLineString>
      );
    } else if (jsonKey === 'level') {
      return <LogLevel level={json}>{json}</LogLevel>;
    } else if (jsonKey === 'time' || jsonKey === 'timestamp') {
      return <Timestamp timestamp={json} />;
    } else {
      return <String underline={underline}>"{json}"</String>;
    }
  } else if (typeof json == 'number') {
    if (jsonKey === 'time' || jsonKey === 'timestamp') {
      return (
        <Number>
          <Timestamp timestamp={json} />
        </Number>
      );
    } else {
      return <Number>{json}</Number>;
    }
  } else if (typeof json == 'boolean') {
    return <Bool>{json.toString()}</Bool>;
  } else if (Array.isArray(json)) {
    return <JSONArray json={json} />;
  } else if (json === null || json === undefined) {
    return <Null>null</Null>;
  } else {
    return <JSONObject json={json} hasComma={hasComma} />;
  }
};

const JSONObject = (props: Props & { json: {} }) => {
  const sortedEntries = sortBy(Object.entries(props.json), e => {
    const i = sortPriorityFields.indexOf(e[0]);
    return i === -1 ? e[0] : i;
  });

  return (
    <ObjectBody>
      <Brackets inline={props.isChild}>{'{'}</Brackets>
      {sortedEntries.map(([k, v]) => {
        return (
          <ObjectEntry>
            <ObjectKey>{k}:</ObjectKey>
            <ObjectValue>
              <JSONValue json={v} jsonKey={k} isChild={true} />
            </ObjectValue>
          </ObjectEntry>
        );
      })}
      <Brackets>
        {'}'}
        {props.hasComma && <Brackets inline>,</Brackets>}
      </Brackets>
    </ObjectBody>
  );
};

const JSONArray = (props: { json: unknown[] }) => {
  return (
    <ArrayBody>
      <Brackets>{'['}</Brackets>
      {props.json.map((d, i) => (
        <ArrayEntry>
          <JSONValue json={d} isChild={true} hasComma />
        </ArrayEntry>
      ))}
      <Brackets>{']'}</Brackets>
    </ArrayBody>
  );
};

const normalizeNumericTimestamp = (ts: number): number => {
  const length = ts.toString().length;

  if (length <= 10) {
    // Seconds
    return ts * 1000;
  } else if (length <= 13) {
    // Milliseconds
    return ts;
  } else if (length <= 16) {
    // Microseconds
    return Math.floor(ts / 1000);
  } else {
    // Nanoseconds or more
    return Math.floor(ts / 1_000_000);
  }
};

const parseTimestamp = (input: string | number | Date): Date | null => {
  if (input instanceof Date) return input;

  if (typeof input === 'number' || /^\d+$/.test(input)) {
    const numeric = typeof input === 'number' ? input : parseInt(input, 10);
    return new Date(normalizeNumericTimestamp(numeric));
  }

  return null;
};

const formatTimeWithMs = (date: Date, locale: string): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const millis = date.getMilliseconds().toString().padStart(3, '0');

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${hours}:${minutes}:${seconds}.${millis} ${ampm}`;
};

export const Timestamp = ({
  timestamp,
  locale = 'default',
}: {
  timestamp: string | number | Date;
  locale?: string;
}) => {
  const date = parseTimestamp(timestamp);

  if (!date) {
    return <React.Fragment>{timestamp.toString()}</React.Fragment>;
  }

  const formatted = formatTimeWithMs(date, locale);

  return <span title={`${date.toISOString()} (${timestamp})`}>{formatted}</span>;
};
