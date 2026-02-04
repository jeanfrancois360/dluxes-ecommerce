'use client';

import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
  regex?: RegExp;
  checkFn?: (pwd: string) => boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const requirements = useMemo<PasswordRequirement[]>(() => [
    {
      label: 'At least 12 characters',
      met: password.length >= 12,
      checkFn: (pwd) => pwd.length >= 12,
    },
    {
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
      regex: /[A-Z]/,
    },
    {
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
      regex: /[a-z]/,
    },
    {
      label: 'One number',
      met: /\d/.test(password),
      regex: /\d/,
    },
    {
      label: 'One special character (@$!%*?&)',
      met: /[@$!%*?&]/.test(password),
      regex: /[@$!%*?&]/,
    },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter((req) => req.met).length;
    const percentage = (metCount / requirements.length) * 100;

    if (percentage === 0) return { level: 'none', label: '', color: '' };
    if (percentage < 40) return { level: 'weak', label: 'Weak', color: 'bg-red-500' };
    if (percentage < 60) return { level: 'fair', label: 'Fair', color: 'bg-orange-500' };
    if (percentage < 100) return { level: 'good', label: 'Good', color: 'bg-yellow-500' };
    return { level: 'strong', label: 'Strong', color: 'bg-green-500' };
  }, [requirements]);

  const metCount = requirements.filter((req) => req.met).length;
  const allRequirementsMet = metCount === requirements.length;

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Password strength</span>
          {strength.label && (
            <span
              className={`font-medium ${
                strength.level === 'weak'
                  ? 'text-red-600'
                  : strength.level === 'fair'
                    ? 'text-orange-600'
                    : strength.level === 'good'
                      ? 'text-yellow-600'
                      : 'text-green-600'
              }`}
            >
              {strength.label}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(metCount / requirements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  req.met
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {req.met ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`${
                  req.met ? 'text-gray-700' : 'text-gray-500'
                }`}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {allRequirementsMet && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">Password meets all requirements</span>
        </div>
      )}
    </div>
  );
}

/**
 * Validate password against all requirements
 * Returns error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 12) {
    return 'Password must be at least 12 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[@$!%*?&]/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&)';
  }
  return null;
}
