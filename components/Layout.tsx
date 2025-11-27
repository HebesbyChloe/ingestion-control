'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, CalendarClock, Scale, Radio, Activity, Settings, Bell, Zap, Menu, X, LogOut, Shield, User } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import { useState } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from './ui/badge';

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, loading, signOut, isAdmin } = useSupabaseAuth();
  const { permissions } = usePermissions();
  
  // Define all navigation items with role requirements
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', canAccess: true },
    { id: 'schedules', label: 'Schedules', icon: CalendarClock, href: '/schedules', canAccess: permissions.canAccessSchedules },
    { id: 'workers', label: 'Jobs', icon: Zap, href: '/workers', canAccess: permissions.canAccessWorkers },
    { id: 'rules', label: 'Rules', icon: Scale, href: '/rules', canAccess: permissions.canAccessRules },
    { id: 'feeds', label: 'Feeds', icon: Radio, href: '/feeds', canAccess: permissions.canAccessFeeds },
    { id: 'admin-users', label: 'Admin Users', icon: Shield, href: '/admin/users', canAccess: permissions.canManageUsers },
    { id: 'admin-roles', label: 'Roles', icon: Settings, href: '/admin/roles', canAccess: permissions.canManageRoles },
  ];

  // Filter navigation items based on permissions
  const navItems = allNavItems.filter(item => item.canAccess);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'developer':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'accountant':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'staff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActivePage = () => {
    if (pathname === '/') return 'dashboard';
    if (pathname.startsWith('/admin/roles')) return 'admin-roles';
    if (pathname.startsWith('/admin/users')) return 'admin-users';
    if (pathname.startsWith('/admin')) return 'admin-users';
    return pathname.replace('/', '') || 'dashboard';
  };

  const activePage = getActivePage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col shadow-sm transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="p-6 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                Ingest<span className="font-light">AI</span>
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "text-indigo-700 bg-indigo-50 border border-indigo-100 shadow-sm" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon className={cn("w-5 h-5 relative z-10 transition-colors", isActive ? "text-indigo-600" : "group-hover:text-indigo-600")} />
                  <span className="relative z-10 font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <span className="text-xs font-bold text-indigo-600">
                  {loading ? '...' : getInitials(profile?.full_name || null, user?.email || '')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {loading ? 'Loading...' : profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {loading ? '...' : user?.email}
                </p>
                {profile && (
                  <Badge className={cn('mt-1 text-[10px] px-1.5 py-0', getRoleBadgeColor(profile.role))}>
                    {profile.role}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
              size="sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth bg-white/50">
          {/* Header */}
          <header className="sticky top-0 z-20 px-4 sm:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 capitalize">{activePage}</h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">System Operational • All workers active</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Network Stable
              </div>
              <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-white" />
              </Button>
            </div>
          </header>

          <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-20 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                  isActive 
                    ? "text-indigo-600" 
                    : "text-slate-400"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

