import React, { useState } from 'react';
import styled from 'styled-components';
import { JSON as JSONComponent } from './JSON';
import { Highlight } from './Highlight';
import { LogEntry } from '../reducers/logDataSlice';

const Wrapper = styled.div<{ isEven: boolean }>`
  ${props => props.isEven && 'background-color: #ffffff08;'}

  &:hover {
    background-color: rgba(256, 256, 256, 0.1);
  }
`;

const ExpandJsonButton = styled.button`
  border: 1px solid #fff3;
  background-color: teal;
  color: white;
  border-radius: 2px;
  cursor: pointer;
  margin: 0px 5px;
`;

const ServiceName = styled.span`
  display: inline-block;
  margin-right: 4px;
  color: orange;
`;

type Props = { line: string | LogEntry; index: number; nameMapping: Record<string, string> };

export const Line = (props: Props) => {
  const header = typeof props.line === 'string' ? undefined : props.line.file;
  const line = typeof props.line === 'string' ? props.line : props.line.line;
  const maybeJson = line.startsWith('{') ? JSON.parse(line) : undefined;
  const [showJson, toggleShowJson] = useState(false);
  const text = showJson && maybeJson ? JSON.stringify(maybeJson, null, 4) : line;

  return (
    <Wrapper isEven={props.index % 2 == 0}>
      {maybeJson && (
        <ExpandJsonButton onClick={() => toggleShowJson(!showJson)}>+</ExpandJsonButton>
      )}
      {header && <ServiceName>{props.nameMapping[header]}</ServiceName>}
      {showJson && maybeJson ? <JSONComponent json={maybeJson} /> : <Highlight text={text} />}
    </Wrapper>
  );
};
