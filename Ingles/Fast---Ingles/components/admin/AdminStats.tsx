
import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { User } from '../../types';

export const AdminStats: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [contentStats, setContentStats] = useState<any>(null);

    useEffect(() => {
        const loadStats = async () => {
            const usersData = await authService.getAllUsers();
            setUsers(usersData);
            setContentStats(storageService.getAdminGlobalStats());
        };
        loadStats();
    }, []);

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const admins = users.filter(u => u.role === 'admin').length;

    // Calculate storage usage in KB
    const storageKB = contentStats ? (contentStats.storageUsage / 1024).toFixed(2) : "0";

    const StatCard = ({ title, value, sub, color }: any) => (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-xs font-bold uppercase mb-2">{title}</h3>
            <div className={`text-4xl font-black ${color}`}>{value}</div>
            {sub && <div className="text-slate-400 text-xs mt-1">{sub}</div>}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-8">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Estadísticas Generales</h2>
                <p className="text-slate-500 text-sm">Visión general del sistema y usuarios.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title="Usuarios Totales"
                    value={totalUsers}
                    sub={`${activeUsers} Activos / ${totalUsers - activeUsers} Inactivos`}
                    color="text-slate-800"
                />
                <StatCard
                    title="Administradores"
                    value={admins}
                    sub="Acceso total al sistema"
                    color="text-purple-600"
                />
                <StatCard
                    title="Contenido Generado"
                    value={contentStats?.generatedStages || 0}
                    sub={`de ${contentStats?.totalAvailableStages || 0} niveles posibles`}
                    color="text-emerald-600"
                />
                <StatCard
                    title="Palabras en BD"
                    value={contentStats?.totalWordsGenerated || 0}
                    sub={`Uso local: ${storageKB} KB`}
                    color="text-blue-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución de Usuarios</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                Activos
                            </span>
                            <span className="font-bold">{activeUsers}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(activeUsers / totalUsers) * 100}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                                Inactivos
                            </span>
                            <span className="font-bold">{totalUsers - activeUsers}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-slate-400 h-full" style={{ width: `${((totalUsers - activeUsers) / totalUsers) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Estado del Sistema</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-600">Base de Datos Local</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">ONLINE</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-600">API Gemini</span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-600">Versión App</span>
                            <span className="text-xs font-bold text-slate-600">{localStorage.getItem('APP_VERSION') || 'v0.0.10'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
