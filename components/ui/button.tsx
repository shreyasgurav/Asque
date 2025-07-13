import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'default', 
  size = 'md', 
  disabled = false, 
  className = '' 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900';
  
  const variantClasses = {
    default: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg',
    outline: 'bg-slate-700/30 border border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-700/50',
    secondary: 'bg-slate-600/20 text-slate-300 hover:bg-slate-600/30'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
} 