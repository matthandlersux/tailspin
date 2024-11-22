import React from 'react';
import styled from 'styled-components';
import { Entry, SectionW } from '../utils';
import { InnerMessages as Messages, Wrapper as MessagesWrapper } from '../../components/Messages';
import { noop } from 'lodash';

const OuterContainer = styled.div`
  position: relative;
  width: 100%;
  border: 1px solid #888;
  min-height: 200px;
`;

const Wrapper = styled(MessagesWrapper)`
  position: absolute;
  left: 2px;
  right: 2px;
  bottom: 2px;
`;

const RecomposedMessages = (props: Parameters<typeof Messages>[0]) => {
  return (
    <OuterContainer>
      <Wrapper>
        <Messages {...props} />
      </Wrapper>
    </OuterContainer>
  );
};

export const MessagesSection = () => {
  const lines = [
    'INFO this is a line',
    'ERROR this is an error',
    JSON.stringify({ msg: 'some json1', timestamp: 123456789 }),
    JSON.stringify({ msg: 'some json2', also: { extra: 'message' }, timestamp: 123456789123 }),
    JSON.stringify({ msg: 'some json3', timestamp: 12345678987 }),
  ];
  return (
    <SectionW>
      <h2>Messages</h2>
      <div>
        <Entry title="multi line">
          <RecomposedMessages
            onSearch={noop}
            messages={lines}
            nameMapping={{}}
            fileOrdering={[]}
            expandedJson={{}}
            onToggleJson={noop}
          />
        </Entry>
        <Entry title="multi line with services">
          <RecomposedMessages
            onSearch={noop}
            messages={lines.map(line => ({ file: 'file1.log', line }))}
            nameMapping={{ 'file1.log': 'file1' }}
            fileOrdering={['file1.log']}
            expandedJson={{}}
            onToggleJson={noop}
          />
        </Entry>
      </div>
    </SectionW>
  );
};
