// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext'; // <--- UPDATED IMPORT
import { useNavigate, Link } from 'react-router-dom';
import './AuthForms.css';
import MessageModal from '../components/MessageModal';

function Register({ onRegisterSuccess }) { // Receive onRegisterSuccess prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // State for local success message modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      await register(username, password);
      // Trigger local success modal
      setSuccessMessage('Registration successful! Please log in.');
      setIsSuccessModalOpen(true);
      // Also call parent's success handler if provided
      if (onRegisterSuccess) {
        onRegisterSuccess('Registration successful! Please log in.');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    }
  };

  const handleInputFocus = () => {
    setError('');
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate('/login'); // Redirect to login page after closing modal
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onFocus={handleInputFocus}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={handleInputFocus}
          required
        />
        <input
          type="password"
          placeholder="Re-enter Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={handleInputFocus}
          required
        />
        <button type="submit">Register</button>
        {error && <p className="error-message">{error}</p>}
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </form>

      {/* Render the MessageModal for registration success */}
      <MessageModal
        isOpen={isSuccessModalOpen}
        message={successMessage}
        onClose={handleCloseSuccessModal}
        type="success"
      />
    </div>
  );
}

export default Register;