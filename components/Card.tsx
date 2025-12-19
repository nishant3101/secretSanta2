import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-8 ${className}`}>
      {children}
    </div>
  );
};