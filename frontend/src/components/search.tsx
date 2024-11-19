import * as React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  input {
    border: 0;
    position: absolute;
    right: 5px;
    bottom: 5px;
    top: 5px;
    padding: 4px 8px;
    min-width: 400px;
  }
`;

export const Search = (props: { query: string | undefined; onSearch: (s: string) => void }) => {
  return (
    <Wrapper>
      <input
        placeholder="search"
        value={props.query}
        onChange={e => {
          props.onSearch(e.currentTarget.value);
        }}
      />
    </Wrapper>
  );
};
