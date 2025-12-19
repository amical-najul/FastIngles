
import { apiService } from './apiService';
import { User } from '../types';

/**
 * Service to handle Backend interactions related to Authentication.
 * Note: Actual Login/Register logic is handled by Firebase SDK in AuthContext.
 * This service focuses on syncing data with the SQL Database (Supabase).
 */
export const authService = {

    /**
     * Syncs the Firebase user with the backend database.
     * Call this after Firebase Login to ensure DB record exists (JIT).
     */
    syncUser: async (firebaseToken: string): Promise<User> => {
        // The interceptor in apiService handles the token injection usually,
        // but here we might pass it explicitly or rely on the interceptor if updated.
        // For sync, we might assume the interceptor isn't ready or we want to be explicit.
        // However, best pattern: apiService.getMe() with the token header.
        return await apiService.syncUserWithBackend();
    },

    /**
     * Updates user profile in the backend.
     */
    updateBackendProfile: async (token: string, updates: { displayName?: string, photoURL?: string }): Promise<User> => {
        return await apiService.updateUserProfile(updates);
    },

    // --- ADMIN METHODS ---
    // These likely require the user to be an admin in the Backend DB.

    getAllUsers: async (): Promise<User[]> => {
        return apiService.adminGetAllUsers();
    },

    adminCreateUser: async (userData: any): Promise<User> => {
        return apiService.adminCreateUser(userData);
    },

    adminUpdateUser: async (userId: number, updates: any): Promise<any> => {
        return apiService.adminUpdateUser(userId, updates);
    },

    adminDeleteUser: async (userId: number): Promise<boolean> => {
        return apiService.adminDeleteUser(userId);
    }
};
