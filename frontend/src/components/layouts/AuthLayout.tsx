import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center">
          <div className="w-10 h-10 bg-[#b50900] rounded-md flex items-center justify-center mr-3">
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <h1 className="text-xl font-bold text-[#b50900]">AIET College ERP</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} AIET College. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout; 