// frontend/src/components/Post.jsx
import React from 'react';
import { useAuth } from '../AuthContext';

const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// Post component now also receives an onDelete function
function Post({ post, onEdit, onDelete }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const displayTime = formatTimestamp(post.timestamp);

  // Determine if the current user can edit/delete this post
  const canModify = isAuthenticated && (isAdmin || user?.username === post.author);

  return (
    <div key={post._id} className="post-item">
      <div className="post-header">
        <p className="post-date">{displayTime}</p>
        <div className="post-actions"> {/* New div for action buttons */}
          {canModify && (
            <>
              <button className="edit-button" onClick={() => onEdit(post)}>Edit</button>
              <button className="delete-button" onClick={() => onDelete(post._id)}>Delete</button> {/* New Delete button */}
            </>
          )}
        </div>
      </div>
      <p className="post-content">{post.content}</p>
      {post.author && <p className="post-author">By: {post.author}</p>}
    </div>
  );
}

export default Post;