import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './reducers/store';
import { addLine } from './reducers/sharedActions';
import { TabView } from './TabView';
import { changeIndex } from './reducers/mainViewModelSlice';
import styled from 'styled-components';
import { Messages } from './Messages';

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
`;

const App = () => {
  const dispatch = useDispatch();
  const logs = useSelector((state: RootState) => state.logData.files);
  const view = useSelector((state: RootState) => state.mainView);

  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8088/ws');
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      dispatch(addLine(data));
    };

    return () => ws.close();
  }, [dispatch]);

  const filePath = view.files[view.currentIndex];

  return filePath ? (
    <Wrapper>
      <Messages messages={logs[filePath]} />
      <TabView
        onSelect={i => dispatch(changeIndex(i))}
        selected={view.currentIndex}
        tabs={view.files}
      />
    </Wrapper>
  ) : (
    <div>loading</div>
  );
};

export default App;
