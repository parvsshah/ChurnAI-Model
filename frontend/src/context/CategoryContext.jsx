import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/services/api';

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
    const { user, token } = useAuth();
    const [category, setCategoryState] = useState('');

    // Sync category from user's active_category whenever user changes
    useEffect(() => {
        if (user?.active_category) {
            setCategoryState(user.active_category);
        } else if (user?.categories?.length > 0) {
            // If no active_category set, use first registered category
            setCategoryState(user.categories[0]);
        } else {
            // User has no categories yet — leave blank
            setCategoryState('');
        }
    }, [user]);

    // Set category locally + persist to backend
    const setCategory = useCallback(async (cat) => {
        setCategoryState(cat);
        if (token) {
            try {
                await api.setActiveCategory(cat);
            } catch {
                // silent — still update locally
            }
        }
    }, [token]);

    return (
        <CategoryContext.Provider value={{ category, setCategory }}>
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategory() {
    const ctx = useContext(CategoryContext);
    if (!ctx) throw new Error('useCategory must be used within CategoryProvider');
    return ctx;
}
