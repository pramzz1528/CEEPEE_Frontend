import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ROOMS } from '../../mockData';
import './Layout.css';

const TopBar = ({ onHome, onGallery }) => {
    const { currentRoom, setCurrentRoom } = useStore();
    const [categories, setCategories] = useState({});
    const [activeCategory, setActiveCategory] = useState(null);

    // Group rooms by category on mount
    useEffect(() => {
        const grouped = ROOMS.reduce((acc, room) => {
            const cat = room.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(room);
            return acc;
        }, {});
        // Add 'All' category containing all rooms - though we will treat it specially
        grouped['All'] = ROOMS;
        setCategories(grouped);
    }, []);

    const handleRoomSelect = (room) => {
        setCurrentRoom(room);
        setActiveCategory(null); // Close dropdown
    };

    // Sort categories to have 'All' first, then others
    const sortedCategories = ['All', ...Object.keys(categories).filter(c => c !== 'All').sort()];

    return (
        <div className="top-bar">
            <div className="top-bar-left">
                <span className="top-label">ROOMS:</span>
                <div className="top-nav-menu">
                    {sortedCategories.map(cat => (
                        <div
                            key={cat}
                            className="nav-category"
                            onMouseEnter={() => cat !== 'All' && setActiveCategory(cat)}
                            onMouseLeave={() => setActiveCategory(null)}
                        >
                            <button
                                className={`nav-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => {
                                    if (cat === 'All') {
                                        if (onGallery) onGallery(); // Navigate to Gallery
                                    }
                                }}
                            >
                                {cat}
                            </button>

                            {activeCategory === cat && cat !== 'All' && (
                                <div className={`nav-dropdown ${cat === 'All' ? 'grid-view' : ''}`}>
                                    {categories[cat].map(room => (
                                        <div
                                            key={room.id}
                                            className={`dropdown-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                                            onClick={() => handleRoomSelect(room)}
                                        >
                                            <div className="dropdown-thumb" style={{ backgroundImage: `url(${room.imageUrl})` }} />
                                            <span className="room-name">{room.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="top-bar-right">
                {/* Visualizer controls or specific room settings could go here */}
            </div>
        </div>
    );
};

export default TopBar;
