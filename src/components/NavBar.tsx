import React from 'react';

export const NavBar: React.FC = () => {
  return (
    <nav className="navbar border-b p-4 flex justify-between items-center">
      <div className="font-bold text-xl">Logo</div>
      <div className="flex gap-4">
        <a href="#home">Home</a>
        <a href="#about">About</a>
      </div>
    </nav>
  );
};
