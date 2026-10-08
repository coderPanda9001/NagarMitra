import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { CivicLogo } from '../../components/common/CivicLogo';
import { DemoBadge } from '../../components/common/DemoBadge';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .regex(/^[0-9+\s-]+$/, 'Invalid phone number format'),
    ward: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ward: 'Ward H/West (Bandra)',
    },
  });

  const [apiError, setApiError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      await registerUser(
        data.fullName,
        data.email,
        data.password,
        'Citizen',
        data.ward || 'Ward K-West'
      );
      setSubmitted(true);
      setTimeout(() => {
        navigate('/citizen');
      }, 1000);
    } catch (err: any) {
      setApiError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <CivicLogo size="md" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Citizen Registration</h1>
            <DemoBadge label="Demo Platform" />
          </div>
          <p className="text-xs text-slate-500">
            Create an account to report civic issues and track municipal resolutions.
          </p>
        </div>

        {apiError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900">Registration Successful!</h3>
            <p className="text-xs text-emerald-700">
              Logging you into the Citizen Portal...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Aarav Sharma"
                {...register('fullName')}
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 ${
                  errors.fullName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="aarav.sharma@example.com"
                  {...register('email')}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 ${
                    errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {errors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  placeholder="+91 98200 12345"
                  {...register('phone')}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 ${
                    errors.phone ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Primary Municipal Ward (Optional)
              </label>
              <select
                {...register('ward')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="Ward H/West (Bandra)">Ward H/West (Bandra)</option>
                <option value="Ward K/West (Andheri)">Ward K/West (Andheri)</option>
                <option value="Ward A (Colaba)">Ward A (Colaba)</option>
                <option value="Ward G/North (Dadar)">Ward G/North (Dadar)</option>
                <option value="Ward D (Malabar Hill)">Ward D (Malabar Hill)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 ${
                    errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {errors.password && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 ${
                    errors.confirmPassword ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Complete Citizen Registration'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
          <span>Already registered?</span>
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
