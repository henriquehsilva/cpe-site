import React, { useState } from "react";
import { Mail, Phone } from "lucide-react";

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const Contacts: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const contactInfo = {
    emailGeral: "31cipm.3crpm@gmail.com",
    telefone1: "62 99624-9821",
    telefone2: "62 99910-6782 / 62 99910-6969",
    endereco:
      "CPE Anápolis - 31ª CIPM/CPE, Av. A, Qd. 08 Lt. 01, Cidade Jardim, Anápolis - GO, CEP: 75080-170",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    setFormData({ name: "", email: "", message: "" });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contatos" className="py-20 bg-cpe-dark relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-cpe-gold">Contatos</span>
          </h2>
          <div className="w-24 h-1 bg-cpe-red mx-auto"></div>
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Informações de Contato */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white mb-8">
              Entre em Contato
            </h3>
            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Mail className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">E-mail</p>
                  <p className="text-gray-300">{contactInfo.emailGeral}</p>
                </div>
              </div>

              {/* Telefones */}
              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Phone className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">Disk Denúncia</p>
                  <p className="text-gray-300">{contactInfo.telefone1}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <Phone className="text-cpe-gold w-6 h-6" />
                <div>
                  <p className="text-white font-medium">Contato</p>
                  <p className="text-gray-300">{contactInfo.telefone2}</p>
                </div>
              </div>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/cpe_anapolis_oficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-4 p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30 hover:border-pink-500/50 hover:bg-pink-500/5 transition-colors duration-200 group"
              >
                <InstagramIcon className="text-cpe-gold group-hover:text-pink-400 transition-colors duration-200 w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Instagram</p>
                  <p className="text-gray-300">@cpe_anapolis_oficial</p>
                </div>
              </a>

              {/* Endereço */}
              <div className="p-4 bg-cpe-gray/20 rounded-lg border border-cpe-gray/30">
                <p className="text-white font-medium mb-1">Endereço</p>
                <p className="text-gray-300">{contactInfo.endereco}</p>
              </div>
            </div>
          </div>

          {/* Google Maps - CPE Anápolis */}
          <div className="relative mt-[50px] rounded-lg overflow-hidden border-4 border-[#d97706] shadow-lg h-[450px]">
            {/* Mapa estilizado (preto e branco) */}
            <iframe
              title="Mapa da CPE Anápolis"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3767.823508907879!2d-48.9489158!3d-16.3157339!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ea46c91488b5d%3A0xe76f9fd20147d425!2sCPE%20ANAPOLIS%2031%C2%BA%20CIPM%2FCPE%20Companhia%20de%20Policiamento%20Especializado!5e0!3m2!1spt-BR!2sbr!4v1731411600000"
              width="100%"
              height="100%"
              style={{ border: 0}}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>

            {/* Marcador laranja pulsante */}
            <div className="absolute w-5 h-5 bg-[#d97706] rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contacts;
