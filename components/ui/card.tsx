import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-xl ${className}`}>
      {children}
    </div>
  );
} 