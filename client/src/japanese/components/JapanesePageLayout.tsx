import React from 'react';

interface JapanesePageLayoutProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

const JapanesePageLayout: React.FC<JapanesePageLayoutProps> = ({ 
  children, 
  className = '', 
  innerClassName = '' 
}) => {
  return (
    <div className={`flex flex-col h-screen bg-[url('/103372501_p0.png')] bg-cover bg-center overflow-hidden ${className}`}>
      <div className={`w-full xl:w-6/10 mx-auto h-full bg-slate-50/95 backdrop-blur-sm shadow-2xl border-x border-slate-100 flex flex-col overflow-hidden ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default JapanesePageLayout;
 