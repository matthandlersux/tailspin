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
  simplifyNames?: boolean;
  tabs: string[];
  selected: 'combined' | number;
  onSelect: (i: 'combined' | number) => void;
  nameMapping: Record<string, string>;
};

export const TabView = (props: Props) => {
  const tabNames = props.simplifyNames
    ? props.tabs.map(name => props.nameMapping[name])
    : props.tabs;
  return (
    <Wrapper>
      {props.tabs.length > 1 && (
        <Button onClick={() => props.onSelect('combined')} selected={props.selected === 'combined'}>
          Combined
        </Button>
      )}
      {tabNames.map((name, i) => (
        <Button onClick={() => props.onSelect(i)} selected={i === props.selected}>
          file: {name}
        </Button>
      ))}
    </Wrapper>
  );
};
