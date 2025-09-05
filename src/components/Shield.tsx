import React from 'react';

const Shield: React.FC = () => {
  return (
    <div className="flex justify-center">
      <div className="w-32 h-40 sm:w-40 sm:h-48 lg:w-48 lg:h-56 relative group">
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-2xl group-hover:drop-shadow-3xl transition-all duration-300"
          role="img"
          aria-label="Escudo da CPE Anápolis"
        >
          {/* Glow effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D90404" stopOpacity="0.9"/>
              <stop offset="50%" stopColor="#F0941F" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#D90404" stopOpacity="0.9"/>
            </linearGradient>
            <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#363432" stopOpacity="0.8"/>
              <stop offset="50%" stopColor="#0A0B0D" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#363432" stopOpacity="0.8"/>
            </linearGradient>
          </defs>
          
          {/* Main shield shape */}
          <path
            d="M50 5 C20 5, 10 20, 10 35 C10 70, 25 95, 50 115 C75 95, 90 70, 90 35 C90 20, 80 5, 50 5 Z"
            fill="url(#shieldGradient)"
            stroke="#F0941F"
            strokeWidth="2"
            filter="url(#glow)"
          />
          
          {/* Inner shield */}
          <path
            d="M50 12 C25 12, 17 24, 17 36 C17 64, 28 84, 50 102 C72 84, 83 64, 83 36 C83 24, 75 12, 50 12 Z"
            fill="url(#innerGradient)"
            stroke="#D90404"
            strokeWidth="1"
          />
          
          {/* Center emblem */}
          <circle cx="50" cy="45" r="15" fill="#D90404" stroke="#F0941F" strokeWidth="1"/>
          <circle cx="50" cy="45" r="10" fill="#F0941F" opacity="0.8"/>
          
          {/* CPE letters */}
          <text x="50" y="50" textAnchor="middle" className="fill-white font-bold text-xs">CPE</text>
          
          {/* Decorative elements */}
          <path d="M30 75 L35 70 L40 75 L45 70 L50 75 L55 70 L60 75 L65 70 L70 75" 
                stroke="#F0941F" 
                strokeWidth="2" 
                fill="none" 
                opacity="0.7"/>
          
          <circle cx="35" cy="30" r="2" fill="#F0941F" opacity="0.8"/>
          <circle cx="65" cy="30" r="2" fill="#F0941F" opacity="0.8"/>
          <circle cx="50" cy="85" r="3" fill="#D90404" opacity="0.9"/>
        </svg>
      </div>
    </div>
  );
};

export default Shield;