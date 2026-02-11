import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // FIX: Changed from '/api' to '/api/auth' to match server routes
    const API_URL = import.meta.env.VITE_API_URL || '/api/auth';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/login' : '/register';

        try {
            console.log(`Attempting to connect to: ${API_URL}${endpoint}`);
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            // Check for JSON response (handles 404/500 HTML pages from proxy)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Non-JSON Response:", text);
                throw new Error("Unable to connect to the server. Please ensure the backend is running.");
            }

            const data = await response.json();

            if (!response.ok) {
                // Handle specific status codes if needed
                if (response.status === 404) {
                    throw new Error("API endpoint not found. Check server configuration.");
                }
                throw new Error(data.message || 'Authentication failed');
            }

            // Success logic
            if (!isLogin) {
                // Registration successful -> Switch to Login view
                setIsLogin(true); // Switch to Login
                setError('Registration successful! Please login.');
                setPassword(''); // Clear password
            } else {
                // Login successful -> Enter App
                onLogin(data.user);
            }

        } catch (err) {
            console.error("Auth Error:", err);
            if (err.message === 'Failed to fetch') {
                setError('Network error: Cannot reach the server. Is it running?');
            } else {
                setError(err.message || 'An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3,
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 120, damping: 20 }
        }
    };

    return (
        <div className="login-container">
            <motion.div
                className="login-box"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                whileHover={{ boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}
            >
                <motion.div variants={itemVariants} className="login-header">
                    <h1>CEEPEE</h1>
                    <p>MARBLES | TILES | BATHS</p>
                </motion.div>

                <motion.h2 variants={itemVariants} className="form-title">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </motion.h2>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.9 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.9 }}
                            className={`error-message ${error.includes('successful') ? 'success-message' : ''}`}
                            style={error.includes('successful') ? { backgroundColor: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50', color: '#4CAF50' } : {}}
                        >
                            <span className="error-icon">{error.includes('successful') ? '✅' : '⚠️'}</span> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.form variants={itemVariants} onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter username"
                        />
                    </div>
                    <div className="input-group password-group">
                        <label>Password</label>
                        <div className="password-input-wrapper" style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter password"
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                className="toggle-password-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 0
                                }}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "#ff4d4d" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                Processing...
                            </motion.span>
                        ) : (isLogin ? 'Login' : 'Info Up & Start')}
                    </motion.button>
                </motion.form>

                <motion.div variants={itemVariants} className="toggle-auth">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <span onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}>
                            {isLogin ? 'Register' : 'Login'}
                        </span>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
