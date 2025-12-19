
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../../types';
import { authService } from '../../services/authService';
import { Button } from '../ui/Button';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user' as UserRole,
        status: 'active' as UserStatus
    });

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await authService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' });
        setSelectedUser(null);
        setEditMode(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't show existing hash
            role: user.role,
            status: user.status || 'active'
        });
        setSelectedUser(user);
        setEditMode(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (user: User) => {
        if (confirm(`¿Estás seguro de eliminar a ${user.name}? Esta acción no se puede deshacer.`)) {
            await authService.adminDeleteUser(parseInt(user.id));
            loadUsers();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editMode && selectedUser) {
                await authService.adminUpdateUser(parseInt(selectedUser.id), {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    status: formData.status,
                    password: formData.password || undefined // Only update if provided
                });
            } else {
                if (!formData.password) throw new Error("La contraseña es requerida");
                await authService.adminCreateUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                });
            }
            setIsModalOpen(false);
            loadUsers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando usuarios...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h2>
                    <p className="text-slate-500 text-sm">Administra roles, accesos y crea nuevas cuentas.</p>
                </div>
                <Button onClick={handleOpenCreate}>
                    + Crear Usuario
                </Button>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}>
                                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${user.status === 'inactive'
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'inactive' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                        {user.status === 'inactive' ? 'Inactivo' : 'Activo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(user)}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                            title="Editar / Mudar Rol"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-900 placeholder-slate-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-900 placeholder-slate-400"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    {editMode ? 'Nueva Contraseña (Dejar en blanco para mantener)' : 'Contraseña'}
                                </label>
                                <input
                                    type="password"
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-900 placeholder-slate-400"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-900"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    >
                                        <option value="user">Usuario</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                {editMode && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                                        <select
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 text-slate-900"
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                                        >
                                            <option value="active">Activo</option>
                                            <option value="inactive">Inactivo</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} fullWidth>
                                    Cancelar
                                </Button>
                                <Button type="submit" fullWidth>
                                    {editMode ? 'Guardar Cambios' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
