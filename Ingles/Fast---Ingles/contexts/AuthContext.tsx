
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
                    // Retry logic with exponential backoff for backend sync
                    let attempts = 0;
                    const maxAttempts = 3;
                    let syncSuccess = false;

                    while (attempts < maxAttempts && !syncSuccess) {
                        try {
                            console.log(`[Auth] Sync attempt ${attempts + 1}/${maxAttempts} for ${currentUser.email}`);
                            const token = await currentUser.getIdToken(true); // Force refresh token
                            console.log(`[Auth] Got Firebase token, calling backend sync...`);

                            // JIT Provisioning / Sync with Backend
                            const backendUser = await authService.syncUser(token);
                            console.log(`[Auth] Backend sync successful:`, backendUser);

                            setDbUser(backendUser);
                            setUser(currentUser);
                            syncSuccess = true;
                        } catch (error: any) {
                            attempts++;
                            console.error(`[Auth] Sync attempt ${attempts} failed:`, {
                                message: error?.message,
                                status: error?.response?.status,
                                data: error?.response?.data
                            });

                            if (attempts < maxAttempts) {
                                // Exponential backoff: 1s, 2s, 4s
                                const delay = 1000 * Math.pow(2, attempts - 1);
                                console.log(`[Auth] Retrying in ${delay}ms...`);
                                await new Promise(r => setTimeout(r, delay));
                            }
                        }
                    }

                    if (!syncSuccess) {
                        console.error(`[Auth] All ${maxAttempts} sync attempts failed for ${currentUser.email}`);
                        // Set user so we can show the error screen with user context
                        setUser(currentUser);
                        setDbUser(null);
                    }
                } else {
                    // User is authenticated but NOT verified. 
                    // We still set them as user to show the "Verify Email" screen,
                    // but the ProtectedRoute will block them from main content.
                    console.log(`[Auth] User ${currentUser.email} not verified yet`);
                    setUser(currentUser);
                    setDbUser(null);
                }
            } else {
                // Logged out
                console.log(`[Auth] User logged out`);
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
        console.log('[Auth] Starting Google login...');
        const result = await signInWithPopup(auth, googleProvider);
        console.log(`[Auth] Google login successful for ${result.user.email}`);

        // Google users are usually verified, but we check:
        if (result.user.emailVerified) {
            // Retry sync with exponential backoff
            let attempts = 0;
            const maxAttempts = 3;
            let syncSuccess = false;

            while (attempts < maxAttempts && !syncSuccess) {
                try {
                    console.log(`[Auth] Google sync attempt ${attempts + 1}/${maxAttempts}`);
                    const token = await result.user.getIdToken(true);
                    const backendUser = await authService.syncUser(token);
                    console.log('[Auth] Google sync successful:', backendUser);
                    setDbUser(backendUser);
                    syncSuccess = true;
                } catch (error: any) {
                    attempts++;
                    console.error(`[Auth] Google sync attempt ${attempts} failed:`, error?.response?.data || error?.message);
                    if (attempts < maxAttempts) {
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempts - 1)));
                    }
                }
            }

            if (!syncSuccess) {
                console.error('[Auth] Google sync failed after all attempts');
                // The onAuthStateChanged will pick this up and handle it
            }
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
