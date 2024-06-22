import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Line } from './Line';
import { VList, VListHandle } from 'virtua';

const Wrapper = styled.div`
  position: absolute;
  top: 0;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  padding: 20px;
  background-color: #000a1a;
  color: #fafcdf;
  font-size: 1rem;
`;

const SubpixelRenderingZeroEquivalent = -1.5;

type Props = { messages: string[] };

export const Messages = (props: Props) => {
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
    <Wrapper>
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
          <Line key={index} index={index} line={line} />
        ))}
      </VList>
    </Wrapper>
  );
};
