import React from 'react';
import { useStore } from '../../context/StoreContext';
// import { MATERIALS } from '../../mockData'; // Removed unused import
import './Layout.css';

const Sidebar = ({ onBack, isOpen, toggleSidebar }) => {
    const { materials, currentRoom, primaryMaterial, setPrimaryMaterial } = useStore();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div style={{
                    color: '#e31e24',
                    fontSize: '3rem',
                    fontWeight: '900',
                    fontFamily: "'Exo 2', sans-serif",
                    letterSpacing: '0.05em',
                    lineHeight: '1',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'flex-start',
                    gap: '2px'
                }}>
                    CEEPEE
                    <sup style={{
                        fontSize: '0.8rem',
                        marginTop: '0.5rem',
                        color: '#ffffffff'
                    }}>®</sup>
                </div>
                {/* Mobile Close Button */}
                <button className="mobile-close-btn" onClick={toggleSidebar}>×</button>

                <div style={{
                    color: '#ffffffff',
                    fontFamily: "'Exo 2', sans-serif",
                    fontWeight: '700',
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingLeft: '5px',
                    paddingRight: '5px'
                }}>
                    <span>MARBLES | TILES | BATHS</span>
                    <span style={{ fontWeight: '500', color: '#ffffffff' }}>SINCE 1980</span>
                </div>
            </div>

            {/* Navigation Back */}
            <button className="sidebar-back-btn" onClick={onBack}>
                ← Back
            </button>

            {/* Tile Selector Section */}
            <div className="sidebar-content">
                <div className="sidebar-section">
                    <h3 className="section-title">Select Tile</h3>
                    <div className="sidebar-material-list">
                        {materials.map(material => (
                            <div
                                key={material.id}
                                className={`sidebar-mat-item ${primaryMaterial?.id === material.id ? 'active' : ''}`}
                                onClick={() => {
                                    setPrimaryMaterial(material);
                                    if (window.innerWidth <= 768) toggleSidebar(); // Close on selection on mobile
                                }}
                            >
                                <div className="sidebar-mat-preview" style={material.textureUrl ? { backgroundImage: `url(${material.textureUrl})` } : { background: '#333' }}>
                                    {/* Optional: Add icons or badges here */}
                                    {material.id === 'mat_none' && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', opacity: 0.5 }}>
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    )}
                                    {material.brightness === 'High' && <span className="expert-pick-dot" title="High Brightness"></span>}
                                </div>
                                <div className="sidebar-mat-info">
                                    <span className="name">{material.name}</span>
                                    {material.id !== 'mat_none' && (
                                        <>
                                            <div className="meta">{material.dimensions}</div>
                                            <div className="meta" style={{ color: material.colorFamily?.toLowerCase() }}>{material.colorFamily}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside >
    );
};

export default Sidebar;
