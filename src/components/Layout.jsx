import React from 'react';
import Sidebar from './Sidebar';
import { useFinance } from '@/context/FinanceContext';
import VindexLogo from './VindexLogo';

const Layout = ({ children }) => {
  const { isSidebarCollapsed, toggleMobileMenu } = useFinance();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-vindex-bg font-mono text-gray-900 dark:text-vindex-text transition-colors duration-300">
      <Sidebar />
      
      <div 
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
        `}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-4 border-b border-gray-200 dark:border-vindex-border bg-white dark:bg-vindex-card sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center">
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-vindex-border/50 text-gray-900 dark:text-vindex-text mr-4"
            >
              <i className='bx bx-menu text-2xl'></i>
            </button>
             <div className="flex items-center gap-2">
              <VindexLogo collapsed={false} /> 
             </div>
          </div>
        </div>

        <main className="flex-1 p-6 sm:p-8 md:p-10 lg:p-12 max-w-screen-2xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;