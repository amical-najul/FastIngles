
import { User, UserRole, UserStatus } from "../types";

const SESSION_KEY = 'fast_ingles_session_v1';
const USERS_DB_KEY = 'fast_ingles_users_db_v1';

// Helper to simulate a small delay for UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  
  /**
   * Registers a new user locally (Mock DB)
   */
  register: async (name: string, email: string, password: string): Promise<User> => {
    await delay(500); // Small interaction delay

    const usersStr = localStorage.getItem(USERS_DB_KEY);
    const users: any[] = usersStr ? JSON.parse(usersStr) : [];

    // Simple check if user exists locally
    if (users.find(u => u.email === email)) {
        throw new Error("El correo ya está registrado en este dispositivo.");
    }

    // Determine role based on specific emails
    const adminEmails = ['admin@fastingles.com', 'jock.alcantara@gmail.com'];
    const role: UserRole = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'user';

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // Stored locally for MVP
        photoUrl: '',
        role: role,
        status: 'active' as UserStatus
    };

    users.push(newUser);
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Auto login
    const sessionUser: User = { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        photoUrl: newUser.photoUrl,
        role: newUser.role,
        status: newUser.status
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    
    return sessionUser;
  },

  /**
   * Logs in locally
   */
  login: async (email: string, password: string): Promise<User> => {
    await delay(500);

    // --- HARDCODED USERS INITIALIZATION (If not in DB) ---
    // This ensures Jock and Amilcar always exist in the "database" array for management
    let usersStr = localStorage.getItem(USERS_DB_KEY);
    let users: any[] = usersStr ? JSON.parse(usersStr) : [];
    
    const hardcoded = [
        { 
            id: 'admin-jock', 
            name: 'Jock Alcantara', 
            email: 'jock.alcantara@gmail.com', 
            role: 'admin',
            password: '12345',
            photoUrl: 'https://ui-avatars.com/api/?name=Jock+Alcantara&background=0D9488&color=fff',
            status: 'active'
        },
        { 
            id: 'user-amilcar', 
            name: 'Amilcar Najul', 
            email: 'amilcar.najul@gmail.com', 
            role: 'user', 
            password: '12345',
            photoUrl: 'https://ui-avatars.com/api/?name=Amilcar+Najul&background=random',
            status: 'active'
        }
    ];

    let dbChanged = false;
    hardcoded.forEach(hcUser => {
        if (!users.find(u => u.email === hcUser.email)) {
            users.push(hcUser);
            dbChanged = true;
        }
    });

    if (dbChanged) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }

    // --- AUTH CHECK ---
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        throw new Error("Credenciales inválidas.");
    }

    if (user.status === 'inactive') {
        throw new Error("Esta cuenta ha sido desactivada por el administrador.");
    }

    const sessionUser: User = { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        photoUrl: user.photoUrl,
        role: user.role || 'user',
        status: user.status || 'active'
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    
    return sessionUser;
  },

  /**
   * Updates user profile
   */
  updateProfile: async (id: string, updates: Partial<User> & { password?: string }): Promise<User> => {
    await delay(300);
    const usersStr = localStorage.getItem(USERS_DB_KEY);
    let users: any[] = usersStr ? JSON.parse(usersStr) : [];
    
    let userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error("Usuario no encontrado.");

    // Update fields
    const updatedUser = { ...users[userIndex], ...updates };
    if (updates.password) {
        updatedUser.password = updates.password;
    }

    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Update Session if it's the current user
    const currentSessionStr = localStorage.getItem(SESSION_KEY);
    if (currentSessionStr) {
        const currentSession = JSON.parse(currentSessionStr);
        if (currentSession.id === id) {
             const sessionUser: User = { 
                id: updatedUser.id, 
                name: updatedUser.name, 
                email: updatedUser.email, 
                photoUrl: updatedUser.photoUrl,
                role: updatedUser.role,
                status: updatedUser.status || 'active'
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
            return sessionUser;
        }
    }

    return { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        photoUrl: updatedUser.photoUrl,
        role: updatedUser.role,
        status: updatedUser.status || 'active'
    };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
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

  // --- ADMIN MANAGEMENT METHODS ---

  getAllUsers: (): User[] => {
      const usersStr = localStorage.getItem(USERS_DB_KEY);
      const users: any[] = usersStr ? JSON.parse(usersStr) : [];
      return users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          photoUrl: u.photoUrl,
          role: u.role,
          status: u.status || 'active'
      }));
  },

  adminCreateUser: (userData: { name: string, email: string, password: string, role: UserRole }) => {
      const usersStr = localStorage.getItem(USERS_DB_KEY);
      const users: any[] = usersStr ? JSON.parse(usersStr) : [];
      
      if (users.find(u => u.email === userData.email)) {
          throw new Error("El email ya existe");
      }

      const newUser = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          password: userData.password,
          photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
          role: userData.role,
          status: 'active'
      };

      users.push(newUser);
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      return newUser;
  },

  adminDeleteUser: (userId: string) => {
      const usersStr = localStorage.getItem(USERS_DB_KEY);
      let users: any[] = usersStr ? JSON.parse(usersStr) : [];
      const initialLength = users.length;
      users = users.filter(u => u.id !== userId);
      
      if (users.length === initialLength) return false;

      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      return true;
  },

  adminUpdateUser: (userId: string, updates: { name?: string, email?: string, password?: string, role?: UserRole, status?: UserStatus }) => {
      const usersStr = localStorage.getItem(USERS_DB_KEY);
      let users: any[] = usersStr ? JSON.parse(usersStr) : [];
      
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
          const updatedUser = { ...users[idx], ...updates };
          // If password is sent as empty string, don't overwrite
          if (updates.password === "") delete updatedUser.password;
          
          users[idx] = updatedUser;
          localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
          return true;
      }
      return false;
  }
};
