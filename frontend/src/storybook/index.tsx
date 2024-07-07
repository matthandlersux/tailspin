import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { JSON } from '../components/JSON';

const Wrapper = styled.div`
  background-color: black;
  padding: 20px;

  h1,
  h2 {
    color: white;
    font-family: helvetica;
  }
`;

const SectionW = styled.div`
  padding: 20px;
  border: 1px solid #fff5;
  border-radius: 5px;

  h2 {
    color: white;
  }
`;

const EntryW = styled.div``;

const Entry = (props: PropsWithChildren<{ title: string }>) => {
  return (
    <EntryW>
      <h3>{props.title}</h3>
      {props.children}
    </EntryW>
  );
};

export const Storybook = () => {
  return (
    <Wrapper>
      <h1>Storybook</h1>
      <SectionW>
        <h2>JSON</h2>
        <div>
          <Entry title="Empty Object">
            <JSON json={{}} />
          </Entry>
          <Entry title="Shallow Object">
            <JSON json={{ a: 1, b: 2, c: 'ok', d: null }} />
          </Entry>
          <Entry title="Nested Object">
            <JSON
              json={{
                a: 1,
                b: 2,
                c: 'ok',
                d: null,
                e: {
                  a: { ok: 1 },
                  b: [{ thing1: 20023.32 }, { thing2: 'asdfasdfa' }],
                },
              }}
            />
          </Entry>
        </div>
      </SectionW>
    </Wrapper>
  );
};
