import React from 'react';
import styled from 'styled-components';
import { InnerView as TabView, Wrapper as TabViewWrapper } from '../../components/TabView';

import { Entry, SectionW } from '../utils';
import { noop } from 'lodash';

const OuterContainer = styled.div`
  position: relative;
  width: 100%;
  border: 1px solid #888;
  min-height: 100px;
`;

const Wrapper = styled(TabViewWrapper)`
  position: absolute;
  left: 2px;
  right: 2px;
  bottom: 2px;
`;

const RecomposedTabView = (props: Parameters<typeof TabView>[0]) => {
  return (
    <OuterContainer>
      <Wrapper>
        <TabView {...props} />
      </Wrapper>
    </OuterContainer>
  );
};

export const TabViewSection = () => {
  return (
    <SectionW>
      <h2>TabView</h2>
      <div>
        <Entry title="0 tabs">
          <RecomposedTabView nameMapping={{}} onSelect={noop} selected={0} tabs={[]} />
        </Entry>
        <Entry title="1 tab">
          <RecomposedTabView nameMapping={{}} onSelect={noop} selected={0} tabs={['file1.log']} />
        </Entry>
        <Entry title="many tabs">
          <RecomposedTabView
            nameMapping={{}}
            onSelect={noop}
            selected={0}
            tabs={['svc-activity.log', 'svc-hypes.log', 'svc-thing.log']}
          />
        </Entry>
      </div>
    </SectionW>
  );
};
