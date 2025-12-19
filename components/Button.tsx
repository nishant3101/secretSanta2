import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "px-5 py-2.5 rounded-sm font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs";
  
  const variants = {
    primary: "bg-lodha-gold hover:bg-lodha-goldDark text-white shadow-md hover:shadow-lg",
    secondary: "bg-lodha-slate hover:bg-lodha-slateLight text-white",
    danger: "border border-red-200 text-red-600 hover:bg-red-50",
    outline: "border border-lodha-gold text-lodha-gold hover:bg-lodha-gold hover:text-white"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};