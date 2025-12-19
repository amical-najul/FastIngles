
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const VerifyEmailScreen: React.FC = () => {
    const { user, resendVerificationEmail, logout } = useAuth();
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleResend = async () => {
        try {
            await resendVerificationEmail();
            setSent(true);
            setTimeout(() => setSent(false), 5000);
        } catch (err: any) {
            setError('Error al enviar el correo. Intenta más tarde.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifica tu Email</h2>
                <p className="text-slate-500 mb-6">
                    Hemos enviado un enlace de confirmación a <strong>{user?.email}</strong>.<br />
                    Por favor, confirma tu correo para acceder a la aplicación.
                </p>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                {sent && <p className="text-green-500 text-sm mb-4 font-bold">¡Correo reenviado!</p>}

                <div className="space-y-3">
                    <button
                        onClick={handleResend}
                        disabled={sent}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        Reenviar Correo de Verificación
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Ya verifiqué mi correo
                    </button>
                    <button
                        onClick={logout}
                        className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
};
