import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onFinish }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 3000); // 3 seconds total duration
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                background: '#000000ff', // Light theme background
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                overflow: 'hidden'
            }}
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1, 25], opacity: [0, 1, 0] }} // Zoom in -> Hold -> Fly through
                transition={{
                    duration: 3.5,
                    times: [0, 0.4, 1], // Appear quickly, hold briefly, then zoom out
                    ease: "easeInOut"
                }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                {/* Main Logo Text */}
                <div style={{
                    color: '#e31e24', // Red color from logo
                    fontSize: '6rem',
                    fontWeight: '900',
                    fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: '0.05em',
                    lineHeight: '1',
                    textTransform: 'uppercase',
                    display: 'flex',
                    gap: '5px'
                }}>
                    CEEPEE
                    <sup style={{
                        fontSize: '1rem',
                        marginTop: '1.5rem',
                        color: '#ffffffff'
                    }}>®</sup>
                </div>

                {/* Subtext Container */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingTop: '5px',
                    color: '#ffffffff',
                    fontFamily: "'Exo 2', sans-serif",
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    letterSpacing: '0.1em'
                }}>
                    <span>MARBLES | TILES | BATHS</span>
                    <span style={{ color: '#ffffffff', fontWeight: '500' }}>SINCE 1980</span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SplashScreen;
