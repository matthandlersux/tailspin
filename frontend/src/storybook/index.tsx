import React from 'react';
import styled from 'styled-components';
import { JSONSection } from './json';
import { TabViewSection } from './tabView';
import { MessagesSection } from './messages';
import { ConnectionLossSection } from './connectionLoss';

const Wrapper = styled.div`
  background-color: black;
  padding: 20px;

  h1,
  h2,
  h3 {
    color: white;
    font-family: helvetica;
  }
`;

export const Storybook = () => {
  return (
    <Wrapper>
      <h1>Storybook</h1>
      <MessagesSection />
      <TabViewSection />
      <JSONSection />
      <ConnectionLossSection />
    </Wrapper>
  );
};
