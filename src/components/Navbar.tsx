import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Home, Activity, Terminal, FileText, BookOpen, BarChart3, Menu, X } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/topology', label: 'Topology', icon: Activity },
  { path: '/syn-flood', label: 'SYN Flood', icon: Shield },
  { path: '/arp-spoof', label: 'ARP Spoof', icon: Shield },
  { path: '/mac-flood', label: 'MAC Flood', icon: Shield },
  { path: '/traffic', label: 'Traffic Analysis', icon: Terminal },
  { path: '/config', label: 'Config Lab', icon: FileText },
  { path: '/results', label: 'Results', icon: BarChart3 },
  { path: '/docs', label: 'Documentation', icon: BookOpen },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-blue to-cyan-400 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-navy-900" strokeWidth={2.5} />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-white tracking-tight">NetAttack</span>
                <span className="text-sm font-bold text-cyber-blue tracking-tight"> Lab</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-cyber-blue/10 text-cyber-blue'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-cyber-green status-pulse" />
                Simulation Ready
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-14 left-0 right-0 bg-navy-800 border-b border-white/5 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyber-blue/10 text-cyber-blue'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}
