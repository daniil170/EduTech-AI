import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Добавили GoogleAuthProvider назад
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDpjMu3D2sGRqe4sGX4G2ny4_oWvVl2D4",
  authDomain: "edutech-ai-43f1e.firebaseapp.com",
  projectId: "edutech-ai-43f1e",
  storageBucket: "edutech-ai-43f1e.firebasestorage.app",
  messagingSenderId: "172523850004",
  appId: "1:172523850004:web:d6925a0b64bc6164c35a01",
  measurementId: "G-RKZSVDDFNV"
};

// Инициализация приложения
const app = initializeApp(firebaseConfig);

// Экспортируем аутентификацию и ТОТ САМЫЙ GOOGLE PROVIDER
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); // Вот он, теперь линтер не будет ругаться

// Включаем оффлайн-кэш, чтобы при ошибках сети / оффлайне ничего не зависало
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});