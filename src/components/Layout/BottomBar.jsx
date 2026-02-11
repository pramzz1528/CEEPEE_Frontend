import React from 'react';
import { useStore } from '../../context/StoreContext';
import './Layout.css';

const BottomBar = () => {
    const {
        materials,
        primaryMaterial,
        setPrimaryMaterial,
        suggestions
    } = useStore();

    // Helper to check if a material is a "suggestion"
    const isSuggested = (matId) => suggestions.some(s => s.id === matId);

    return (
        <div className="bottom-bar">
            <div className="bar-header">
                <h3>Materials</h3>
                <span className="subtitle">Select floor texture</span>
            </div>

            <div className="material-list">
                {materials.map(mat => (
                    <div
                        key={mat.id}
                        className={`material-item ${primaryMaterial?.id === mat.id ? 'active' : ''}`}
                        onClick={() => setPrimaryMaterial(mat)}
                    >
                        <div className="mat-preview" style={{
                            backgroundImage: mat.textureUrl ? `url(${mat.textureUrl})` : 'none',
                            backgroundColor: mat.textureUrl ? 'transparent' : '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {!mat.textureUrl && (
                                <span style={{ fontSize: '24px', color: '#666' }}>🚫</span>
                            )}
                            {isSuggested(mat.id) && <span className="suggestion-badge">Recommended</span>}
                        </div>
                        <div className="mat-info">
                            <span className="mat-name">{mat.name}</span>
                            <span className="mat-meta">{mat.finish} {mat.colorFamily !== 'None' ? `• ${mat.colorFamily}` : ''}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BottomBar;
