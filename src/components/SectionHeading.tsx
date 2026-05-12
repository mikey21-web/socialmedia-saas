import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  centered?: boolean;
  subtitle?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ children, level = 'h2', centered = false, subtitle }) => {
  const Tag = level as keyof React.JSX.IntrinsicElements;
  return (
    <div className={`section-heading ${centered ? 'text-center' : ''}`}>
      <Tag className="text-3xl font-bold">{children}</Tag>
      {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
};
