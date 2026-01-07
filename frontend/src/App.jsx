// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import PostList from './components/PostList';
import EditPostModal from './components/EditPostModal';
import MessageModal from './components/MessageModal';
import ConfirmModal from './components/ConfirmModal';
import { AuthProvider, useAuth } from './AuthContext';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import UserList from './pages/UserList'; // <--- Import UserList

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </Router>
  );
}

function MainAppContent() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postIdToDelete, setPostIdToDelete] = useState(null);

  const { isAuthenticated, user, logout, loading: authLoading, isAdmin } = useAuth();

  // --- NEW: State for MessageModal (global for App) ---
  const [isAppMessageModalOpen, setIsAppMessageModalOpen] = useState(false);
  const [appMessageModalContent, setAppMessageModalContent] = useState('');
  const [appMessageModalType, setAppMessageModalType] = useState('info');
  // --- END NEW ---

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/posts`);
      setPosts(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching posts:", err);
      let errorMessage = "Failed to load posts.";
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage += ` Server says: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage += ` Network error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchPosts();
    }
  }, [authLoading]);

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) {
      // Use MessageModal instead of alert
      setAppMessageModalContent("Post content cannot be empty!");
      setAppMessageModalType('error');
      setIsAppMessageModalOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/posts`, {
        content: newPostContent
      });
      console.log("Post added:", response.data);
      setNewPostContent('');
      fetchPosts();
      setError(null);
    } catch (err) {
      console.error("Error adding post:", err);
      let errorMessage = "Failed to add post.";
      if (err.response && err.response.status === 401) {
        errorMessage = "You must be logged in to add posts.";
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage += ` Server says: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage += ` Network error: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  const handleEditClick = (post) => {
    setPostToEdit(post);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setPostToEdit(null);
    setError(null);
  };

  const handleSaveEditedPost = async (postId, newContent) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/posts/${postId}`, {
        content: newContent
      });
      console.log("Post updated:", response.data);
      handleCloseEditModal();
      fetchPosts();
    } catch (err) {
      console.error("Error updating post:", err);
      let errorMessage = "Failed to update post.";
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        errorMessage = "You are not authorized to edit this post.";
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage += ` Server says: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage += ` Network error: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  const handleDeletePost = (postId) => {
    setPostIdToDelete(postId);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsConfirmModalOpen(false);
    if (!postIdToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/posts/${postIdToDelete}`);
      console.log("Post deleted:", postIdToDelete);
      fetchPosts();
      setError(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      let errorMessage = "Failed to delete post.";
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        errorMessage = "You are not authorized to delete this post.";
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage += ` Server says: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage += ` Network error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setPostIdToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsConfirmModalOpen(false);
    setPostIdToDelete(null);
  };

  // --- NEW: Register Success Modal Handling ---
  const handleRegisterSuccess = (message) => {
    setAppMessageModalContent(message);
    setAppMessageModalType('success');
    setIsAppMessageModalOpen(true);
  };

  const handleCloseAppMessageModal = () => {
    setIsAppMessageModalOpen(false);
    // If it was a registration success message, navigate to login
    if (appMessageModalType === 'success' && appMessageModalContent.includes('Registration successful')) {
      // This part is now handled by Register.jsx directly, but leaving the logic here
      // if you decide to centralize message handling.
    }
  };
  // --- END NEW ---


  if (authLoading) {
    return (
      <div className="container">
        <p className="message">Loading authentication status...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-nav">
        <Link to="/" className="blog-title-link">
          <h1>Tech Notes</h1>
        </Link>
        <nav>
          {isAuthenticated ? (
            <>
              <span className="welcome-message">Hello, {user?.username} {isAdmin && "(Admin)"}!</span>
              {isAdmin && ( // <--- NEW: Admin Link
                <Link to="/users" className="nav-text-link">Manage Users</Link>
              )}
              <Link to="/" onClick={logout} className="nav-text-link">Logout</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-text-link">Login</Link>
              <Link to="/register" className="nav-text-link">Register</Link>
            </>
          )}
        </nav>
      </div>

      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Pass handleRegisterSuccess to Register */}
        <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
        <Route path="/users" element={<UserList />} /> {/* <--- NEW: UserList Route */}
        <Route path="/" element={
          <>
            {isAuthenticated && (
              <form onSubmit={handleAddPost} className="post-form">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows="4"
                  required
                ></textarea>
                <button type="submit">Add New Post</button>
              </form>
            )}
            {error && <p className="error-message">{error}</p>}
            <PostList posts={posts} loading={loading} error={error} onEdit={handleEditClick} onDelete={handleDeletePost} />
          </>
        } />
      </Routes>

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        postToEdit={postToEdit}
        onSave={handleSaveEditedPost}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message="Are you sure you want to delete this post?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Global MessageModal for App-level messages */}
      <MessageModal
        isOpen={isAppMessageModalOpen}
        message={appMessageModalContent}
        onClose={handleCloseAppMessageModal}
        type={appMessageModalType}
      />
    </div>
  );
}

export default App;