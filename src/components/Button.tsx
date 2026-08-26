import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md' }) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`}>
      {children}
    </button>
  );
};
