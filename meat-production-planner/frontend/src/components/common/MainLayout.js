import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { lastSaved } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Planiranje prodaje', href: '/sales-planning', icon: '🛒' },
    { name: 'Planiranje proizvodnje', href: '/production-planning', icon: '🏭' },
    { name: 'Pregled', href: '/planning-overview', icon: '✅' },
    { name: 'Izdelki', href: '/products', icon: '📦' },
    { name: 'Cene', href: '/pricing', icon: '💰' },
    { name: 'Delavci', href: '/workers', icon: '👥' },
    { name: 'Stranke', href: '/customers', icon: '🏢' },
    { name: 'Poročila', href: '/reports', icon: '📈' },
    { name: 'Nastavitve', href: '/settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-primary-600 to-primary-700">
            <h1 className="text-xl font-bold text-white">AGP Planiranje</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white lg:hidden"
            >
              ✕
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Odjava
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 flex flex-col flex-1`}>
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <p className="text-xs text-green-600">
                  ✓ Podatki shranjeni {lastSaved.toLocaleTimeString('sl-SI')}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;