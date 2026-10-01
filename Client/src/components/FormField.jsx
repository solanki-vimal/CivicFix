import { forwardRef, useState } from 'react';

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

// forwardRef is required here. react-hook-form's register() returns a `ref`
// that has to land on the real <input> DOM node so it can read the field's
// value. In React 18 a plain function component never receives `ref` as a
// prop, so without forwardRef every field reads as empty and validation
// fails on every field no matter what was typed.
//
// `revealable` adds a show/hide button, and only applies to type="password".
const FormField = forwardRef(function FormField(
  { label, error, revealable = false, type = 'text', id, ...inputProps },
  ref
) {
  const [visible, setVisible] = useState(false);

  const canReveal = type === 'password' && revealable;
  const inputType = canReveal && visible ? 'text' : type;
  const errorId = id ? `${id}-error` : undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          ref={ref}
          id={id}
          type={inputType}
          className={canReveal ? 'has-toggle' : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {canReveal && (
          <button
            type="button"
            className="reveal-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <div id={errorId} className="field-error" role="alert">
          {error.message}
        </div>
      )}
    </div>
  );
});

export default FormField;
