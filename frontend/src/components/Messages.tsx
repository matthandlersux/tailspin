import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Line } from './Line';
import { VList, VListHandle } from 'virtua';
import { LogEntry } from '../reducers/logDataSlice';
import { useHighlightCapture } from '../utils/useHighlightCapture';

export const Wrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  background-color: #000a1a;
  color: #fafcdf;
  font-size: 1rem;
  font-family: monospace;
`;

const FloatingBox = styled.div<{ top: number; left: number }>`
  position: absolute;
  top: ${props => props.top}px;
  left: ${props => props.left}px;
  background-color: #fff;
  border-radius: 50%;
  padding: 1px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 24px;
  height: 24px;
  text-align: center;

  div {
    border: 0;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
  }
`;

const SubpixelRenderingZeroEquivalent = -1.5;

type Props = {
  messages: (string | LogEntry)[];
  nameMapping: Record<string, string>;
  fileOrdering: string[];
  expandedJson: Record<number, boolean>;
  onToggleJson: (line: number, isExpanded: boolean) => void;
  showAllJSON: boolean;
  onSearch: (q: string) => void;
};

export const Messages = (props: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { position, highlightedText, shouldDisplay, handleMouseDown, handleMouseUp, hideFloater } =
    useHighlightCapture();

  return (
    <Wrapper
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={e => {
        if (containerRef.current) handleMouseUp(e.nativeEvent, containerRef.current);
      }}
    >
      <InnerMessages {...props} />
      {shouldDisplay && position && highlightedText && (
        <FloatingBox top={position.top} left={position.left} onMouseDown={e => e.stopPropagation()}>
          <div
            onClick={e => {
              props.onSearch(highlightedText);
              hideFloater();
            }}
          >
            🔎
          </div>
        </FloatingBox>
      )}
    </Wrapper>
  );
};

export const InnerMessages = (props: Props) => {
  const ref = useRef<VListHandle>(null);
  const shouldStickToBottom = useRef(true);

  useEffect(() => {
    if (!ref.current) return;
    if (!shouldStickToBottom.current) return;
    ref.current.scrollToIndex(props.messages.length - 1, {
      align: 'end',
    });
  }, [props.messages.length]);

  return (
    <VList
      ref={ref}
      style={{ height: '100%' }}
      onScroll={offset => {
        if (!ref.current) return;
        shouldStickToBottom.current =
          offset - ref.current.scrollSize + ref.current.viewportSize >=
          SubpixelRenderingZeroEquivalent;
      }}
    >
      {props.messages.map((line, index) => (
        <Line
          key={index}
          index={index}
          line={line}
          nameMapping={props.nameMapping}
          fileOrdering={props.fileOrdering}
          showJson={props.expandedJson[index]}
          onToggleJson={toggle => props.onToggleJson(index, toggle)}
          showAllJson={props.showAllJSON}
        />
      ))}
    </VList>
  );
};
