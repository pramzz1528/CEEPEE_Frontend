
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
    const [dims, setDims] = useState({ w: 0, h: 0 });

    // Zoom & Pan State (Disabled as per user request)
    const [zoom] = useState(1.0);
    const [pan] = useState({ x: 0, y: 0 });


    // Interaction handlers removed as per user request (Still photo)
    const handleMouseDown = (e) => { };
    const handleMouseMove = (e) => { };
    const handleMouseUp = () => { };
    const handleTouchStart = (e) => { };
    const handleTouchMove = (e) => { };
    const handleTouchEnd = () => { };

    // Reset when room changes (if needed, but zoom/pan are now constant)
    useEffect(() => {
        // No explicit reset needed as state is fixed
    }, [currentRoom]);

    // Track frame dimensions to stabilize canvas with ResizeObserver
    useEffect(() => {
        if (!frameRef.current) return;

        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                // Ground to whole pixels to prevent sub-pixel jitter
                setDims({
                    w: Math.round(width),
                    h: Math.round(height)
                });
            }
        });

        observer.observe(frameRef.current);

        // Initial measurement
        const rect = frameRef.current.getBoundingClientRect();
        setDims({ w: Math.round(rect.width), h: Math.round(rect.height) });

        return () => observer.disconnect();
    }, [currentRoom]); // Re-observe if frame changes (though ref stays same)


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
                setIsTransitioning(false); // Done loading material
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
            setAiResultImg(null); // CRITICAL: Clear AI result when "None" is selected
            setGeneratedUrl(null);
            setIsTransitioning(false);
            setShowClientPreview(false);
            return;
        }
        setIsTransitioning(true);
        setShowClientPreview(true); // Reset to show preview initially
        loadImage(primaryMaterial.textureUrl, false);
    }, [primaryMaterial]);

    // Pre-calculate layout to ensure absolute stillness and alignment
    const layout = React.useMemo(() => {
        const baseImg = baseRoomImg || roomImg;
        if (!baseImg || dims.w === 0) return null;

        const frameWidth = dims.w;
        const frameHeight = dims.h;

        // 1. Calculate Master Layout based on Base Image
        const scale = Math.min(frameWidth / baseImg.width, frameHeight / baseImg.height) * zoom;
        const drawWidth = Math.round(baseImg.width * scale);
        const drawHeight = Math.round(baseImg.height * scale);
        const offsetX = Math.round((frameWidth - drawWidth) / 2 + pan.x);
        const offsetY = Math.round((frameHeight - drawHeight) / 2 + pan.y);

        // 2. Simple AI Image Layout (Reverted Aspect Ratio Correction)
        let aiLayout = null;
        if (aiResultImg) {
            aiLayout = {
                img: aiResultImg,
                width: drawWidth,
                height: drawHeight,
                x: offsetX,
                y: offsetY
            };
        }

        return {
            base: {
                img: baseImg,
                width: drawWidth,
                height: drawHeight,
                x: offsetX,
                y: offsetY,
                scale: scale // keep for warping
            },
            ai: aiLayout,
            frameWidth,
            frameHeight
        };
    }, [baseRoomImg, roomImg, aiResultImg, dims, zoom, pan]);

    // Render Loop - Decoupled and Grounded
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !layout) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Resize canvas ONLY if dimensions changed
        const targetWidth = Math.round(layout.frameWidth * dpr);
        const targetHeight = Math.round(layout.frameHeight * dpr);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            canvas.style.width = `${layout.frameWidth}px`;
            canvas.style.height = `${layout.frameHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const render = () => {
            // Use local integer vars for all dimensions to avoid sub-pixel jitter
            const fw = layout.frameWidth;
            const fh = layout.frameHeight;

            ctx.clearRect(0, 0, fw, fh);

            // 1. Draw "Before" Image (Base Room)
            ctx.drawImage(
                layout.base.img,
                layout.base.x,
                layout.base.y,
                layout.base.width,
                layout.base.height
            );

            // 2. Client-side Preview (Warped Material on Before Image)
            if (showClientPreview && matImg && currentRoom.floorCoordinates) {
                const scaledCoords = currentRoom.floorCoordinates.map(p => ({
                    x: Math.round(p.x * layout.base.scale + layout.base.x),
                    y: Math.round(p.y * layout.base.scale + layout.base.y)
                }));
                try {
                    drawWarpedImage(ctx, matImg, scaledCoords);
                } catch (err) {
                    console.error("Error drawing warped image:", err);
                }
            }

            // 3. Draw "After" Image (AI Result) with Clipper
            if (layout.ai) {
                const splitX = Math.round(fw * (sliderValue / 100));

                ctx.save();
                ctx.beginPath();
                // Right side = Generated设计
                ctx.rect(splitX, 0, fw - splitX, fh);
                ctx.clip();

                // Draw AI Result with ITS OWN static dimensions (Reverted Aspect Ratio Correction)
                ctx.drawImage(
                    layout.ai.img,
                    layout.ai.x,
                    layout.ai.y,
                    layout.ai.width,
                    layout.ai.height
                );
                ctx.restore();

                // 4. Draw Slider Line
                ctx.beginPath();
                ctx.moveTo(splitX, 0);
                ctx.lineTo(splitX, fh);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Slider Handle Circle - Use integers for position
                const centerY = Math.round(fh / 2);
                ctx.beginPath();
                ctx.arc(splitX, centerY, 18, 0, Math.PI * 2);
                ctx.fillStyle = '#1a1a1a';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Arrows
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(splitX - 6, centerY);
                ctx.lineTo(splitX - 2, centerY - 4);
                ctx.lineTo(splitX - 2, centerY + 4);
                ctx.moveTo(splitX + 6, centerY);
                ctx.lineTo(splitX + 2, centerY - 4);
                ctx.lineTo(splitX + 2, centerY + 4);
                ctx.fill();
            }
        };

        const frameId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(frameId);
    }, [layout, matImg, currentRoom, showClientPreview, sliderValue]);

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
            setAiResultImg(null);
            setGeneratedUrl(null);
            setShowClientPreview(false);
            setIsVisualizing(false);
            setStatusMessage(null);
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
            setStatusMessage("⚠ Visualization failed. Click tile to retry.");
            // Don't auto-clear error messages so user sees them
        } finally {
            setIsVisualizing(false);
            // Only clear if it's NOT an error message
            setTimeout(() => {
                setStatusMessage(prev => prev.startsWith('⚠') ? prev : "");
            }, 3000);
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
            doc.save('ceepee-design.pdf');
        } catch (error) {
            console.error("PDF download failed:", error);
            alert("Failed to generate PDF. This is likely due to security restrictions on the room image source (CORS).");
        }
    };

    return (
        <div className={`visualizer-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} ref={containerRef}>
            {/* Floating Pill Selector (Visual Only - Reference Match) */}
            <div className="floating-pill-selector" style={{
                position: 'absolute',
                top: '-50px', // Above the frame
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff',
                padding: '5px',
                borderRadius: '50px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '5px',
                zIndex: 10
            }}>
                <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', color: '#888', cursor: 'not-allowed' }}>Walls</span>
                <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', color: '#888', cursor: 'not-allowed' }}>Countertops</span>
                <span style={{ padding: '6px 16px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', background: '#333', color: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>Floor</span>
            </div>

            <div
                ref={frameRef}
                className="visualizer-frame"
                draggable="false"
                style={{
                    '--frame-ratio': frameRatio,
                    cursor: 'default',
                    touchAction: 'none' // Prevent mobile scrolling
                }}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas ref={canvasRef} className="visualizer-canvas" draggable="false" />

                {aiResultImg && (
                    <>
                        <input
                            type="range"
                            className="visualizer-slider"
                            min="0"
                            max="100"
                            step="0.1"
                            value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                        />
                        <div className="comparison-labels">
                            <span className="comp-label original">Original</span>
                            <span className="comp-label generated">Generated</span>
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

            {/* Sidebar Toggle Button (Desktop & Mobile) */}
            <button className={`sidebar-toggle-btn ${isSidebarOpen ? 'open' : ''}`} onClick={toggleSidebar} title={isSidebarOpen ? "Maximize View" : "Show Tiles"}>
                {isSidebarOpen ? (
                    /* Arrow Left (Collapse) */
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                ) : (
                    /* Hamburger Menu (Expand) */
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                )}
            </button>

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
