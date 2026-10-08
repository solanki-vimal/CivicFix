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
// that has to land on the real form control so it can read the field's
// value. In React 18 a plain function component never receives `ref` as a
// prop, so without forwardRef every field reads as empty.
//
// `as` renders a <select> or <textarea> instead of an <input> (options go in
// as children for a select). `revealable` adds a show/hide button and only
// applies to type="password" inputs.
const FormField = forwardRef(function FormField(
  { label, error, revealable = false, type = 'text', as: Control = 'input', id, children, ...controlProps },
  ref
) {
  const [visible, setVisible] = useState(false);

  const isInput = Control === 'input';
  const canReveal = isInput && type === 'password' && revealable;
  const inputType = canReveal && visible ? 'text' : type;
  const errorId = id ? `${id}-error` : undefined;

  const inputOnlyProps = isInput ? { type: inputType, className: canReveal ? 'has-toggle' : undefined } : {};

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <Control
          ref={ref}
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputOnlyProps}
          {...controlProps}
        >
          {children}
        </Control>
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
