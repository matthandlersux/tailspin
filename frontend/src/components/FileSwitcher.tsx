import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { indexToColor } from '../utils/colorHash';
import { Circle } from './circle';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 40vh;
`;

const SearchBoxContainer = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 400px;
  max-width: 90%;
  z-index: 1001;
  max-height: 60vh;
  overflow-y: auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  margin-bottom: 10px;
  box-sizing: border-box;
`;

const ResultsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  margin-top: 5px;
`;

const ResultItem = styled.li<{ isSelected: boolean }>`
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  background-color: ${({ isSelected }) => (isSelected ? '#f0f0f0' : 'transparent')};
  &:hover {
    background-color: #f5f5f5;
  }

  ${Circle} {
    margin-right: 15px;
  }
`;

type Props = {
  isOpen: boolean;
  onTriggered: () => void;
  onClose: () => void;
  onSearch: (query: string) => [name: string, index: number][];
  onSelect: (i: number) => void;
};

export const FileSwitcher = ({ isOpen, onTriggered, onClose, onSearch, onSelect }: Props) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<[name: string, index: number][]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(event);
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        if (!isOpen) {
          setQuery('');
          setResults([]);
          setSelectedIndex(-1);
          onTriggered();
        }
      } else if (event.key == 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const searchResults = onSearch(query);
    setResults(searchResults);
    setSelectedIndex(searchResults.length > 0 ? 0 : -1);
  }, [query, onSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
      onSelect(results[selectedIndex][1]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <SearchBoxContainer onClick={e => e.stopPropagation()}>
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search files..."
          autoFocus
        />
        <ResultsList>
          {results.map((result, index) => (
            <ResultItem
              key={index}
              isSelected={index === selectedIndex}
              onClick={() => {
                onSelect(result[1]);
                onClose();
              }}
            >
              <Circle color={indexToColor(result[1])} />
              {result[0]}
            </ResultItem>
          ))}
        </ResultsList>
      </SearchBoxContainer>
    </Overlay>
  );
};
