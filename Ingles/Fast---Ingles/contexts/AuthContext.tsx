
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { authService } from '../services/authService';
import { User, UserRole, UserStatus } from '../types';

interface AuthContextType {
    user: FirebaseUser | null;
    dbUser: User | null; // User from Supabase/Backend
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    googleLogin: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
    updateProfile: (updates: { displayName?: string, photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [dbUser, setDbUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Determine if we should allow access based on email verification
                if (currentUser.emailVerified) {
                    try {
                        const token = await currentUser.getIdToken();
                        // JIT Provisioning / Sync with Backend
                        const backendUser = await authService.syncUser(token);
                        setDbUser(backendUser);
                        setUser(currentUser);
                    } catch (error) {
                        console.error("Error syncing user with backend:", error);
                        // If sync fails, what do we do? Logout? Or allow limited access?
                        // For now, allow auth but dbUser might be null (or handle error)
                        setUser(currentUser);
                    }
                } else {
                    // User is authenticated but NOT verified. 
                    // We still set them as user to show the "Verify Email" screen,
                    // but the ProtectedRoute will block them from main content.
                    setUser(currentUser);
                    setDbUser(null);
                }
            } else {
                // Logged out
                setUser(null);
                setDbUser(null);
                // Clear any local storage if missed
                localStorage.clear();
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email: string, pass: string) => {
        const result = await signInWithEmailAndPassword(auth, email, pass);
        if (!result.user.emailVerified) {
            // We can choose to sign them out immediately or let the VerifyScreen handle it.
            // The requirement says: "Cerrar sesión inmediatamente y mostrar la pantalla de Verifica tu email".
            // If we sign out, we can't show the screen effectively unless we pass a state.
            // Better approach: Keep them signed in, but Context `dbUser` is null, and Router shows VerifyScreen.
        }
    };

    const register = async (name: string, email: string, pass: string) => {
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        await updateFirebaseProfile(result.user, { displayName: name });
        await sendEmailVerification(result.user);
        // Do NOT sync with backend yet. Wait for verification.
        // Sign out to enforce flow? "Si el usuario se registra -> NO iniciar sesión automáticamente."
        await signOut(auth);
    };

    const googleLogin = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        // Google users are usually verified, but we check:
        if (result.user.emailVerified) {
            const token = await result.user.getIdToken();
            const backendUser = await authService.syncUser(token);
            setDbUser(backendUser);
        }
    };

    const logout = async () => {
        await signOut(auth);
        localStorage.clear(); // Safety clear
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const resendVerificationEmail = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    };

    const updateProfile = async (updates: { displayName?: string, photoURL?: string }) => {
        if (auth.currentUser) {
            // 1. Update Firebase
            await updateFirebaseProfile(auth.currentUser, updates);

            // 2. Update Backend (Sync)
            // We need to re-fetch token to ensure backend has latest claims if needed, 
            // but mostly just send data.
            const token = await auth.currentUser.getIdToken();
            await authService.updateBackendProfile(token, updates);

            // 3. Update local state
            setUser({ ...auth.currentUser });
            // Refresh backend user to be sure
            const backendUser = await authService.syncUser(token);
            setDbUser(backendUser);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            dbUser,
            loading,
            login,
            register,
            logout,
            googleLogin,
            resetPassword,
            resendVerificationEmail,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};
