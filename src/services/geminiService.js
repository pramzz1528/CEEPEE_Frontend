const API_BASE_URL = "http://localhost:5000/api";

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
        // 1. Fetch images as blobs (Backend expects actual files)
        const [roomResp, materialResp] = await Promise.all([
            // Use 'cors' only if needed, but 'no-cors' for opaque prevents blob access.
            // Standard fetch without mode often works best for mixed content.
            fetch(roomUrl),
            fetch(materialUrl)
        ]);

        if (!roomResp.ok) throw new Error(`Failed to load Room Image: ${roomResp.statusText}`);
        if (!materialResp.ok) throw new Error(`Failed to load Tile Image: ${materialResp.statusText}`);

        const roomBlob = await roomResp.blob();
        const materialBlob = await materialResp.blob();

        console.log(`[Frontend] Prepared Blobs - Room: ${roomBlob.size}, Tile: ${materialBlob.size}`);

        if (roomBlob.size < 100 || materialBlob.size < 100) {
            throw new Error("One of the image resources is empty or invalid.");
        }

        // 2. Create FormData and append files
        const formData = new FormData();
        formData.append("room", roomBlob, "room.jpg");
        formData.append("tile", materialBlob, "tile.jpg");

        // 3. Send to Backend
        console.log(`[Frontend] Sending visualization request to ${API_BASE_URL}/visualize-tiles`);

        // Note: Do NOT set Content-Type header when using FormData; fetch sets it automatically with boundary.
        const response = await fetch(`${API_BASE_URL}/visualize-tiles`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Backend API Error: ${response.statusText}`);
        }

        const data = await response.json();
        // Return object with image only
        return { imageUrl: data.imageUrl };

    } catch (error) {
        console.error("Gemini Visualizer Failed:", error);
        throw error;
    }
};
