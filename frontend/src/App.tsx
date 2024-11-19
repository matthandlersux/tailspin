import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './reducers/store';
import { addLine, search } from './reducers/sharedActions';
import { TabView } from './components/TabView';
import { changeIndex } from './reducers/mainViewModelSlice';
import styled from 'styled-components';
import { Messages } from './components/Messages';
import { Storybook } from './storybook';

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
`;

const App = () => {
  const dispatch = useDispatch();
  const nameMapping = useSelector((state: RootState) => state.mainView.nameMapping);
  const log = useSelector((state: RootState) => state.logData);
  const view = useSelector((state: RootState) => state.mainView);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8088/ws');
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      dispatch(addLine(data));
    };

    return () => ws.close();
  }, [dispatch]);

  const isStorybook = window.location.href.endsWith('/storybook');
  const logData = view.searchQuery
    ? log.searchBuffer
    : view.currentIndex === 'combined'
      ? log.all
      : log.files[view.files[view.currentIndex]];

  if (isStorybook) {
    return (
      <Wrapper>
        <Storybook />
      </Wrapper>
    );
  } else if (logData) {
    return (
      <Wrapper>
        <Messages messages={logData} nameMapping={nameMapping} fileOrdering={view.files} />
        <TabView
          query={view.searchQuery}
          simplifyNames
          onSearch={q => dispatch(search(q))}
          onSelect={i => dispatch(changeIndex(i))}
          selected={view.currentIndex}
          tabs={view.files}
          nameMapping={nameMapping}
        />
      </Wrapper>
    );
  } else {
    return <div>loading</div>;
  }
};

export default App;
