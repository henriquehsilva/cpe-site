import React from 'react';

const Footer: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-cpe-dark border-t-2 border-cpe-gold" role="contentinfo">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-cpe-gold"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-4">
              CPE <span className="text-cpe-red">Anápolis</span>
            </h3>
            <p className="text-gray-400 leading-relaxed mb-6">
              Companhia de Policiamento Especializado dedicada à proteção e segurança da comunidade de Anápolis e região.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-white mb-4">Links Rápidos</h4>
            <nav className="space-y-3" role="navigation" aria-label="Links do rodapé">
              <button
                onClick={() => scrollToSection('historia')}
                className="block text-gray-400 hover:text-cpe-gold transition-colors duration-200"
                aria-label="Ir para seção História"
              >
                História
              </button>
              <button
                onClick={() => scrollToSection('comando')}
                className="block text-gray-400 hover:text-cpe-gold transition-colors duration-200"
                aria-label="Ir para seção Comando"
              >
                Comando
              </button>
              <button
                onClick={() => scrollToSection('contatos')}
                className="block text-gray-400 hover:text-cpe-gold transition-colors duration-200"
                aria-label="Ir para seção Contatos"
              >
                Contatos
              </button>
            </nav>
          </div>

          {/* Contact Summary */}
          <div className="lg:col-span-1">
            <h4 className="text-lg font-semibold text-white mb-4">Contato</h4>
            <div className="space-y-3 text-gray-400">
              <p>Anápolis, Goiás</p>
              <p>Av. A, Quadra 08, Lote 01</p>
              <p>Cidade Jardim</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-cpe-gray/30 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CPE Anápolis — Todos os direitos reservados
            </p>
            <p className="text-gray-500 text-xs">
              Companhia de Policiamento Especializado
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;