import styled from 'styled-components';

export const Circle = styled.span<{ color: string }>`
  width: 10px;
  height: 10px;
  margin-right: 5px;
  background-color: ${props => props.color};
  border-radius: 50%;
  display: inline-block;
  vertical-align: middle;
`;
