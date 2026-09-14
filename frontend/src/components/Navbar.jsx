import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

const marketingLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For clinics', href: '#for-clinics' },
  { label: 'For you', href: '#for-you' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isMarketing = pathname === '/' && !user;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-hairline bg-bg-card/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10">

        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="h-7 w-7" />
            <span className="font-heading text-xl font-semibold tracking-tight text-text-heading">
              Parchi
            </span>
          </Link>

          {isMarketing && (
            <nav className="hidden items-center gap-6 md:flex">
              {marketingLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-text-secondary transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end leading-tight md:flex">
              <span className="text-sm font-medium text-text-main">{user.name}</span>
              <span className="text-xs capitalize text-text-muted">{user.role}</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-medium text-primary-dark">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-main hover:text-text-main"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-text-main transition-colors hover:text-primary sm:block"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Upload a report
            </Link>
            {isMarketing && (
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
                className="ml-1 rounded-lg p-2 text-text-main md:hidden"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        )}
      </div>

      {isMarketing && mobileOpen && (
        <nav className="border-t border-border-hairline bg-bg-card px-6 py-3 md:hidden">
          {marketingLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium text-text-main sm:hidden"
          >
            Log in
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
