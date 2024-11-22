import { useState, useCallback, useEffect } from 'react';

type Position = {
  top: number;
  left: number;
};

type HighlightCaptureResult = {
  position: Position | undefined;
  highlightedText: string | undefined;
  shouldDisplay: boolean;
  handleMouseUp: (event: MouseEvent, container: HTMLElement) => void;
  handleMouseDown: () => void;
  hideFloater: () => void;
};

export const useHighlightCapture = (): HighlightCaptureResult => {
  const [highlightedText, setHighlightedText] = useState<string | undefined>(undefined);
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [shouldDisplay, setShouldDisplay] = useState(false);

  const handleMouseUp = useCallback((event: MouseEvent, container: HTMLElement) => {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const text = selection.toString();

      if (text.trim()) {
        setHighlightedText(text);

        const rect = range.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const highlightCenterX = rect.left + rect.width / 2 - containerRect.left;
        const highlightCenterY = rect.top + rect.height / 2 - containerRect.top;

        const containerCenterX = containerRect.width / 2;
        const containerCenterY = containerRect.height / 2;

        const isLeft = highlightCenterX < containerCenterX;
        const isTop = highlightCenterY < containerCenterY;

        let top, left;
        if (isTop && isLeft) {
          top = rect.bottom - containerRect.top + container.scrollTop;
          left = rect.right - containerRect.left + container.scrollLeft;
        } else if (isTop && !isLeft) {
          top = rect.bottom - containerRect.top + container.scrollTop;
          left = rect.left - containerRect.left + container.scrollLeft - 24;
        } else if (!isTop && isLeft) {
          top = rect.top - containerRect.top + container.scrollTop - 24;
          left = rect.right - containerRect.left + container.scrollLeft;
        } else {
          top = rect.top - containerRect.top + container.scrollTop - 24;
          left = rect.left - containerRect.left + container.scrollLeft - 24;
        }

        setPosition({ top, left });
        setShouldDisplay(true);
      }
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    setHighlightedText(undefined);
    setPosition(undefined);
    setShouldDisplay(false);
  }, []);

  // floater should dismiss on clicks anywhere on the page
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      setShouldDisplay(false);
    };

    document.addEventListener('mousedown', handleGlobalClick);

    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  return {
    position,
    highlightedText,
    shouldDisplay,
    handleMouseUp,
    handleMouseDown,
    hideFloater: () => setShouldDisplay(false),
  };
};
