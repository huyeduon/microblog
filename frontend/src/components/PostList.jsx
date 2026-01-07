// frontend/src/components/PostList.jsx
import React from 'react';
import Post from './Post';

// PostList component now also receives the onDelete function
function PostList({ posts, loading, error, onEdit, onDelete }) { // <--- Added onDelete prop
  if (loading) {
    return <p className="message">Loading posts...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <p className="message">No posts yet. Be the first to add one!</p>
      ) : (
        posts.map((post) => (
          <Post key={post._id} post={post} onEdit={onEdit} onDelete={onDelete} />
        ))
      )}
    </div>
  );
}

export default PostList;