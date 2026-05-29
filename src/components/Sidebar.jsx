import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import VindexLogo from './VindexLogo';
import { ShieldAlert } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useFinance();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const mainNavItems = [
    { path: '/dashboard', iconClass: 'bx bxs-dashboard', label: 'Dashboard' },
    { path: '/transacoes', iconClass: 'bx bx-receipt', label: 'Transações' },
    { path: '/faturas', iconClass: 'bx bx-file-blank', label: 'Faturas' },
    { path: '/contas', iconClass: 'bx bx-wallet', label: 'Contas' },
    { path: '/investimentos', iconClass: 'bx bx-trending-up', label: 'Investimentos' },
    { path: '/analises', iconClass: 'bx bx-stats', label: 'Análises' },
    { path: '/metas', iconClass: 'bx bx-target-lock', label: 'Metas' },
    { path: '/categorias', iconClass: 'bx bx-tag', label: 'Categorias' },
    { path: '/recorrencias', iconClass: 'bx bx-revision', label: 'Recorrências' },
  ];

  const bottomNavItems = [
    { path: '/suporte', iconClass: 'bx bx-help-circle', label: 'Suporte' },
    { path: '/configuracoes', iconClass: 'bx bx-cog', label: 'Configurações' },
  ];

  const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-72';

  const NavItem = ({ item, isActive, isLucide }) => (
    <Link to={item.path} onClick={() => isMobileMenuOpen && toggleMobileMenu()}>
      <motion.div
        whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        className={`
          flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-6'} py-3 mx-2 rounded-lg mb-1
          transition-all duration-200 group relative
          ${isActive || (item.path === '/faturas' && location.pathname.startsWith('/faturas'))
            ? 'bg-primary text-white shadow-[0_0_15px_rgba(67,207,234,0.3)]' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-vindex-border/50 dark:hover:text-vindex-text'
          }
        `}
      >
        {isLucide ? (
          <ShieldAlert size={20} className="flex-shrink-0" />
        ) : (
          <i className={`${item.iconClass} text-xl flex-shrink-0`}></i>
        )}
        
        {!isSidebarCollapsed && (
          <span className="font-medium ml-3 whitespace-nowrap overflow-hidden">{item.label}</span>
        )}

        {isSidebarCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-md">
            {item.label}
          </div>
        )}
      </motion.div>
    </Link>
  );

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <div 
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-vindex-card border-r border-gray-200 dark:border-vindex-border flex flex-col
          transition-all duration-300 ease-in-out z-50
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${sidebarWidth}
        `}
      >
        <div className={`p-6 border-b border-gray-200 dark:border-vindex-border flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/dashboard" onClick={() => isMobileMenuOpen && toggleMobileMenu()} className="flex-shrink-0 min-w-0 flex items-center overflow-hidden">
            <VindexLogo collapsed={isSidebarCollapsed} />
          </Link>
          
          {!isSidebarCollapsed && (
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-vindex-border/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-vindex-text transition-colors hidden md:block flex-shrink-0 ml-2"
            >
              <i className='bx bx-chevron-left text-2xl'></i>
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="w-full flex justify-center py-2 hidden md:flex">
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-vindex-border/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-vindex-text transition-colors"
            >
              <i className='bx bx-chevron-right text-2xl'></i>
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-vindex-border py-4">
          {bottomNavItems.map((item) => (
            <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
          ))}
          
          <NavItem 
            key="/privacy" 
            item={{ path: '/privacy', label: 'Privacidade' }} 
            isActive={location.pathname === '/privacy'} 
            isLucide={true}
          />
          
          <button onClick={handleLogout} className="w-full">
            <motion.div
              whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-6'} py-3 mx-2 rounded-lg
                transition-all duration-200 group relative
                text-red-600 dark:text-vindex-danger hover:bg-red-50 dark:hover:bg-vindex-danger/10
              `}
            >
              <i className='bx bx-log-out text-xl flex-shrink-0'></i>
              {!isSidebarCollapsed && (
                <span className="font-medium ml-3 whitespace-nowrap overflow-hidden">Sair</span>
              )}
              
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-md">
                  Sair
                </div>
              )}
            </motion.div>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;