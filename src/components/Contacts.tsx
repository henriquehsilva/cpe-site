import React, { useState } from 'react';
import { Mail, Phone, Send } from 'lucide-react';

const Contacts: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Placeholders editáveis - podem ser facilmente alterados
  const contactInfo = {
    emailGeral: "{{EMAIL_GERAL}}",
    emailComando: "{{EMAIL_COMANDO}}",
    telefone1: "{{TELEFONE_1}}",
    telefone2: "{{TELEFONE_2}}"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form handler genérico - pode ser implementado conforme necessário
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
            <div>
              <h3 className="text-2xl font-bold text-white mb-8">Entre em Contato</h3>
              <div className="space-y-6">
                {/* Email Geral */}
                <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                  <div className="flex-shrink-0">
                    <Mail className="text-cpe-gold w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-medium">E-mail Geral</p>
                    <p className="text-gray-300">{contactInfo.emailGeral}</p>
                  </div>
                </div>

                {/* Email Comando */}
                <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                  <div className="flex-shrink-0">
                    <Mail className="text-cpe-gold w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-medium">E-mail Comando</p>
                    <p className="text-gray-300">{contactInfo.emailComando}</p>
                  </div>
                </div>

                {/* Telefone 1 */}
                <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                  <div className="flex-shrink-0">
                    <Phone className="text-cpe-gold w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Telefone Principal</p>
                    <p className="text-gray-300">{contactInfo.telefone1}</p>
                  </div>
                </div>

                {/* Telefone 2 */}
                <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                  <div className="flex-shrink-0">
                    <Phone className="text-cpe-gold w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Telefone Alternativo</p>
                    <p className="text-gray-300">{contactInfo.telefone2}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
        </div>
      </div>
    </section>
  );
};

export default Contacts;