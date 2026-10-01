// Shared split-panel shell for Login and Signup — brand statement + an
// original inline SVG motif on the left, the actual form on the right.

import './AuthLayout.css';

function CivicMotif() {
  // A simple skyline + a located map pin, drawn directly rather than a
  // stock photo — keeps the brand panel specific to the product's subject
  // (reporting a physical problem at a physical location in a city).
  return (
    <svg className="auth-motif" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="110" width="30" height="70" rx="2" fill="#0b3d41" />
      <rect x="58" y="80" width="34" height="100" rx="2" fill="#0d454a" />
      <rect x="100" y="130" width="26" height="50" rx="2" fill="#0b3d41" />
      <rect x="234" y="100" width="30" height="80" rx="2" fill="#0d454a" />
      <rect x="270" y="120" width="28" height="60" rx="2" fill="#0b3d41" />
      <rect x="20" y="180" width="278" height="4" rx="2" fill="#0b3d41" />
      <circle cx="168" cy="70" r="26" fill="#d6a419" opacity="0.15" />
      <path
        d="M168 40c-16.6 0-30 13.4-30 30 0 22.5 30 56 30 56s30-33.5 30-56c0-16.6-13.4-30-30-30z"
        fill="#d6a419"
      />
      <circle cx="168" cy="70" r="11" fill="#0b3d41" />
    </svg>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-mark">CivicFix</div>
        <div className="auth-brand-statement">
          <CivicMotif />
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div />
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-card">{children}</div>
      </div>
    </div>
  );
}
