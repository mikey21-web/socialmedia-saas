import React from 'react';

export const NavBar: React.FC = () => {
  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="text-xl font-bold text-gray-900">
          Uday - AI Automation
        </div>
        <div className="space-x-6">
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Home</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">Services</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium">About</a>
        </div>
      </div>
    </nav>
  );
};
