import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './reducers/store';
import { addLine, search } from './reducers/sharedActions';
import { TabView } from './components/TabView';
import { changeIndex, toggleExpandAllJSON, toggleJson } from './reducers/mainViewModelSlice';
import styled from 'styled-components';
import { Messages } from './components/Messages';
import { Storybook } from './storybook';
import { FileSwitcher } from './components/FileSwitcher';
import { ConnectionLossOverlay } from './components/ConnectionLossOverlay';

const Wrapper = styled.div`
  margin: 0;
  padding: 0;
`;

const App = () => {
  const dispatch = useDispatch();
  const nameMapping = useSelector((state: RootState) => state.mainView.nameMapping);
  const log = useSelector((state: RootState) => state.logData);
  const view = useSelector((state: RootState) => state.mainView);
  const fileNames = view.files.map(f => f.name);
  const fileNamesWithIndexes: [string, number][] = fileNames.map((f, i) => [f, i]);

  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showConnectionLoss, setShowConnectionLoss] = useState(false);
  const wsRef = useRef<WebSocket | undefined>(undefined);

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim() === '') return fileNamesWithIndexes;
      else {
        return fileNamesWithIndexes.filter(([file, i]) =>
          file.toLowerCase().includes(query.toLowerCase()),
        );
      }
    },
    [fileNames],
  );

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://127.0.0.1:8088/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setShowConnectionLoss(false);
    };

    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      dispatch(addLine(data));
    };

    ws.onclose = () => {
      setIsConnected(false);
      setShowConnectionLoss(true);
    };

    ws.onerror = () => {
      setIsConnected(false);
      setShowConnectionLoss(true);
    };

    return ws;
  }, [dispatch]);

  useEffect(() => {
    const ws = connectWebSocket();
    return () => ws.close();
  }, [connectWebSocket]);

  const handleReconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connectWebSocket();
  }, [connectWebSocket]);

  const handleCloseTab = useCallback(() => {
    window.close();
  }, []);

  const isStorybook = window.location.href.endsWith('/storybook');
  const { currentFile, logData } = view.searchQuery
    ? { currentFile: 'search', logData: log.searchBuffer }
    : view.currentIndex === 'combined'
      ? { currentFile: 'combined', logData: log.all }
      : {
          currentFile: view.currentIndex,
          logData: log.files[view.files[view.currentIndex]?.name],
        };

  if (isStorybook) {
    return (
      <Wrapper>
        <Storybook />
      </Wrapper>
    );
  } else if (logData) {
    return (
      <Wrapper>
        <Messages
          messages={logData}
          nameMapping={nameMapping}
          fileOrdering={fileNames}
          expandedJson={view.expandedJsonLines[currentFile] ?? {}}
          onSearch={q => dispatch(search(q))}
          onToggleJson={(line, isExpanded) => {
            dispatch(toggleJson({ line, isExpanded }));
          }}
          showAllJSON={view.expandAllJSON}
        />
        <TabView
          query={view.searchQuery}
          simplifyNames
          onSearch={q => dispatch(search(q))}
          onSelect={i => dispatch(changeIndex(i))}
          selected={view.currentIndex}
          tabs={view.files}
          nameMapping={nameMapping}
          isAllJSONExpanded={view.expandAllJSON}
          onToggleExpandAllJSON={() => dispatch(toggleExpandAllJSON())}
        />
        <FileSwitcher
          isOpen={isSearchOpen}
          onTriggered={() => setSearchOpen(true)}
          onClose={() => setSearchOpen(false)}
          onSearch={handleSearch}
          onSelect={i => dispatch(changeIndex(i))}
        />
        {showConnectionLoss && (
          <ConnectionLossOverlay
            onReconnect={handleReconnect}
            onClose={handleCloseTab}
          />
        )}
        <div />
      </Wrapper>
    );
  } else {
    return <div>loading</div>;
  }
};

export default App;
