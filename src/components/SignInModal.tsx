import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AppUser, UserRole } from '../types';
import { Building2, Store, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface SignInModalProps {
  onSignInSuccess: (user: AppUser) => void;
}

export default function SignInModal({ onSignInSuccess }: SignInModalProps) {
  const [role, setRole] = useState<UserRole>('buyer');
  const [organization, setOrganization] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick preset login
  const handleQuickDemo = (demoRole: UserRole) => {
    const isBuyer = demoRole === 'buyer';
    const demoUser: AppUser = {
      uid: isBuyer ? 'demo_school_buyer' : 'demo_supplier_apex',
      email: isBuyer ? 'procurement@lincolnhigh.edu' : 'sales@apexsupplies.com',
      displayName: isBuyer ? 'Sarah Jenkins' : 'Marcus Vance',
      role: demoRole,
      organization: isBuyer ? 'Lincoln High School' : 'Apex STEM & Stationery Wholesale',
      address: isBuyer ? '350 5th Ave, New York, NY' : '420 Commercial Blvd, Long Island City, NY',
      lat: isBuyer ? 40.7484 : 40.745,
      lng: isBuyer ? -73.9857 : -73.948,
    };
    onSignInSuccess(demoUser);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      // Check if user document already exists in Firestore
      const userDocRef = doc(db, 'users', fbUser.uid);
      const existingSnap = await getDoc(userDocRef);

      let appUser: AppUser;
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        appUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: data.name || fbUser.displayName || 'User',
          role: data.role || role,
          organization: data.organization || (role === 'buyer' ? 'Westfield School District' : 'Quality Supplies Co.'),
          address: data.address || 'New York, NY',
          lat: data.lat || 40.7128,
          lng: data.lng || -74.006,
        };
      } else {
        appUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || name || 'User',
          role: role,
          organization: organization || (role === 'buyer' ? 'Westfield School District' : 'Quality Supplies Co.'),
          address: 'New York, NY',
          lat: 40.7128,
          lng: -74.006,
        };
        // Persist to Firestore
        await setDoc(userDocRef, {
          userId: appUser.uid,
          email: appUser.email,
          name: appUser.displayName,
          role: appUser.role,
          organization: appUser.organization,
          phone: '',
          address: appUser.address,
          lat: appUser.lat,
          lng: appUser.lng,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      onSignInSuccess(appUser);
    } catch (err: unknown) {
      console.error('Sign In Error:', err);
      // If popup was blocked or failed, give clear option
      setError('Google Sign-In unavailable. Use Quick Sign-In below.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const customUser: AppUser = {
      uid: 'user_' + Math.random().toString(36).substring(2, 9),
      email: `${name.toLowerCase().replace(/\s+/g, '')}@campusdirect.io`,
      displayName: name.trim(),
      role,
      organization: organization.trim() || (role === 'buyer' ? 'Oakridge Academy' : 'Beacon Academic Distributors'),
      address: 'New York, NY',
      lat: 40.7306,
      lng: -73.9352,
    };
    onSignInSuccess(customUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white p-6 md:p-8 shadow-xl border border-sky-100">
        {/* Shiny gradient overlay header */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-gradient-to-br from-sky-300/30 via-cyan-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-gradient-to-tl from-sky-200/30 via-blue-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo & Headline */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-1">
              <img
                src="/assets/aistudio/file_0000000040a4824395e1b68c717e7a9a_78bdb3ec.png"
                alt="Nerevana"
                className="h-24 sm:h-28 w-auto object-contain drop-shadow-xs"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Institutional &amp; School Supplier Procurement
            </p>
          </div>

          {/* Role Toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-lg border border-slate-200/70">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  role === 'buyer'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>School / Buyer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('supplier')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-xs font-semibold transition-all ${
                  role === 'supplier'
                    ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4 text-sky-600" />
                <span>Supplier / Seller</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white border border-slate-200 hover:border-sky-300 text-slate-800 text-sm font-semibold shadow-xs hover:shadow-sm transition-all mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12c0 2.02.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
              Or Quick Start
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Quick Start Buttons for Instant Testing */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              type="button"
              onClick={() => handleQuickDemo('buyer')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-sky-100 bg-sky-50/60 hover:bg-sky-100/60 transition-all text-left group"
            >
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-sky-800">Demo School</span>
                <ArrowRight className="w-3 h-3 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[11px] text-slate-500 w-full truncate">Lincoln High School</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('supplier')}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-blue-100 bg-blue-50/60 hover:bg-blue-100/60 transition-all text-left group"
            >
              <div className="w-full flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-blue-800">Demo Supplier</span>
                <ArrowRight className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <span className="text-[11px] text-slate-500 w-full truncate">Apex Supplies</span>
            </button>
          </div>

          {/* Custom Name / Org Form (Collapsible/direct) */}
          <form onSubmit={handleCustomStart} className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
            <div>
              <input
                type="text"
                placeholder={role === 'buyer' ? 'Your Name (e.g., Alex Reed)' : 'Sales Rep Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-sky-500 bg-slate-50/50"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder={role === 'buyer' ? 'School/Institution Name' : 'Supplier Company Name'}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-sky-500 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-semibold shadow-sm hover:from-sky-600 hover:to-blue-700 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Continue as {role === 'buyer' ? 'Buyer' : 'Supplier'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
