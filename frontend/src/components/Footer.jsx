import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border-hairline bg-bg-card pt-16 pb-8">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="mb-4 flex items-center gap-2">
              <img src="/favicon.svg" alt="" aria-hidden="true" className="h-7 w-7" />
              <span className="font-heading text-xl font-semibold tracking-tight text-text-heading">
                Parchi
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-text-muted">
              Track key markers across your lab reports and see where each one is heading.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-text-heading">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="text-sm text-text-muted transition-colors hover:text-primary">
                  How it works
                </a>
              </li>
              <li>
                <a href="#for-clinics" className="text-sm text-text-muted transition-colors hover:text-primary">
                  For clinics
                </a>
              </li>
              <li>
                <a href="#for-you" className="text-sm text-text-muted transition-colors hover:text-primary">
                  For you
                </a>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-text-muted transition-colors hover:text-primary">
                  Upload a report
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-text-heading">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-text-muted transition-colors hover:text-primary">About</a></li>
              <li><a href="#" className="text-sm text-text-muted transition-colors hover:text-primary">Contact</a></li>
              <li><a href="#" className="text-sm text-text-muted transition-colors hover:text-primary">Privacy policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-text-heading">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-sm text-text-muted transition-colors hover:text-primary">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-sm text-text-muted transition-colors hover:text-primary">
                  Create an account
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="text-sm text-text-muted transition-colors hover:text-primary">
                  Reset password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border-hairline pt-8 md:flex-row">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} Parchi. Parchi shows direction from past reports and does not diagnose.
          </p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-text-muted transition-colors hover:text-primary">Twitter</a>
            <a href="#" className="text-xs text-text-muted transition-colors hover:text-primary">LinkedIn</a>
            <a href="#" className="text-xs text-text-muted transition-colors hover:text-primary">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
