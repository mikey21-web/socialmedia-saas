import React from 'react';

export interface SectionHeadingProps {
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  centered?: boolean;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  level = 'h2',
  centered = false,
  subtitle,
  children,
  className = '',
}) => {
  const Tag = level as any;

  const headingClasses = {
    h1: 'text-5xl font-extrabold tracking-tight',
    h2: 'text-4xl font-bold tracking-tight',
    h3: 'text-3xl font-semibold',
    h4: 'text-2xl font-semibold',
    h5: 'text-xl font-medium',
    h6: 'text-lg font-medium',
  };

  return (
    <div className={`mb-8 ${centered ? 'text-center' : ''} ${className}`}>
      <Tag className={`${headingClasses[level]} text-gray-900 mb-2`}>
        {children}
      </Tag>
      {subtitle && (
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
};
