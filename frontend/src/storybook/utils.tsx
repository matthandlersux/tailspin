import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

export const noop = () => {};

export const SectionW = styled.div`
  padding: 20px;
  border: 1px solid #fff5;
  border-radius: 5px;

  h2 {
    color: white;
  }

  & + & {
    margin-top: 20px;
  }
`;

export const EntryW = styled.div``;

export const Entry = (props: PropsWithChildren<{ title: string }>) => {
  return (
    <EntryW>
      <h3>{props.title}</h3>
      {props.children}
    </EntryW>
  );
};
