const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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
        const formData = new FormData();

        // Helper to fetch or fallback
        const appendResource = async (url, fieldName, urlFieldName) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                const blob = await response.blob();
                if (blob.size < 100) throw new Error("Invalid blob size");
                formData.append(fieldName, blob, `${fieldName}.jpg`);
                console.log(`[Frontend] Attached ${fieldName} as file.`);
            } catch (err) {
                console.warn(`[Frontend] Could not fetch ${url} directly (${err.message}). Sending URL to backend.`);
                // Ensure URL is absolute if it's a relative path (e.g. /living_room.jpg)
                const absoluteUrl = new URL(url, window.location.origin).href;
                formData.append(urlFieldName, absoluteUrl);
            }
        };

        // Process Room and Tile
        await Promise.all([
            appendResource(roomUrl, 'room', 'roomUrl'),
            appendResource(materialUrl, 'tile', 'tileUrl')
        ]);

        // 3. Send to Backend
        const targetUrl = `${API_BASE_URL}/visualize-tiles`;
        console.log(`[Frontend] Fetching: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Backend API Error: ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        return { imageUrl: data.imageUrl };

    } catch (error) {
        console.error("Gemini Visualizer Failed:", error);
        throw error;
    }
};
