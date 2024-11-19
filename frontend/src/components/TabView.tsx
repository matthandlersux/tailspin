import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { indexToColor } from '../utils/colorHash';
import { Circle } from './circle';
import { Search } from './search';

export const Wrapper = styled.div`
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

const Option = styled.div<{ isSelected: boolean }>`
  padding: 10px;
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: white;
  font-family: sans;
  ${({ isSelected }) => {
    return isSelected
      ? `
        display: block !important;
        font-weight: bolder;
        text-decoration: underline;
      `
      : '';
  }}

  ${Circle} {
    margin-right: 10px;
  }

  &:hover {
    background: #f0f0f0;
  }
`;

const Select = styled.div<{ isExpanded: boolean }>`
  min-width: 200px;
  border: 0px;
  padding: 4px 8px;
  margin: 0px;
  position: absolute;
  bottom: 0;
  left: 0px;

  ${Option} {
    ${({ isExpanded }) => {
      return isExpanded ? `display: block;` : `display: none;`;
    }}
  }

  &:hover {
    ${Option} {
      display: block;
    }
  }
`;

type Props = {
  simplifyNames?: boolean;
  tabs: string[];
  selected: 'combined' | number;
  onSelect: (i: 'combined' | number) => void;
  nameMapping: Record<string, string>;
  query: string | undefined;
  onSearch: (s: string) => void;
};

export const TabView = (props: Props) => {
  return (
    <Wrapper>
      <InnerView {...props} />
      <Search query={props.query} onSearch={props.onSearch} />
    </Wrapper>
  );
};

export const InnerView = (props: Props) => {
  const tabNames = props.simplifyNames
    ? props.tabs.map(name => props.nameMapping[name])
    : props.tabs;
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <Fragment>
      <Select
        isExpanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {props.tabs.length > 1 && (
          <Option
            onClick={() => props.onSelect('combined')}
            isSelected={props.selected === 'combined'}
          >
            <Circle color="black" />
            Combined
          </Option>
        )}
        {tabNames.map((name, i) => (
          <Option
            onClick={() => {
              props.onSelect(i);
              setIsExpanded(false);
            }}
            isSelected={props.selected === i}
          >
            <Circle color={indexToColor(i)} />
            {name}
          </Option>
        ))}
      </Select>
    </Fragment>
  );
};
