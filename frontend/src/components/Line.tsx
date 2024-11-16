import React, { useState } from 'react';
import styled from 'styled-components';
import { JSON as JSONComponent } from './JSON';
import { Highlight } from './Highlight';
import { LogEntry } from '../reducers/logDataSlice';
import { Circle } from './circle';
import { indexToColor } from '../utils/colorHash';

const Wrapper = styled.div<{ isEven: boolean }>`
  ${props => props.isEven && 'background-color: #ffffff08;'}
  line-height: 1;
  padding: 2px 0px;

  &:hover {
    background-color: rgba(256, 256, 256, 0.1);
  }

  span {
    vertical-align: middle;
  }
`;

const ButtonStyle = styled.button`
  border: 1px solid #fff3;
  border-radius: 2px;
  margin: 0px 5px;
  height: 15px;
  width: 15px;
  text-align: center;
  font-size: 9px;
  box-sizing: border-box;
  opacity: 0.6;
  vertical-align: middle;
`;

const NoActionButton = styled(ButtonStyle)`
  background-color: grey;
  opacity: 0.1;
`;

const ExpandJsonButton = styled(ButtonStyle)`
  background-color: teal;
  color: white;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`;

const ServiceName = styled.span`
  display: inline-block;
  margin-right: 4px;
  color: orange;
`;

type Props = {
  line: string | LogEntry;
  index: number;
  nameMapping: Record<string, string>;
  fileOrdering: string[];
};

export const Line = (props: Props) => {
  const header = typeof props.line === 'string' ? undefined : props.line.file;
  const line = typeof props.line === 'string' ? props.line : props.line.line;
  const maybeJson = line.startsWith('{') ? JSON.parse(line) : undefined;
  const [showJson, toggleShowJson] = useState(false);
  const text = showJson && maybeJson ? JSON.stringify(maybeJson, null, 4) : line;
  const colorIndex = header !== undefined && props.fileOrdering.indexOf(header);

  return (
    <Wrapper isEven={props.index % 2 == 0}>
      {maybeJson ? (
        <ExpandJsonButton onClick={() => toggleShowJson(!showJson)}>
          {!showJson ? '▶' : '▼'}
        </ExpandJsonButton>
      ) : (
        <NoActionButton />
      )}
      {header && (
        <ServiceName>
          {colorIndex !== false && colorIndex !== -1 ? (
            <Circle color={indexToColor(colorIndex)} />
          ) : (
            ''
          )}
          {props.nameMapping[header]}
        </ServiceName>
      )}
      {showJson && maybeJson ? <JSONComponent json={maybeJson} /> : <Highlight text={text} />}
    </Wrapper>
  );
};
