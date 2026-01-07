// frontend/src/pages/Register.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForms.css';
import MessageModal from '../components/MessageModal'; // <--- Import MessageModal

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // --- NEW STATE FOR MESSAGE MODAL ---
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // --- END NEW STATE ---

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
      // --- REPLACE alert() WITH MODAL ---
      setSuccessMessage('Registration successful! Please log in.');
      setIsSuccessModalOpen(true);
      // --- END REPLACE ---
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    }
  };

  const handleInputFocus = () => {
    setError('');
  };

  // --- NEW: Handle closing success modal ---
  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    navigate('/login'); // Redirect to login page after closing modal
  };
  // --- END NEW ---

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
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onFocus={handleInputFocus}
          required
        />
        <button type="submit">Register</button>
        {error && <p className="error-message">{error}</p>}
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </form>

      {/* --- RENDER THE MESSAGE MODAL --- */}
      <MessageModal
        isOpen={isSuccessModalOpen}
        message={successMessage}
        onClose={handleCloseSuccessModal}
        type="success"
      />
      {/* --- END RENDER --- */}
    </div>
  );
}

export default Register;