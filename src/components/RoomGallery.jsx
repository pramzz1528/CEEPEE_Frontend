import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { ROOMS } from '../mockData';
import './RoomGallery.css';

const categories = ['All', 'Living', 'Kitchen', 'Bathroom', 'Dining', 'Bedroom'];

const RoomGallery = ({ onSelect }) => {
    const { setCurrentRoom, setPrimaryMaterial, materials } = useStore();
    const [filter, setFilter] = useState('All');

    const filteredRooms = filter === 'All'
        ? ROOMS
        : ROOMS.filter(room => room.category === filter);

    const handleRoomClick = (room) => {
        setCurrentRoom(room);
        // Reset to "None" material
        const noneMat = materials.find(m => m.id === 'mat_none');
        if (noneMat) setPrimaryMaterial(noneMat);

        onSelect(); // Navigate to Visualizer
    };

    return (
        <div className="gallery-container">
            {/* Top Bar: Title + Scroll Banner */}
            <div className="gallery-top-bar">
                <h2 className="gallery-title">Gallery</h2>

                <div className="scroll-banner-container">
                    <div className="scroll-content">
                        Visualize Your Dream Space • Premium Tiles & Textures • Luxury Surfaces Since 1980 • Visualize Your Dream Space  • Premium Tiles & Textures • Luxury Surfaces Since 1980 •
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="gallery-filters">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`filter-btn ${filter === cat ? 'active' : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Masonry Grid */}
            <div className="gallery-grid">
                <AnimatePresence mode="popLayout">
                    {filteredRooms.map((room) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            key={room.id}
                            className="gallery-card"
                            onClick={() => handleRoomClick(room)}
                        >
                            <img src={room.imageUrl} alt={room.name} className="gallery-img" />

                            {/* Overlay */}
                            <div className="card-overlay">

                                <div className="card-info">
                                    <span className="card-size">Size: 12x14 (sq.ft)</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RoomGallery;
