
import { User, UserRole, UserStatus } from "../types";
import { apiService } from "./apiService";

const SESSION_KEY = 'fast_ingles_session_v1';

// Helper to simulate a small delay for UX (kept for consistent feel)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {

    /**
     * Registers a new user via backend API.
     * User data is saved to the database, NOT localStorage.
     */
    register: async (name: string, email: string, password: string): Promise<User> => {
        await delay(300);

        try {
            // Call backend API
            const userData = await apiService.register(name, email, password);

            // Auto-login after registration
            await apiService.login(email, password);
            const user = await apiService.getMe();

            // Store session in localStorage (only user info, not credentials)
            const sessionUser: User = {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                photoUrl: user.photo_url || '',
                role: user.role as UserRole,
                status: user.status as UserStatus
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

            return sessionUser;
        } catch (error: any) {
            // Handle Axios errors
            if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            }
            throw new Error(error.message || "Error al registrar usuario");
        }
    },

    /**
     * Logs in via backend API.
     */
    login: async (email: string, password: string): Promise<User> => {
        await delay(300);

        try {
            // Call backend API - this stores the token in localStorage
            await apiService.login(email, password);

            // Get user info
            const user = await apiService.getMe();

            const sessionUser: User = {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                photoUrl: user.photo_url || '',
                role: user.role as UserRole,
                status: user.status as UserStatus
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

            return sessionUser;
        } catch (error: any) {
            if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            }
            throw new Error("Credenciales inválidas.");
        }
    },

    /**
     * Updates user profile (currently only updates session, not DB - future enhancement).
     */
    updateProfile: async (id: string, updates: Partial<User> & { password?: string }): Promise<User> => {
        await delay(300);

        // For now, just update the session. To update in DB, would need a backend endpoint.
        const currentSessionStr = localStorage.getItem(SESSION_KEY);
        if (currentSessionStr) {
            const currentSession = JSON.parse(currentSessionStr);
            if (currentSession.id === id) {
                const updatedSession = { ...currentSession, ...updates };
                delete (updatedSession as any).password; // Never store password in session
                localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
                return updatedSession;
            }
        }

        throw new Error("Usuario no encontrado.");
    },

    logout: () => {
        localStorage.removeItem(SESSION_KEY);
        apiService.logout(); // Remove token
    },

    getCurrentUser: (): User | null => {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return null;
        try {
            return JSON.parse(sessionStr);
        } catch {
            return null;
        }
    },

    // --- ADMIN MANAGEMENT METHODS (Now using Backend API) ---

    getAllUsers: async (): Promise<User[]> => {
        try {
            const users = await apiService.adminGetAllUsers();
            return users.map((u: any) => ({
                id: u.id.toString(),
                name: u.name,
                email: u.email,
                photoUrl: u.photo_url || '',
                role: u.role as UserRole,
                status: (u.status || 'active') as UserStatus
            }));
        } catch (error: any) {
            console.error('Error fetching users:', error);
            // Fallback to empty array if not authorized or error
            return [];
        }
    },

    adminCreateUser: async (userData: { name: string, email: string, password: string, role: UserRole }): Promise<User> => {
        try {
            const user = await apiService.adminCreateUser(userData);
            return {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                photoUrl: user.photo_url || '',
                role: user.role as UserRole,
                status: (user.status || 'active') as UserStatus
            };
        } catch (error: any) {
            if (error.response?.data?.detail) {
                throw new Error(error.response.data.detail);
            }
            throw new Error("Error al crear usuario");
        }
    },

    adminDeleteUser: async (userId: string): Promise<boolean> => {
        try {
            await apiService.adminDeleteUser(parseInt(userId));
            return true;
        } catch (error: any) {
            console.error('Error deleting user:', error);
            return false;
        }
    },

    adminUpdateUser: async (userId: string, updates: { name?: string, email?: string, password?: string, role?: UserRole, status?: UserStatus }): Promise<boolean> => {
        try {
            await apiService.adminUpdateUser(parseInt(userId), updates);
            return true;
        } catch (error: any) {
            console.error('Error updating user:', error);
            return false;
        }
    }
};
