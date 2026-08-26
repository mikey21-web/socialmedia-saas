import React from 'react';

interface CardProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div className="card border rounded p-4 shadow-sm hover:shadow-md transition-shadow">
      {children}
    </div>
  );
};
