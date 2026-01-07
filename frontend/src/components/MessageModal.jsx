// frontend/src/components/MessageModal.jsx
import React from 'react';
import './MessageModal.css'; // We'll create this CSS file

function MessageModal({ isOpen, message, onClose, type = 'info' }) {
  if (!isOpen) return null;

  return (
    <div className="message-modal-overlay">
      <div className={`message-modal-content ${type}`}>
        <p>{message}</p>
        <button onClick={onClose} className="message-modal-close-button">OK</button>
      </div>
    </div>
  );
}

export default MessageModal;