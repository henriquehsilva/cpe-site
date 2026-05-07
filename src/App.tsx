import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { RBACProvider, useRBAC } from './contexts/RBACContext';
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Command from './components/Command';
import Contacts from './components/Contacts';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import Gallery from './components/Gallery';

function AppContent() {
  const { adminUser, authReady } = useRBAC();
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (adminUser) {
      setShowLogin(false);
      setShowDashboard(true);
    } else {
      setShowDashboard(false);
    }
  }, [adminUser]);

  const handleAdminClick = () => {
    if (adminUser) {
      setShowDashboard(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowDashboard(false);
  };

  if (!authReady) return null;

  return (
    <div className="min-h-screen bg-cpe-dark text-white font-sans">
      <Header onAdminClick={handleAdminClick} onGalleryClick={() => setShowGallery(true)} />
      <main>
        <Hero />
        <History />
        <Command />
        <Contacts />
      </main>
      <Footer />

      {showLogin && (
        <AdminLogin
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setShowDashboard(true);
          }}
        />
      )}

      {showDashboard && adminUser && (
        <AdminDashboard onClose={handleSignOut} />
      )}

      {showGallery && (
        <Gallery onClose={() => setShowGallery(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <RBACProvider>
      <AppContent />
    </RBACProvider>
  );
}

export default App;
