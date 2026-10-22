import { AppUser } from '../types';
import { Sparkles, Building2, Store, LogOut, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: AppUser | null;
  onSignOut: () => void;
  onSwitchRole: () => void;
  pendingOrdersCount?: number;
}

export default function Navbar({
  user,
  onSignOut,
  onSwitchRole,
  pendingOrdersCount = 0,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/file_0000000040a4824395e1b68c717e7a9a_78bdb3ec.png"
            alt="Nerevana"
            className="h-9 w-auto object-contain"
          />
          <div>
            <span className="font-extrabold text-sm tracking-wider text-slate-900 uppercase block leading-tight">
              Nerevana
            </span>
            {user && (
              <p className="text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-xs font-medium">
                {user.organization}
              </p>
            )}
          </div>
        </div>

        {/* Right Actions */}
        {user ? (
          <div className="flex items-center gap-2">
            {/* Quick role toggle */}
            <button
              onClick={onSwitchRole}
              title="Switch between Buyer and Supplier mode"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-700 text-xs font-medium transition-all bg-slate-50/50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">
                Switch to {user.role === 'buyer' ? 'Supplier' : 'Buyer'}
              </span>
              <span className="sm:hidden">
                {user.role === 'buyer' ? 'Supplier' : 'Buyer'}
              </span>
            </button>

            {/* Logout button */}
            <button
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
