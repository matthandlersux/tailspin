import React, { Fragment, useState } from 'react';
import styled from 'styled-components';
import { indexToColor } from '../utils/colorHash';
import { Circle } from './circle';
import { Search } from './search';
import { FileData } from '../reducers/mainViewModelSlice';

export const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #ccc;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const Option = styled.div<{ isSelected: boolean }>`
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  background-color: white;
  font-family: sans;
  ${({ isSelected }) => {
    return isSelected
      ? `
        display: flex !important;
        font-weight: bolder;
        ${Name} {
          text-decoration: underline;
        }
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
  left: 0px;
  bottom: 0px;

  ${Option} {
    ${({ isExpanded }) => {
      return isExpanded ? `display: flex;` : `display: none;`;
    }}
  }

  &:hover {
    ${Option} {
      display: flex;
    }
  }
`;

const Name = styled.span`
  flex-grow: 1;
`;

const LineCount = styled.span`
  padding-left: 10px;
  display: inline-block;
  font-family: mono, monospace;
`;

const Checkbox = styled.input``;

type Props = {
  simplifyNames?: boolean;
  tabs: FileData[];
  selected: 'combined' | number;
  onSelect: (i: 'combined' | number) => void;
  nameMapping: Record<string, string>;
  query: string;
  onSearch: (s: string) => void;
  isAllJSONExpanded: boolean;
  onToggleExpandAllJSON: () => void;
};

export const TabView = (props: Props) => {
  return (
    <Wrapper>
      <InnerView {...props} />
      <div>
        <Checkbox
          type="checkbox"
          onChange={() => props.onToggleExpandAllJSON()}
          checked={props.isAllJSONExpanded}
        />
        <label>Expand all JSON</label>
      </div>
      <Search query={props.query} onSearch={props.onSearch} />
    </Wrapper>
  );
};

export const InnerView = (props: Props) => {
  const tabNames = props.simplifyNames
    ? props.tabs.map(f => ({ name: props.nameMapping[f.name], lines: f.lines }))
    : props.tabs;
  const [isExpanded, setIsExpanded] = useState(false);
  return (
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
          <Name>Combined</Name>
        </Option>
      )}
      {tabNames.map(({ name, lines }, i) => (
        <Option
          onClick={() => {
            props.onSelect(i);
            setIsExpanded(false);
          }}
          isSelected={props.selected === i}
        >
          <Circle color={indexToColor(i)} />
          <Name>{name}</Name>
          <LineCount>{lines}</LineCount>
        </Option>
      ))}
    </Select>
  );
};
