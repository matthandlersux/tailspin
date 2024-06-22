import React, { useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  font-family: monospace;

  &:nth-child(even) {
    background-color: #ffffff08;
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

export const Line = (props: { line: string }) => {
  const maybeJson = props.line.startsWith('{') ? JSON.parse(props.line) : undefined;
  const [showJson, toggleShowJson] = useState(false);
  const text = showJson && maybeJson ? JSON.stringify(maybeJson, null, 4) : props.line;

  return (
    <Wrapper>
      {maybeJson && (
        <ExpandJsonButton onClick={() => toggleShowJson(!showJson)}>+</ExpandJsonButton>
      )}
      {showJson && maybeJson ? <pre>{text}</pre> : text}
    </Wrapper>
  );
};
