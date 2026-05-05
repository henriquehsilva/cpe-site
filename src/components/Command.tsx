import React from 'react';
import { User } from 'lucide-react';

const Command: React.FC = () => {
  // Placeholders editáveis - podem ser facilmente alterados
  const comandante = {
    avatar: "comandante.png", 
    nome: "Major PM George Augusto Silva",
    patente: ""
  };

  const subcomandante = {
    avatar: "sub.png",
    nome: "Capitão PM Rafael Gonsalves Bueno",
    patente: ""
  };

  return (
    <section id="comando" className="py-20 bg-gradient-to-br from-cpe-gray/10 to-cpe-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-cpe-gold">Comando</span>
          </h2>
          <div className="w-24 h-1 bg-cpe-red mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Comandante */}
          <div className="bg-cpe-gray/20 rounded-xl p-8 border border-cpe-gray/30 hover:border-cpe-gold/50 transition-all duration-300 group">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-cpe-gray/30 rounded-full flex items-center justify-center group-hover:bg-cpe-gold/20 transition-colors duration-300">
                <img src={comandante.avatar} alt="Avatar do Comandante" className="w-24 h-24 rounded-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Comandante</h3>
              <p className="text-cpe-gold text-xl font-semibold mb-4">{comandante.patente}</p>
              <p className="text-gray-300 text-lg">{comandante.nome}</p>
            </div>
          </div>

          {/* Subcomandante */}
          <div className="bg-cpe-gray/20 rounded-xl p-8 border border-cpe-gray/30 hover:border-cpe-gold/50 transition-all duration-300 group">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-cpe-gray/30 rounded-full flex items-center justify-center group-hover:bg-cpe-gold/20 transition-colors duration-300">
                <img src={subcomandante.avatar} alt="Avatar do Comandante" className="w-24 h-24 rounded-full object-cover" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Subcomandante</h3>
              <p className="text-cpe-gold text-xl font-semibold mb-4">{subcomandante.patente}</p>
              <p className="text-gray-300 text-lg">{subcomandante.nome}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Liderança comprometida com a excelência operacional e o desenvolvimento contínuo dos nossos profissionais, 
            sempre priorizando o bem-estar e a segurança da comunidade.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Command;