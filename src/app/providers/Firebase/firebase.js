import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Добавили GoogleAuthProvider назад
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBDpjMu3D2sGRqe4sGX4G2ny4_oWvVl2D4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "edutech-ai-43f1e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "edutech-ai-43f1e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "edutech-ai-43f1e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "172523850004",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:172523850004:web:d6925a0b64bc6164c35a01",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RKZSVDDFNV"
};

// Инициализация приложения
export const app = initializeApp(firebaseConfig);

// Экспортируем аутентификацию и ТОТ САМЫЙ GOOGLE PROVIDER
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Включаем стандартный Firestore для быстрой загрузки
export const db = getFirestore(app);