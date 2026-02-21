const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_BASE_URL || "https://ceepee-backend.onrender.com";
    // Remove trailing slash if present
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Ensure it doesn't already have /api (unless you want /api/api)
    // Assuming VITE_API_BASE_URL is just the host usually.
    return `${url}/api`;
};

const API_BASE_URL = getBaseUrl();

export const fetchGeminiSuggestions = async (currentMaterial, allMaterials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/ai-suggest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentMaterial,
                availableMaterials: allMaterials
            })
        });

        if (!response.ok) {
            throw new Error(`Backend API Error: ${response.statusText}`);
        }


        const data = await response.json();
        const suggestedIds = data.suggestedIds;

        if (Array.isArray(suggestedIds)) {
            // Filter allMaterials to return objects
            // Handle both _id (MongoDB) and id (Frontend) match
            return allMaterials.filter(m => suggestedIds.includes(m.id) || suggestedIds.includes(m._id));
        }
        return [];

    } catch (error) {
        console.error("Gemini Suggestion Failed (Backend):", error);
        return null;
    }
};

export const visualizeInteraction = async (roomId, materialId, roomUrl, materialUrl) => {
    try {
        // 1. Validate Inputs
        if (!roomUrl || !materialUrl) {
            throw new Error("Missing room or material URL");
        }

        console.log(`[Frontend] Preparing visualization for Room: ${roomUrl}, Tile: ${materialUrl}`);

        // Helper to fetch image as blob - Robust version
        const fetchImageBlob = async (url) => {
            try {
                console.log(`[Frontend] Fetching blob for: ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${url} - Status: ${response.status}`);

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.startsWith("image/")) {
                    throw new Error(`Invalid content-type for ${url}: ${contentType}. Expected image/*`);
                }

                const blob = await response.blob();
                console.log(`[Frontend] Blob fetched successfully for ${url}. Size: ${blob.size}, Type: ${blob.type}`);
                return blob;
            } catch (error) {
                console.warn(`[Frontend] Failed to fetch image blob for ${url}. Sending absolute URL instead.`, error);
                return null;
            }
        };

        // 2. Prepare FormData
        const formData = new FormData();
        formData.append('roomId', roomId);
        formData.append('materialId', materialId);

        // 3. Process Room Image
        const roomBlob = await fetchImageBlob(roomUrl);
        if (roomBlob) {
            formData.append('room', roomBlob, 'room_image.jpg');
        } else {
            // Convert to absolute URL if relative, so backend can download it
            let absoluteUrl = roomUrl.startsWith('/')
                ? new URL(roomUrl, window.location.origin).href
                : roomUrl;

            // Fix for Node.js localhost resolution (IPv4 vs IPv6)
            if (absoluteUrl.includes('localhost')) {
                absoluteUrl = absoluteUrl.replace('localhost', '127.0.0.1');
            }

            console.log(`[Frontend] Fallback: Sending absolute roomUrl: ${absoluteUrl}`);
            formData.append('roomUrl', absoluteUrl);
        }

        // 4. Process Tile Image
        const tileBlob = await fetchImageBlob(materialUrl);
        if (tileBlob) {
            formData.append('tile', tileBlob, 'tile_image.jpg');
        } else {
            // Convert to absolute URL if relative
            let absoluteUrl = materialUrl.startsWith('/')
                ? new URL(materialUrl, window.location.origin).href
                : materialUrl;

            // Fix for Node.js localhost resolution
            if (absoluteUrl.includes('localhost')) {
                absoluteUrl = absoluteUrl.replace('localhost', '127.0.0.1');
            }

            console.log(`[Frontend] Fallback: Sending absolute tileUrl: ${absoluteUrl}`);
            formData.append('tileUrl', absoluteUrl);
        }

        // 5. Send to Backend
        const targetUrl = `${API_BASE_URL}/visualize-tiles`;
        console.log(`[Frontend] Uploading data to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "POST",
            body: formData, // Auto-sets Content-Type to multipart/form-data
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Backend API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        return { imageUrl: data.imageUrl };

    } catch (error) {
        console.error("Gemini Visualizer Failed:", error);
        throw error;
    }
};
