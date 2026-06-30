import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import VindexLogo from './VindexLogo';
import { AlertShield as ShieldAlert } from '@/components/BxIcon';
import BxIcon, {
  Dashboard, Receipt, File, Wallet, TrendingUp, BarChart, Target, Tag,
  History, HelpCircle, Cog, ChevronLeft, ChevronRight, Door,
} from './BxIcon';

const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarCollapsed, toggleSidebar, isMobileMenuOpen, toggleMobileMenu } = useFinance();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const mainNavItems = [
    { path: '/dashboard', Icon: Dashboard, pack: 'filled', label: t('nav.dashboard') },
    { path: '/transactions', Icon: Receipt, label: t('nav.transactions') },
    { path: '/invoices', Icon: File, label: t('nav.invoices') },
    { path: '/accounts', Icon: Wallet, label: t('nav.accounts') },
    { path: '/investments', Icon: TrendingUp, label: t('nav.investments') },
    { path: '/analytics', Icon: BarChart, label: t('nav.analytics') },
    { path: '/goals', Icon: Target, label: t('nav.goals') },
    { path: '/categories', Icon: Tag, label: t('nav.categories') },
    { path: '/recurrences', Icon: History, label: t('nav.recurrences') },
  ];

  const bottomNavItems = [
    { path: '/support', Icon: HelpCircle, label: t('nav.support') },
    { path: '/settings', Icon: Cog, label: t('nav.settings') },
  ];

  const sidebarWidth = isSidebarCollapsed ? 'w-20' : 'w-72';

  const NavItem = ({ item, isActive, isLucide }) => (
    <Link to={item.path} onClick={() => isMobileMenuOpen && toggleMobileMenu()}>
      <motion.div
        whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.08 }}
        className={`
          flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-6'} py-3 mx-2 rounded-lg mb-1
          transition-all duration-75 group relative
          ${isActive || (item.path === '/invoices' && location.pathname.startsWith('/invoices'))
            ? 'bg-primary text-white shadow-[0_0_15px_rgba(67,207,234,0.3)]'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-vindex-border/50 dark:hover:text-vindex-text'
          }
        `}
      >
        {isLucide ? (
          <ShieldAlert size={20} className="flex-shrink-0" />
        ) : item.Icon ? (
          <item.Icon size={20} pack={item.pack || 'basic'} className="flex-shrink-0" />
        ) : null}
        
        {!isSidebarCollapsed && (
          <span className="font-medium ml-3 whitespace-nowrap overflow-hidden">{item.label}</span>
        )}

        {isSidebarCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-75 shadow-md">
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
              <ChevronLeft size={24} />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="w-full flex justify-center py-2 hidden md:flex">
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-vindex-border/50 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-vindex-text transition-colors"
            >
              <ChevronRight size={24} />
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
            item={{ path: '/privacy', label: t('nav.privacy') }}
            isActive={location.pathname === '/privacy'}
            isLucide={true}
          />

          <button onClick={handleLogout} className="w-full">
            <motion.div
              whileHover={{ x: isSidebarCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.08 }}
              className={`
                flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-6'} py-3 mx-2 rounded-lg
                transition-all duration-75 group relative
                text-red-600 dark:text-vindex-danger hover:bg-red-50 dark:hover:bg-vindex-danger/10
              `}
            >
              <Door size={20} className="flex-shrink-0" />
              {!isSidebarCollapsed && (
                <span className="font-medium ml-3 whitespace-nowrap overflow-hidden">{t('nav.logout')}</span>
              )}

              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-white dark:bg-vindex-card border border-gray-200 dark:border-vindex-border text-gray-900 dark:text-vindex-text text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-75 shadow-md">
                  {t('nav.logout')}
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