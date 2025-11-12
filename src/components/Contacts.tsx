import React, { useState } from 'react';
import { Mail, Phone } from 'lucide-react';

const Contacts: React.FC = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="contatos" className="py-20 bg-cpe-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-cpe-gold">Contatos</span>
          </h2>
          <div className="w-24 h-1 bg-cpe-red mx-auto"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white mb-8">Entre em Contato</h3>
            <div className="space-y-6">
              {/* Email Geral */}
              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Mail className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">E-mail Geral</p>
                  <p className="text-gray-300">{contactInfo.emailGeral}</p>
                </div>
              </div>

              {/* Telefone 1 */}
              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Phone className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">Disk Denúncia</p>
                  <p className="text-gray-300">{contactInfo.telefone1}</p>
                </div>
              </div>

              {/* Telefone 2 */}
              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Phone className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">Contato</p>
                  <p className="text-gray-300">{contactInfo.telefone2}</p>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <p className="text-white font-medium mb-1">Endereço</p>
                <p className="text-gray-300">{contactInfo.endereco}</p>
              </div>
            </div>
          </div>

          {/* Google Map */}
          <div className="rounded-lg overflow-hidden shadow-lg border border-cpe-gray/30">
            <iframe
              title="Localização - 31ª CIPM"
              width="100%"
              height="100%"
              style={{ minHeight: '400px', border: 0, filter: 'grayscale(100%) contrast(1.1)' }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.013901701817!2d-48.950624!3d-16.333792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ea427dbf12345%3A0xabcdef1234567890!2sAv.%20A%2C%20Quadra%2008%2C%20Lote%2001%20-%20Cidade%20Jardim%2C%20An%C3%A1polis%20-%20GO!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
