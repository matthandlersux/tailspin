import React from 'react';
import styled from 'styled-components';
import { Line } from './Line';
import { VList } from 'virtua';

const Wrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 50px;
  left: 0;
  right: 0;
  overflow-y: scroll;
  display: flex;
  flex-direction: column-reverse;
  padding: 20px;
  background-color: #000a1a;
  color: #fafcdf;
  font-size: 1rem;
`;

const Inner = styled.div``;

type Props = { messages: string[] };

export const Messages = (props: Props) => {
  return (
    <Wrapper>
      <VList style={{ height: '100vh' }}>
        {props.messages.map((line, index) => (
          <Line key={index} line={line} />
        ))}
      </VList>
    </Wrapper>
  );
};
