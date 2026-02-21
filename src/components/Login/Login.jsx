import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            // Check if response is JSON
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                // If not JSON, it's likely an HTML error page from the proxy or 404
                throw new Error("Cannot connect to server. Please ensure backend is running.");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            if (isRegistering) {
                setIsRegistering(false);
                setError('Registration successful! Please login.');
                setPassword('');
            } else {
                if (onLogin) onLogin(data.user);
            }
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.message || "Failed to connect to server");
        } finally {
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="login-container">
            <div className="login-background-animation"></div>
            <motion.div
                className="login-card"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <motion.h2 variants={itemVariants}>
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </motion.h2>
                <motion.p className="login-subtitle" variants={itemVariants}>
                    {isRegistering ? 'Sign up to get started' : 'Login to access your dashboard'}
                </motion.p>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            className={`error-message ${error.includes('successful') ? 'success' : ''}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            key="error"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    <motion.div className="form-group" variants={itemVariants}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                            disabled={isLoading}
                        />
                    </motion.div>

                    <motion.div className="form-group" variants={itemVariants}>
                        <label htmlFor="password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.includes(' ')) {
                                        setError('Spaces are not allowed in password');
                                        setPassword(val.replace(/\s/g, ''));
                                    } else {
                                        if (error === 'Spaces are not allowed in password') setError('');
                                        setPassword(val);
                                    }
                                }}
                                required
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide Password" : "Show Password"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    <motion.button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <span className="loading-dots">Processing<span>.</span><span>.</span><span>.</span></span>
                        ) : (
                            isRegistering ? 'Sign Up' : 'Login'
                        )}
                    </motion.button>
                </form>

                <motion.div className="login-footer" variants={itemVariants}>
                    <p>
                        {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                        <button
                            type="button"
                            className="link-btn"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                            }}
                            disabled={isLoading}
                        >
                            {isRegistering ? 'Login' : 'Sign Up'}
                        </button>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Login;
