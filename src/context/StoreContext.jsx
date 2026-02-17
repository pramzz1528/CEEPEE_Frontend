import React, { createContext, useState, useContext, useEffect } from 'react';
import { ROOMS, MATERIALS, getSuggestions } from '../mockData';
import { fetchGeminiSuggestions } from '../services/geminiService';

const StoreContext = createContext();
StoreContext.displayName = 'StoreContext';

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
    const [rooms, setRooms] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [primaryMaterial, setPrimaryMaterial] = useState(null);
    const [secondaryMaterial, setSecondaryMaterial] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    // Initial Load Tracker
    const isInitialLoad = React.useRef(true);

    // UI State
    const [currentCategory, setCurrentCategory] = useState("Tile"); // Tile, Stone, Panel
    const [timeOfDay, setTimeOfDay] = useState("day"); // day, night
    const [isRatioMode, setIsRatioMode] = useState(false); // 70:30 toggle
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Simulate API latency
                await new Promise(resolve => setTimeout(resolve, 200));

                setRooms(ROOMS);
                setMaterials(MATERIALS);

                // Set defaults if data exists
                if (ROOMS.length > 0) setCurrentRoom(ROOMS[0]);
                if (MATERIALS.length > 0) {
                    // Set default to "None" for a clean start
                    const noneMat = MATERIALS.find(m => m.id === 'mat_none');
                    console.log("Setting default material:", noneMat ? "None" : "First Available");
                    setPrimaryMaterial(noneMat || MATERIALS[0]);
                }
            } catch (err) {
                console.error("Failed to load data", err);
                setError("Failed to load application data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Deep Linking: Read URL on Load ---
    useEffect(() => {
        if (loading || rooms.length === 0 || materials.length === 0) return;

        const params = new URLSearchParams(window.location.search);
        const roomId = params.get('room');
        const matId = params.get('mat');

        if (roomId) {
            const foundRoom = rooms.find(r => r.id === roomId);
            if (foundRoom) setCurrentRoom(foundRoom);
        }

        if (matId) {
            const foundMat = materials.find(m => m.id === matId);
            if (foundMat) setPrimaryMaterial(foundMat);
        }
    }, [loading, rooms, materials]);

    // --- Deep Linking: Update URL on Change ---
    useEffect(() => {
        if (loading) return;

        const params = new URLSearchParams(window.location.search);

        if (currentRoom) params.set('room', currentRoom.id);
        if (primaryMaterial) params.set('mat', primaryMaterial.id);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }, [currentRoom, primaryMaterial, loading]);

    // Filter materials based on category, and always include 'none' at the beginning
    const noneMaterial = materials.find(m => m.id === 'mat_none');
    const categoryMaterials = materials.filter(m => m.category === currentCategory && m.id !== 'mat_none');
    const filteredMaterials = noneMaterial ? [noneMaterial, ...categoryMaterials] : categoryMaterials;

    // Fetch Suggestions (AI or Mock)
    useEffect(() => {
        if (!primaryMaterial || primaryMaterial.id === 'mat_none') {
            setSuggestions([]);
            return;
        }

        // Skip initial load
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const loadSuggestions = async () => {
            // 1. Try AI First
            const aiSuggestions = await fetchGeminiSuggestions(primaryMaterial, materials);

            if (aiSuggestions && aiSuggestions.length > 0) {
                setSuggestions(aiSuggestions);
            } else {
                // 2. Fallback to Mock Logic if AI fails or no key
                console.log("Using local fallback suggestions");
                const localSuggestions = getSuggestions(primaryMaterial.id);
                setSuggestions(localSuggestions);
            }
        };

        loadSuggestions();
    }, [primaryMaterial, materials]);

    const value = {
        rooms,
        materials: filteredMaterials, // Expose only filtered
        allMaterials: materials,      // Expose all if needed
        currentRoom,
        setCurrentRoom,
        primaryMaterial,
        setPrimaryMaterial,
        secondaryMaterial,
        setSecondaryMaterial,
        currentCategory,
        setCurrentCategory,
        timeOfDay,
        setTimeOfDay,
        isRatioMode,
        setIsRatioMode,
        suggestions,
        loading,
        error
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
