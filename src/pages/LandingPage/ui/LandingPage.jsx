import { useState, useEffect } from "react";
import { Header } from "../../../widgets/Header";
import { Hero } from "../../../widgets/Hero";
import { Features } from "../../../widgets/Features";
import { HowItWorks } from "../../../widgets/HowItWorks";
import { CTA } from "../../../widgets/CTA";
import { Footer } from "../../../widgets/Footer";
import { AuthModal } from "../../../features/AuthModal"; // <-- Импортируем нашу фичу модалки

export const LandingPage = ({ user }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const openAuth = () => setIsAuthOpen(true);
  const closeAuth = () => setIsAuthOpen(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Передаем функцию открытия в шапку (чтобы кнопки работали) */}
      <Header onAuthClick={openAuth} user={user} />
      
      <main>
        {/* Передаем функцию открытия в Hero и CTA блоки */}
        <Hero onAuthClick={openAuth} user={user} />
        <Features />
        <HowItWorks />
        <CTA onAuthClick={openAuth} user={user} />
        <Footer />
      </main>

      {/* Сама модалка */}
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
    </div>
  );
};