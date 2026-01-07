// frontend/src/pages/UserList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal'; // For user deletion confirmation
import MessageModal from '../components/MessageModal'; // For errors/messages

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function UserList() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for delete confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [usernameToDelete, setUsernameToDelete] = useState('');

  // State for message modal (e.g., if admin tries to delete self)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageModalContent, setMessageModalContent] = useState('');
  const [messageModalType, setMessageModalType] = useState('info');


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      let errorMessage = "Failed to load users.";
      if (err.response && err.response.status === 403) {
        errorMessage = "You do not have permission to view this page.";
      } else if (err.response && err.response.data && err.response.data.msg) {
        errorMessage += ` Server says: ${err.response.data.msg}`;
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
      // Redirect if not authenticated or not admin
      if (!isAuthenticated || !isAdmin) {
        navigate('/'); // Redirect to home
        return;
      }
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  // --- Delete User Logic ---
  const handleDeleteClick = (user) => {
    if (user.is_admin && user.username === 'admin') { // Prevent deleting the default 'admin' user
      setMessageModalContent("Cannot delete the default 'admin' account.");
      setMessageModalType('error');
      setIsMessageModalOpen(true);
      return;
    }
    setUserIdToDelete(user._id);
    setUsernameToDelete(user.username);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    setIsConfirmModalOpen(false);
    if (!userIdToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/users/${userIdToDelete}`);
      setMessageModalContent(`User "${usernameToDelete}" deleted successfully.`);
      setMessageModalType('success');
      setIsMessageModalOpen(true);
      fetchUsers(); // Re-fetch users to update the list
    } catch (err) {
      console.error("Error deleting user:", err);
      let errorMessage = "Failed to delete user.";
      if (err.response && err.response.status === 403) {
        errorMessage = err.response.data.msg || "You do not have permission to delete this user.";
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage += ` Server says: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage += ` Network error: ${err.message}`;
      }
      setMessageModalContent(errorMessage);
      setMessageModalType('error');
      setIsMessageModalOpen(true);
    } finally {
      setUserIdToDelete(null);
      setUsernameToDelete('');
    }
  };

  const cancelDeleteUser = () => {
    setIsConfirmModalOpen(false);
    setUserIdToDelete(null);
    setUsernameToDelete('');
  };
  // --- End Delete User Logic ---


  if (authLoading || loading) {
    return (
      <div className="container">
        <p className="message">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // If not admin, and not loading, show unauthorized message (should be redirected by useEffect)
  if (!isAdmin) {
    return (
      <div className="container">
        <p className="error-message">Unauthorized: Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Manage Users</h2>
      <div className="user-list">
        {users.length === 0 ? (
          <p className="message">No users registered yet (besides yourself, if admin).</p>
        ) : (
          users.map((user) => (
            <div key={user._id} className="user-item">
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Admin:</strong> {user.is_admin ? 'Yes' : 'No'}</p>
              <div className="user-actions">
                <button
                  className="delete-button"
                  onClick={() => handleDeleteClick(user)}
                  disabled={user.username === 'admin'} // Disable delete for the default admin
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        message={`Are you sure you want to delete user "${usernameToDelete}"?`}
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
      />

      <MessageModal
        isOpen={isMessageModalOpen}
        message={messageModalContent}
        onClose={() => setIsMessageModalOpen(false)}
        type={messageModalType}
      />
    </div>
  );
}

export default UserList;