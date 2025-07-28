import React from 'react';
import { Entry, SectionW } from '../utils';
import { ConnectionLossOverlay } from '../../components/ConnectionLossOverlay';
import { InnerMessages as Messages, Wrapper as MessagesWrapper } from '../../components/Messages';
import { TabView } from '../../components/TabView';
import styled from 'styled-components';
import { noop } from '../utils';

const AppContainer = styled.div`
  position: relative;
  width: 100%;
  height: 600px;
  background: #1e1e1e;
  border: 1px solid #333;
  overflow: hidden;
  transform: translateZ(0);
  contain: layout style paint;
  isolation: isolate;
`;

const MockApp = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const OverlayWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const mockMessages = [
  'INFO Starting application server on port 8080',
  'DEBUG Database connection established',
  'WARN Configuration file not found, using defaults',
  JSON.stringify({ level: 'info', msg: 'User login', user_id: 12345, timestamp: Date.now() }),
  'ERROR Failed to process request: timeout after 30s',
  JSON.stringify({ level: 'error', msg: 'Database query failed', error: 'Connection timeout', query: 'SELECT * FROM users', timestamp: Date.now() }),
  'INFO Processing batch job 1/10',
  'INFO Processing batch job 2/10',
  'WARN Memory usage at 85%',
  JSON.stringify({ level: 'warn', msg: 'High memory usage detected', memory_percent: 85, available_mb: 512, timestamp: Date.now() }),
];

const mockTabs = [
  { name: 'app.log', lines: 150 },
  { name: 'database.log', lines: 45 },
  { name: 'auth.log', lines: 23 },
  { name: 'worker.log', lines: 89 },
];

const AppWithOverlay = () => {
  return (
    <AppContainer>
      <MockApp>
        <MessagesWrapper style={{ flex: 1, position: 'relative' }}>
          <Messages
            messages={mockMessages}
            nameMapping={{ 'app.log': 'app', 'database.log': 'db', 'auth.log': 'auth', 'worker.log': 'worker' }}
            fileOrdering={['app.log', 'database.log', 'auth.log', 'worker.log']}
            expandedJson={{}}
            onToggleJson={noop}
            onSearch={noop}
            showAllJSON={false}
          />
        </MessagesWrapper>
        <TabView
          query=""
          simplifyNames
          onSearch={noop}
          onSelect={noop}
          selected={0}
          tabs={mockTabs}
          nameMapping={{ 'app.log': 'app', 'database.log': 'db', 'auth.log': 'auth', 'worker.log': 'worker' }}
          isAllJSONExpanded={false}
          onToggleExpandAllJSON={noop}
        />
      </MockApp>
      <OverlayWrapper>
        <ConnectionLossOverlay
          onReconnect={() => alert('Reconnect clicked!')}
          onClose={() => alert('Close tab clicked!')}
        />
      </OverlayWrapper>
    </AppContainer>
  );
};

export const ConnectionLossSection = () => {
  return (
    <SectionW>
      <h2>Connection Loss Overlay</h2>
      <div>
        <Entry title="Overlay on Real App">
          <AppWithOverlay />
        </Entry>
      </div>
    </SectionW>
  );
};