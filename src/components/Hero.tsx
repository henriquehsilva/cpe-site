import React from 'react';
import Shield from './Shield';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Vídeo de fundo */}
      <video
        className="pointer-events-none absolute inset-0 z-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/cpe-barca-poster.jpg"
        aria-hidden="true"
      >
        <source src="/videos/cpe-barca.webm" type="video/webm" />
        <source src="/videos/cpe-barca.mp4" type="video/mp4" />
      </video>

      {/* Overlays para contraste e textura (por cima do vídeo) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-cpe-dark/80 via-cpe-gray/60 to-cpe-dark/90" />
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8 animate-fade-in">
          <img
            src="/logo.png"
            alt="Escudo da CPE Anápolis"
            className="w-96 h-64 mx-auto drop-shadow-2xl"
          />
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl text-gray-200 mb-8 animate-slide-up font-medium">
          Companhia de Policiamento Especializado
        </h2>

        <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-12 animate-slide-up leading-relaxed">
          Tradição, excelência e comprometimento no policiamento especializado.
          Servindo à comunidade de Anápolis com profissionalismo desde 1990.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
          <button
            onClick={() => document.getElementById('historia')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-cpe-red hover:bg-red-700 text-white px-8 py-4 rounded-md transition-all duration-300 font-semibold text-lg w-full sm:w-auto hover:transform hover:scale-105"
            aria-label="Conheça nossa história"
          >
            Nossa História
          </button>
        </div>
      </div>

      {/* Linha de destaque inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-cpe-red z-10"></div>
    </section>
  );
};

export default Hero;
