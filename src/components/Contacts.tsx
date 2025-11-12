import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone } from 'lucide-react';

const Contacts: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const contactInfo = {
    emailGeral: "31cipm.3crpm@gmail.com",
    telefone1: "62 99624-9821",
    telefone2: "62 99910-6969",
    endereco: "Av. A, Quadra 08, Lote 01 - Cidade Jardim, Anápolis, Goiás"
  };

  // Inicializa o mapa com marcador customizado
  useEffect(() => {
    const initMap = () => {
      const position = { lat: -16.333792, lng: -48.950624 };
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
        disableDefaultUI: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1f1f1f' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#a3a3a3' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'road', stylers: [{ color: '#2c2c2c' }] },
          { featureType: 'water', stylers: [{ color: '#0f0f0f' }] },
        ]
      });

      // Marcador laranja escuro
      new (window as any).google.maps.Marker({
        position,
        map,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#d97706', // Laranja escuro (CPE Gold Deep)
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#f59e0b',
        }
      });
    };

    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBmSET1VQKfasxxrSs0INR1EGdOKsod1x4&callback=initMap`;
      script.async = true;
      (window as any).initMap = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contatos" className="py-20 bg-cpe-dark relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-cpe-gold">Contatos</span>
          </h2>
          <div className="w-24 h-1 bg-cpe-red mx-auto"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Informações de Contato */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white mb-8">Entre em Contato</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Mail className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">E-mail Geral</p>
                  <p className="text-gray-300">{contactInfo.emailGeral}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Phone className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">Telefone Denúncia</p>
                  <p className="text-gray-300">{contactInfo.telefone1}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Phone className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">Telefone Contato</p>
                  <p className="text-gray-300">{contactInfo.telefone2}</p>
                </div>
              </div>

              <div className="p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <p className="text-white font-medium mb-1">Endereço</p>
                <p className="text-gray-300">{contactInfo.endereco}</p>
              </div>
            </div>
          </div>

          {/* Mapa Google estilizado */}          
          <div
            ref={mapRef}
            className="rounded-lg h-[450px] border border-cpe-gray/30 shadow-lg relative mt-[20px] p-[20px]"

          >
            {/* Marcador pulsante extra no centro */}
            <div className="absolute w-5 h-5 bg-[#d97706] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping opacity-70"></div>
            <div className="absolute w-3 h-3 bg-[#d97706] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
