import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../validation/authSchemas';
import '../components/forms.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Report it. Track it. See it fixed."
      subtitle="CivicFix connects citizens directly with the municipal teams responsible for fixing the problems in their neighborhood."
    >
      <h2>Log in</h2>
      <p className="subtitle">Welcome back — enter your details to continue.</p>

      {serverError && <div className="form-banner-error">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
          autoComplete="current-password"
          revealable
          error={errors.password}
          {...register('password')}
        />
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <div className="form-divider">or</div>
      <GoogleButton />

      {/* No "Forgot password?" link yet,
          the reset-password UI will be implemented in Phase 11. */}
      <p className="form-footer-link">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
