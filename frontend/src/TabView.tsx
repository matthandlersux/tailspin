import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #ccc;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const Button = styled.button<{ selected: boolean }>`
  font-weight: ${props => (props.selected ? 'bolder' : 'light')};
  border-radius: 5px;
  background-color: white;
  border: 1px solid #666;
  padding: 5px;
  cursor: pointer;
`;

type Props = {
  tabs: string[];
  selected: number;
  onSelect: (i: number) => void;
};

export const TabView = (props: Props) => {
  return (
    <Wrapper>
      {props.tabs.map((name, i) => (
        <Button onClick={() => props.onSelect(i)} selected={i === props.selected}>
          file: {name}
        </Button>
      ))}
    </Wrapper>
  );
};
