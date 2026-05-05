import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onAdminClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAdminClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-cpe-dark/95 backdrop-blur-sm border-b border-cpe-gray/30' : 'bg-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl lg:text-2xl font-bold text-white"></h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" role="navigation">
            <button
              onClick={() => scrollToSection('historia')}
              className="text-white hover:text-cpe-gold transition-colors duration-200 font-medium"
              aria-label="Ir para seção Nossa História"
            >
              Nossa História
            </button>
            <button
              onClick={() => scrollToSection('comando')}
              className="text-white hover:text-cpe-gold transition-colors duration-200 font-medium"
              aria-label="Ir para seção Comando"
            >
              Comando
            </button>
            <button
              onClick={() => scrollToSection('contatos')}
              className="text-white hover:text-cpe-gold transition-colors duration-200 font-medium"
              aria-label="Ir para seção Contatos"
            >
              Contatos
            </button>
            <button
              onClick={onAdminClick}
              className="flex items-center gap-2 bg-cpe-red/10 hover:bg-cpe-red/20 border border-cpe-red/40 hover:border-cpe-red/70 text-cpe-red font-semibold px-4 py-2 rounded-lg transition-all duration-200"
              aria-label="Acesso administrativo"
            >
              <ShieldCheck size={16} />
              ADM
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-cpe-gold transition-colors duration-200"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-cpe-gray/30 bg-cpe-dark/95 backdrop-blur-sm">
            <nav className="px-4 py-4 space-y-3" role="navigation">
              <button
                onClick={() => scrollToSection('historia')}
                className="block w-full text-left text-white hover:text-cpe-gold transition-colors duration-200 font-medium py-2"
              >
                Nossa História
              </button>
              <button
                onClick={() => scrollToSection('comando')}
                className="block w-full text-left text-white hover:text-cpe-gold transition-colors duration-200 font-medium py-2"
              >
                Comando
              </button>
              <button
                onClick={() => scrollToSection('contatos')}
                className="block w-full text-left text-white hover:text-cpe-gold transition-colors duration-200 font-medium py-2"
              >
                Contatos
              </button>
              <button
                onClick={() => { onAdminClick(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 w-full text-left text-cpe-red hover:text-red-300 transition-colors duration-200 font-semibold py-2"
              >
                <ShieldCheck size={16} />
                Admin
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
