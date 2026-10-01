import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { signupSchema } from '../validation/authSchemas';
import '../components/forms.css';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      // confirmPassword is a client-side typo guard only — the API never sees it.
      const { confirmPassword, ...credentials } = values;
      await signup(credentials);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Your neighborhood, on the record."
      subtitle="Create an account to report problems with a photo and a map pin, and follow every report until it's resolved."
    >
      <h2>Create your account</h2>
      <p className="subtitle">It takes less than a minute.</p>

      {serverError && <div className="form-banner-error">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          error={errors.name}
          {...register('name')}
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email}
          {...register('email')}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password}
          {...register('password')}
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          revealable
          error={errors.confirmPassword}
          {...register('confirmPassword')}
        />
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="form-divider">or</div>
      <GoogleButton />

      <p className="form-footer-link">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
