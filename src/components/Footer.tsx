import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer border-t p-8 text-center mt-12">
      <p>&copy; {new Date().getFullYear()} Uday. All rights reserved.</p>
    </footer>
  );
};
