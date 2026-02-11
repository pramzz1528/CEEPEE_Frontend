import React, { useEffect, useState } from 'react';
import './IntroAnimation.css';

const IntroAnimation = ({ onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onComplete, 1000); // Wait for fade out
        }, 3000); // Animation duration

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className={`intro-container ${!visible ? 'fade-out' : ''}`}>
            <div className="logo-text">
                <span className="letter">c</span>
                <span className="letter">E</span>
                <span className="letter">E</span>
                <span className="letter">P</span>
                <span className="letter">E</span>
                <span className="letter">E</span>
            </div>
        </div>
    );
};

export default IntroAnimation;
