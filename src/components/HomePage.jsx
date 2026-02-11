import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { ROOMS } from '../mockData';
import './HomePage.css';

const HomePage = ({ onStart }) => {
    const [currentBg, setCurrentBg] = useState(0);

    // Rotating background effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBg(prev => (prev + 1) % ROOMS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="home-container">
            {/* Background Slideshow */}
            {ROOMS.map((room, index) => (
                <div
                    key={room.id}
                    className={`home-bg ${index === currentBg ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${room.imageUrl})` }}
                />
            ))}
            <div className="home-overlay" />

            <div className="home-content">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="home-brand"
                    style={{ color: '#e31e24', letterSpacing: '4px', fontWeight: '900' }}
                >
                    CEEPEE
                    <span style={{ display: 'block', fontSize: '14px', color: '#fff', fontWeight: '400', letterSpacing: '6px', marginTop: '5px' }}>
                        MARBLES | TILES | BATHS
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="home-title"
                >
                    Luxury Surfaces. <br /> Since 1980.
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="home-subtitle"
                >
                    Experience the future of interior design with our visualizer.
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.5 }}
                    whileTap={{ scale: 0.5 }}
                    transition={{ duration: 0.5 }}
                    className="home-cta-btn"
                    onClick={onStart}
                >
                   Explore Features
                </motion.button>
            </div>
        </div>
    );
};
export default HomePage;
