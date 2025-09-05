import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import History from './components/History';
import Command from './components/Command';
import Contacts from './components/Contacts';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-cpe-dark text-white font-sans">
      <Header />
      <main>
        <Hero />
        <History />
        <Command />
        <Contacts />
      </main>
      <Footer />
    </div>
  );
}

export default App;