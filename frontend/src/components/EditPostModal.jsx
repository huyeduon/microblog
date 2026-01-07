// frontend/src/components/EditPostModal.jsx
import React, { useState, useEffect } from 'react';
import './EditPostModal.css'; // CSS for the modal

// REMOVED: React-Quill imports
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

function EditPostModal({ isOpen, onClose, postToEdit, onSave }) {
  const [editedContent, setEditedContent] = useState(''); // Plain text string

  // Update editedContent when postToEdit changes (i.e., modal opens with a new post)
  useEffect(() => {
    if (isOpen && postToEdit) {
      setEditedContent(postToEdit.content);
    }
  }, [isOpen, postToEdit]);

  if (!isOpen) return null; // Don't render if not open

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation for plain text
    if (!editedContent.trim()) {
      alert("Post content cannot be empty!"); // Consider using a MessageModal here too
      return;
    }
    onSave(postToEdit._id, editedContent); // Call onSave from App.jsx
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Post</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="Edit your post content here..."
            rows="8" // Give it some height
            required
          ></textarea>
          <div className="modal-actions">
            <button type="submit" className="save-button">Save Changes</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditPostModal;