import * as React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding: 4px 8px;
  input {
    border: 0;
    padding: 4px 8px;
    min-height: 30px;
    min-width: 400px;
  }

  & > div {
    position: absolute;
    top: 5px;
    right: 10px;
    bottom: 5px;
    display: flex;
    align-items: center;
  }
`;

const ClearButton = styled.div`
  background-color: #222;
  color: white;
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  padding: 2px;
  text-align: center;
  line-height: 20px;
  opacity: 0.2;

  &:hover {
    opacity: 1;
  }
`;

export const Search = (props: { query: string; onSearch: (s: string) => void }) => {
  return (
    <Wrapper>
      <input
        placeholder="search"
        value={props.query}
        onChange={e => {
          props.onSearch(e.currentTarget.value);
        }}
      />
      {props.query?.length > 0 && (
        <div>
          <ClearButton onClick={() => props.onSearch('')}>🞪</ClearButton>
        </div>
      )}
    </Wrapper>
  );
};
