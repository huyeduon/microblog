// frontend/src/components/ConfirmModal.jsx
import React from 'react';
import './ConfirmModal.css'; // We'll create this CSS file

function ConfirmModal({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button onClick={onConfirm} className="confirm-button confirm-yes">Yes</button>
          <button onClick={onCancel} className="confirm-button confirm-no">No</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;