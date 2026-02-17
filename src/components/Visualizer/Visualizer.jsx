
import React, { useRef, useEffect, useState } from 'react';
import jsPDF from "jspdf";
import { useStore } from '../../context/StoreContext';
import { drawWarpedImage } from './CanvasUtils';
import './Visualizer.css';

const Visualizer = ({ isSidebarOpen, toggleSidebar }) => {
    console.log("Visualizer Component Rendering");
    const canvasRef = useRef(null);
    const frameRef = useRef(null);
    const containerRef = useRef(null);
    const { currentRoom, primaryMaterial, setPrimaryMaterial } = useStore();

    // New states and effects from the instruction
    const [isLoading, setIsLoading] = useState(true);
    const [resultImage, setResultImage] = useState(null); // Store the generated/processed image

    useEffect(() => {
        // Mock loading for initial room load
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, [currentRoom]);

    const handleDownload = (format) => {
        alert(`Downloading as ${format}... (Feature pending implementation)`);
    };
    // End of new states and effects from the instruction

    // Use Refs for images to avoid re-renders on every load progress
    // But we need state to trigger redraw when loaded
    // Use Refs for images to avoid re-renders on every load progress
    // But we need state to trigger redraw when loaded
    const [roomImg, setRoomImg] = useState(null);
    const [matImg, setMatImg] = useState(null);
    const [aiResultImg, setAiResultImg] = useState(null); // The "After" image
    const [sliderValue, setSliderValue] = useState(50);   // 0 to 100

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [baseRoomImg, setBaseRoomImg] = useState(null);
    const [frameRatio, setFrameRatio] = useState(null);

    // Zoom & Pan State
    const [zoom, setZoom] = useState(1.35); // Default zoomed in for "bigger" feel
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Slider Drag State
    const isResizing = useRef(false);

    // Handle Wheel Zoom
    const handleWheel = (e) => {
        const scaleAmount = -e.deltaY * 0.001;
        setZoom(prevZoom => {
            const newZoom = prevZoom + scaleAmount;
            return Math.min(Math.max(1.0, newZoom), 4.0); // Clamp between 1x and 4x
        });
    };

    // Handle Interactions (Pan vs Slider)
    const handleMouseDown = (e) => {
        if (!frameRef.current) return;

        lastMousePos.current = { x: e.clientX, y: e.clientY };

        // Check if clicking near the slider line (only if AI image exists)
        if (aiResultImg) {
            const rect = frameRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const frameWidth = rect.width;
            const sliderPos = (sliderValue / 100) * frameWidth;

            // buffer of 40px for easier grabbing
            if (Math.abs(clickX - sliderPos) < 40) {
                isResizing.current = true;
                return; // Don't start pan
            }
        }

        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        // 1. Handle Slider Resizing
        if (isResizing.current && frameRef.current) {
            const rect = frameRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const newValue = (x / rect.width) * 100;
            setSliderValue(Math.min(Math.max(0, newValue), 100)); // Clamp 0-100
            return;
        }

        // 2. Handle Image Panning
        if (!isDragging) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        setPan(prevPan => ({
            x: prevPan.x + dx,
            y: prevPan.y + dy
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        isResizing.current = false;
    };

    // Reset Pan/Zoom when room changes
    useEffect(() => {
        setZoom(1.35);
        setPan({ x: 0, y: 0 });
    }, [currentRoom]);


    // Image Cache (Simple in-memory)
    const imageCache = useRef({});

    const loadImage = (src, isRoom, setAsBase = false) => {
        if (!src) {
            console.error("loadImage called with null src");
            return;
        }

        // Return existing if cached
        if (imageCache.current[src]) {
            if (isRoom) {
                setRoomImg(imageCache.current[src]);
                if (setAsBase) {
                    setBaseRoomImg(imageCache.current[src]);
                    setFrameRatio(imageCache.current[src].width / imageCache.current[src].height);
                }
            }
            else {
                setMatImg(imageCache.current[src]);
            }
            return;
        }

        console.log(`[Visualizer] Loading image: ${src}`);
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous"; // Keep this for canvas export

        img.onload = () => {
            console.log(`[Visualizer] Loaded image successfully: (W:${img.width} x H:${img.height}) ${src}`);
            imageCache.current[src] = img;
            if (isRoom) {
                setRoomImg(img);
                if (setAsBase) {
                    setBaseRoomImg(img);
                    setFrameRatio(img.width / img.height);
                }
            }
            else {
                setMatImg(img);
            }
        };

        img.onerror = (err) => {
            console.error(`[Visualizer] Failed to load image: ${src}`, err);
            setStatusMessage(`Error loading image: ${src}`); // Show on UI
            if (isRoom && setAsBase) {
                alert(`Failed to load room image: ${src}. Check console for details.`);
            }
        };
    };

    // Load Room Image
    useEffect(() => {
        if (!currentRoom) {
            console.warn("[Visualizer] No currentRoom set");
            return;
        }
        console.log("[Visualizer] currentRoom changed:", currentRoom.id, currentRoom.imageUrl);
        loadImage(currentRoom.imageUrl, true, true);
        setAiResultImg(null); // Reset AI result when room changes
    }, [currentRoom]);

    // Track if we should show the client-side warp overlay
    const [showClientPreview, setShowClientPreview] = useState(true);

    // ... [Inside useEffect for primaryMaterial change]
    useEffect(() => {
        if (!primaryMaterial || primaryMaterial.id === 'mat_none') {
            setMatImg(null);
            setIsTransitioning(false);
            return;
        }
        setIsTransitioning(true);
        setShowClientPreview(true); // Reset to show preview initially
        loadImage(primaryMaterial.textureUrl, false);
    }, [primaryMaterial]);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        const frame = frameRef.current;
        // Proceed even if currentRoom is null (to show "No Room" message)
        if (!canvas || !frame) return;

        const ctx = canvas.getContext('2d');

        // Allow wheel event on canvas container to prevent page scroll when zooming
        const preventDefaultWheel = (e) => {
            e.preventDefault();
        };

        frame.addEventListener('wheel', preventDefaultWheel, { passive: false });


        const render = () => {
            const baseImg = baseRoomImg || roomImg; // The "Before" image
            const frameRect = frame.getBoundingClientRect();
            const frameWidth = Math.max(1, frameRect.width);
            const frameHeight = Math.max(1, frameRect.height);

            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(frameWidth * dpr);
            canvas.height = Math.floor(frameHeight * dpr);
            canvas.style.width = `${frameWidth}px`;
            canvas.style.height = `${frameHeight}px`;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, frameWidth, frameHeight);

            if (baseImg) {
                // Calculate containment logic for base image
                // Use state-based ZOOM
                const scale = Math.min(frameWidth / baseImg.width, frameHeight / baseImg.height) * zoom;

                const drawWidth = baseImg.width * scale;
                const drawHeight = baseImg.height * scale;

                // Center + Pan Offset
                const offsetX = (frameWidth - drawWidth) / 2 + pan.x;
                const offsetY = (frameHeight - drawHeight) / 2 + pan.y;

                // 1. Draw "Before" Image (Base Room)
                ctx.drawImage(baseImg, offsetX, offsetY, drawWidth, drawHeight);

                // 2. Client-side Preview (Warped Material on Before Image)
                // Only if no AI result or if transparent? currently just if showClientPreview
                if (showClientPreview && matImg && currentRoom.floorCoordinates) {
                    const scaledCoords = currentRoom.floorCoordinates.map(p => ({
                        x: p.x * scale + offsetX,
                        y: p.y * scale + offsetY
                    }));
                    try {
                        drawWarpedImage(ctx, matImg, scaledCoords);
                    } catch (err) {
                        console.error("Error drawing warped image:", err);
                    }
                    setIsTransitioning(false);
                }

                // 3. Draw "After" Image (AI Result) with Clipper
                if (aiResultImg) {
                    const splitX = frameWidth * (sliderValue / 100);

                    ctx.save();
                    ctx.beginPath();

                    // CLIP RIGHT SIDE for Generated Image (Standard "Before | After" layout)
                    // Left Side (0 to splitX) = Original (Base)
                    // Right Side (splitX to Width) = Generated (AI)
                    ctx.rect(splitX, 0, frameWidth - splitX, frameHeight);
                    ctx.clip();

                    // Draw AI Result with same containment & pan
                    ctx.drawImage(aiResultImg, offsetX, offsetY, drawWidth, drawHeight);

                    ctx.restore();

                    // 4. Draw Slider Line
                    ctx.beginPath();
                    ctx.moveTo(splitX, 0);
                    ctx.lineTo(splitX, frameHeight);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Slider Handle Circle - Styled like reference
                    // Outer dark circle
                    ctx.beginPath();
                    ctx.arc(splitX, frameHeight / 2, 18, 0, Math.PI * 2);
                    ctx.fillStyle = '#1a1a1a'; // Dark grey/black
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Arrows
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    // Left Arrow
                    ctx.moveTo(splitX - 4, frameHeight / 2);
                    ctx.lineTo(splitX - 1, frameHeight / 2 - 4);
                    ctx.lineTo(splitX - 1, frameHeight / 2 + 4);
                    // Right Arrow
                    ctx.moveTo(splitX + 4, frameHeight / 2);
                    ctx.lineTo(splitX + 1, frameHeight / 2 - 4);
                    ctx.lineTo(splitX + 1, frameHeight / 2 + 4);
                    ctx.fill();

                }
            } else {
                // Draw valid debug info on canvas instead of just black rect
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, frameWidth, frameHeight);

                ctx.fillStyle = '#666';
                ctx.font = '16px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Loading Image...', frameWidth / 2, frameHeight / 2);
                if (currentRoom) {
                    ctx.font = '12px sans-serif';
                    ctx.fillText(currentRoom.imageUrl, frameWidth / 2, frameHeight / 2 + 25);
                } else {
                    ctx.fillText('No Room Selected', frameWidth / 2, frameHeight / 2 + 25);
                }
            }
        };

        render();

        const handleResize = () => render();
        window.addEventListener('resize', handleResize);

        // Clean up
        return () => {
            window.removeEventListener('resize', handleResize);
            frame.removeEventListener('wheel', preventDefaultWheel);
        }
    }, [roomImg, matImg, currentRoom, baseRoomImg, showClientPreview, aiResultImg, sliderValue, zoom, pan]); // Dependencies include zoom, pan

    // --- AI Visualization Logic ---
    const [isVisualizing, setIsVisualizing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [timeoutId, setTimeoutId] = useState(null);

    // Auto-Trigger Logic
    const lastMaterialId = useRef(null);

    const [generatedUrl, setGeneratedUrl] = useState(null); // Track AI result for Compare

    useEffect(() => {
        if (!currentRoom || !primaryMaterial) return;

        // HANDLE NONE TILE RESET
        if (primaryMaterial.id === 'mat_none') {
            loadImage(currentRoom.imageUrl, false); // Reset to original
            setIsVisualizing(false);
            setStatusMessage(null);
            setGeneratedUrl(null); // Clear generated URL
            lastMaterialId.current = 'mat_none';
            return;
        }

        // Check if this is the first time we're seeing a material (Initial Load)
        if (lastMaterialId.current === null) {
            lastMaterialId.current = primaryMaterial.id;
            return; // Skip initial load
        }

        if (lastMaterialId.current === primaryMaterial.id) {
            return; // Skip if no change
        }

        // It's a verified change
        lastMaterialId.current = primaryMaterial.id;

        // Debounce: Wait 400ms after selection to trigger AI
        if (timeoutId) clearTimeout(timeoutId);

        const id = setTimeout(() => {
            handleVisualize();
        }, 400);

        setTimeoutId(id);

        return () => clearTimeout(id);
    }, [primaryMaterial, currentRoom]);

    const handleVisualize = async () => {
        if (!currentRoom || !primaryMaterial) return;

        setIsVisualizing(true);
        setStatusMessage("Creating realistic visualization...");

        try {
            const { visualizeInteraction } = await import('../../services/geminiService');

            // Pass the URL strings as well
            const { imageUrl } = await visualizeInteraction(
                currentRoom.id,
                primaryMaterial.id,
                currentRoom.imageUrl,
                primaryMaterial.textureUrl
            );

            if (imageUrl) {
                console.log("[Visualizer] Received new AI image.");
                // Load into AI Result state instead of replacing base room
                const img = new Image();
                img.src = imageUrl;
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    setAiResultImg(img);
                    setGeneratedUrl(imageUrl);
                    setShowClientPreview(false);
                    setStatusMessage('✓ New Design Applied!');
                    setSliderValue(50); // Reset slider to center
                };
            }
        } catch (error) {
            console.error("Visualization failed:", error);
            setStatusMessage("⚠ Visualization failed. Please try again.");
        } finally {
            setIsVisualizing(false);
            // Clear status message after 3 seconds
            setTimeout(() => setStatusMessage(""), 3000);
        }
    };

    // --- Compare Logic ---
    const handleCompare = (showOriginal) => {
        if (!generatedUrl) return;

        if (showOriginal) {
            loadImage(currentRoom.imageUrl, true); // Show Original
        } else {
            loadImage(generatedUrl, true); // Show AI Result
        }
    };

    // --- Smart Share Logic (Image + WhatsApp) ---
    const handleSmartShare = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            // 1. Convert Canvas to Blob (File)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            const file = new File([blob], 'CEEPEE-design.jpg', { type: 'image/jpeg' });

            // 2. Prepare Data
            const text = `Check out this design from CEEPEE Marbles!\nRoom: ${currentRoom?.name} \nTile: ${primaryMaterial?.name} `;
            const title = "My CEEPEE Design";

            // 3. Check for Native Sharing (Mobile)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: title,
                    text: text,
                    files: [file],
                });
            } else {
                // 4. Desktop Fallback: Copy Image to Clipboard + Open WhatsApp

                // Copy Image to Clipboard
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            [blob.type]: blob
                        })
                    ]);
                    // Nice UX: Non-blocking feedback
                    setStatusMessage("✅ Photo copied! Press Ctrl+V in WhatsApp to send.");
                } catch (clipboardError) {
                    console.warn("Clipboard write failed", clipboardError);
                    handleDownloadImage(); // Download instead
                    setStatusMessage("✅ Photo downloaded! Attach it in WhatsApp.");
                }

                // Open WhatsApp Web with text pre-filled
                const businessNumber = "917902333204"; // CEEPEE's WhatsApp Business Number
                const encodedText = encodeURIComponent(text);
                const url = `https://wa.me/${businessNumber}?text=${encodedText}`;

                // Slight delay so user sees the "Copied" message before tab switch
                setTimeout(() => {
                    window.open(url, '_blank');
                }, 800);
            }
        } catch (error) {
            console.error("Sharing failed:", error);
            setStatusMessage("Sharing failed. Try downloading.");
        }
    };

    // --- Image Download Logic ---
    const handleDownloadImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const imgData = canvas.toDataURL('image/jpeg', 1.0); // High quality JPG
            const link = document.createElement('a');
            link.href = imgData;
            link.download = 'CEEPEE-design.jpg';
            link.click();
        } catch (error) {
            console.error("Image download failed:", error);
            alert("Failed to download image. This is likely due to security restrictions on the room image source (CORS).");
        }
    };

    // --- PDF Download Logic ---
    const handleDownloadPDF = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            // 1. Get Image Data from Canvas
            const imgData = canvas.toDataURL('image/png');

            // 2. Create PDF
            // Orientation depends on canvas aspect ratio
            const orientation = canvas.width > canvas.height ? 'l' : 'p';
            const doc = new jsPDF(orientation, 'mm', 'a4');

            // 3. Calculate Dimensions to fit A4
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = pageWidth;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Center vertically if needed, or just draw
            // If height exceeds page, scale by height instead
            let finalWidth = pdfWidth;
            let finalHeight = pdfHeight;
            let x = 0;
            let y = 0;

            if (pdfHeight > pageHeight) {
                finalHeight = pageHeight;
                finalWidth = (imgProps.width * finalHeight) / imgProps.height;
                x = (pageWidth - finalWidth) / 2; // Center horizontally
            } else {
                y = (pageHeight - finalHeight) / 2; // Center vertically
            }

            doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            doc.save('viza-design.pdf');
        } catch (error) {
            console.error("PDF download failed:", error);
            alert("Failed to generate PDF. This is likely due to security restrictions on the room image source (CORS).");
        }
    };

    return (
        <div className={`visualizer-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} ref={containerRef}>
            <div
                ref={frameRef}
                className={`visualizer-frame ${isDragging ? 'dragging' : ''}`}
                style={{
                    '--frame-ratio': frameRatio,
                    cursor: isDragging ? 'grabbing' : (aiResultImg ? 'default' : 'grab'),
                    touchAction: 'none' // Prevent mobile scrolling
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={canvasRef} className="visualizer-canvas" />

                {/* Comparison Slider Input */}
                {aiResultImg && (
                    <>
                        {/* Custom Slider Interaction handled via Frame events now */}
                        <div
                            className="comparison-labels"
                            style={{ left: `${sliderValue}%` }}
                        >
                            <div className="comp-label original">Original</div>
                            <div className="comp-label generated">Generated</div>
                        </div>
                    </>
                )}
            </div>

            {/* Loading Overlay */}
            {isVisualizing && (
                <div className="visualizer-overlay">
                    <div className="tile-loader">
                        <div className="tile-cube"></div>
                        <div className="tile-cube"></div>
                        <div className="tile-cube"></div>
                        <div className="tile-cube"></div>
                    </div>
                    <div className="loader-text">Working on it...</div>
                </div>
            )}





            {/* Status Message removed as per user request */}

            {/* Download Buttons Group */}
            <div className="visualizer-actions">
                {/* Compare Button removed as per user request */}

                <button className="visualizer-icon-btn whatsapp-btn" onClick={handleSmartShare} title="Share on WhatsApp">
                    {/* WhatsApp Icon */}
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67Z" />
                        <path d="M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.69C7.02 10.9 7.9 12.06 8.02 12.22C8.14 12.38 9.76 14.88 12.24 15.95C14.31 16.85 14.73 16.67 15.18 16.63C15.63 16.59 16.62 16.04 16.83 15.45C17.04 14.86 17.04 14.36 16.98 14.26C16.92 14.16 16.77 14.1 16.54 13.99C16.31 13.88 15.18 13.32 14.97 13.24C14.76 13.16 14.61 13.12 14.46 13.34C14.31 13.56 13.88 14.06 13.75 14.21C13.62 14.36 13.49 14.38 13.26 14.27C13.03 14.16 12.29 13.91 11.41 13.13C10.73 12.52 10.27 11.77 10.14 11.54C10.01 11.31 10.13 11.19 10.24 11.08C10.34 10.98 10.47 10.82 10.59 10.68C10.71 10.54 10.75 10.43 10.83 10.27C10.91 10.11 10.87 9.97 10.81 9.85C10.75 9.73 10.27 8.54 10.07 8.05C9.87 7.57 9.67 7.64 9.53 7.63C9.4 7.63 9.24 7.63 9.08 7.63C8.92 7.63 8.7 7.33 8.53 7.33Z" />
                    </svg>
                </button>
                <button className="visualizer-icon-btn jpg-btn" onClick={handleDownloadImage} title="Download as Image">
                    {/* Camera Icon */}
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" opacity="0" />
                        <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 17l1.25-2.75L16 13l-2.75-1.25L12 9l-1.25 2.75L8 13l2.75 1.25z" />
                    </svg>
                </button>
                <button className="visualizer-icon-btn pdf-btn" onClick={handleDownloadPDF} title="Download as PDF">
                    {/* PDF/File Icon */}
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v2.5zm2.5 3.5h-1.5V7h1.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5zm4 0h-1.5v-1h1v-1.5h-1V9h1V7.5h-2.5v5.5H18v-2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Visualizer;
