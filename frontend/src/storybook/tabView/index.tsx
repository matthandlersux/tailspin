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
          <RecomposedTabView
            query={''}
            onSearch={noop}
            nameMapping={{}}
            onSelect={noop}
            selected={0}
            tabs={[]}
            isAllJSONExpanded={false}
            onToggleExpandAllJSON={noop}
          />
        </Entry>
        <Entry title="1 tab">
          <RecomposedTabView
            query={''}
            onSearch={noop}
            nameMapping={{}}
            onSelect={noop}
            selected={0}
            tabs={[{ name: 'file1.log', lines: 100 }]}
            isAllJSONExpanded={false}
            onToggleExpandAllJSON={noop}
          />
        </Entry>
        <Entry title="many tabs">
          <RecomposedTabView
            query={''}
            onSearch={noop}
            nameMapping={{}}
            onSelect={noop}
            selected={0}
            tabs={[
              { name: 'svc-activity.log', lines: 100 },
              { name: 'svc-hypes.log', lines: 100 },
              { name: 'svc-thing.log', lines: 100 },
            ]}
            isAllJSONExpanded={false}
            onToggleExpandAllJSON={noop}
          />
        </Entry>
      </div>
    </SectionW>
  );
};
