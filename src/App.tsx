import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Command from './components/Command';
import Contacts from './components/Contacts';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthReady(true);
      if (user) {
        setShowLogin(false);
        setShowDashboard(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleAdminClick = () => {
    if (adminUser) {
      setShowDashboard(true);
    } else {
      setShowLogin(true);
    }
  };

  if (!authReady) return null;

  return (
    <div className="min-h-screen bg-cpe-dark text-white font-sans">
      <Header onAdminClick={handleAdminClick} />
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
        <AdminDashboard onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}

export default App;
