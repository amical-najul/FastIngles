
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginScreenProps {
    onSwitchToRegister: () => void;
    onForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister, onForgotPassword }) => {
    const { login, googleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError('Error al iniciar sesión. Verifica tus credenciales.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        try {
            await googleLogin();
        } catch (err: any) {
            setError('Error con Google Login.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Bienvenido</h2>
                    <p className="text-slate-600 text-center mb-8">Inicia sesión para continuar aprendiendo</p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={onForgotPassword} className="text-sm text-emerald-600 hover:text-emerald-700 font-bold">
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-slate-500 font-medium">O continúa con</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogle}
                        className="w-full py-3 border-2 border-slate-200 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-colors font-bold text-slate-700"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Google
                    </button>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        ¿No tienes cuenta?{' '}
                        <button onClick={onSwitchToRegister} className="text-emerald-600 font-bold hover:text-emerald-700">
                            Regístrate
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
