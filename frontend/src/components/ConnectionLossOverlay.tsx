import React from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  text-align: center;
  min-width: 300px;
  color: #333;
`;

const Title = styled.h2`
  margin: 0 0 16px 0;
  color: #333 !important;
  font-size: 18px;
  font-weight: 600;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ReconnectButton = styled(Button)`
  background: #007bff;
  color: white;

  &:hover {
    background: #0056b3;
  }
`;

const CloseButton = styled(Button)`
  background: #6c757d;
  color: white;

  &:hover {
    background: #545b62;
  }
`;

interface ConnectionLossOverlayProps {
  onReconnect: () => void;
  onClose: () => void;
}

export const ConnectionLossOverlay: React.FC<ConnectionLossOverlayProps> = ({
  onReconnect,
  onClose,
}) => {
  return (
    <Overlay>
      <Modal>
        <Title>Connection lost</Title>
        <ButtonContainer>
          <ReconnectButton onClick={onReconnect}>Reconnect</ReconnectButton>
          <CloseButton onClick={onClose}>Close Tab</CloseButton>
        </ButtonContainer>
      </Modal>
    </Overlay>
  );
};