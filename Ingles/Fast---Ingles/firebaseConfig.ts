
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfgZtI5uFcgY5ozy1_GUtprtqkV6Epm5o",
  authDomain: "ingles-54212.firebaseapp.com",
  projectId: "ingles-54212",
  storageBucket: "ingles-54212.firebasestorage.app",
  messagingSenderId: "344706519178",
  appId: "1:344706519178:web:98b7af52794893a5fb1d73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
