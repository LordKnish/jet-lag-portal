import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-jl-cream flex flex-col">
      <header className="w-full bg-jl-teal shrink-0">
        <div className="w-full h-16 px-4 flex items-center">
          <h1 className="text-2xl font-display font-bold text-jl-cream">
            Jet Lag: Tel Aviv
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full overflow-auto">
        <div className="h-full w-full p-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;