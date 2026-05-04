/**
 * SignupForm — Sign up form component for Ask Dreeso Memory.
 * Provides name, email, password, and confirm password fields with
 * client-side validation. Stores new user in localStorage via AuthContext.
 * Styled consistently with LoginForm using glassmorphism card and
 * Uber Design System typography. Includes link to login page.
 *
 * @module SignupForm
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/common/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { PERSONA_LIST } from '@/utils/constants';

/**
 * Valid email regex pattern for basic validation.
 * @type {RegExp}
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimum password length.
 * @type {number}
 */
const MIN_PASSWORD_LENGTH = 6;

/**
 * Minimum name length.
 * @type {number}
 */
const MIN_NAME_LENGTH = 2;

/**
 * Validate the name field.
 * @param {string} name - The name string to validate.
 * @returns {string} An error message string, or empty string if valid.
 */
function validateName(name) {
  if (typeof name !== 'string' || name.trim() === '') {
    return 'Name is required';
  }
  if (name.trim().length < MIN_NAME_LENGTH) {
    return `Name must be at least ${MIN_NAME_LENGTH} characters`;
  }
  return '';
}

/**
 * Validate the email field.
 * @param {string} email - The email string to validate.
 * @returns {string} An error message string, or empty string if valid.
 */
function validateEmail(email) {
  if (typeof email !== 'string' || email.trim() === '') {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address';
  }
  return '';
}

/**
 * Validate the password field.
 * @param {string} password - The password string to validate.
 * @returns {string} An error message string, or empty string if valid.
 */
function validatePassword(password) {
  if (typeof password !== 'string' || password === '') {
    return 'Password is required';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return '';
}

/**
 * Validate the confirm password field.
 * @param {string} confirmPassword - The confirm password string to validate.
 * @param {string} password - The original password string to compare against.
 * @returns {string} An error message string, or empty string if valid.
 */
function validateConfirmPassword(confirmPassword, password) {
  if (typeof confirmPassword !== 'string' || confirmPassword === '') {
    return 'Please confirm your password';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }
  return '';
}

/**
 * InputField — Renders a single form input with label, error state, and glassmorphism styling.
 *
 * @param {object} props
 * @param {string} props.id - The input element ID.
 * @param {string} props.label - The label text.
 * @param {string} props.type - The input type (e.g., 'text', 'email', 'password').
 * @param {string} props.value - The current input value.
 * @param {string} props.placeholder - The placeholder text.
 * @param {string} props.error - The error message, or empty string if no error.
 * @param {boolean} props.disabled - Whether the input is disabled.
 * @param {function} props.onChange - Callback when the input value changes.
 * @param {function} [props.onBlur] - Optional callback when the input loses focus.
 * @param {string} [props.autoComplete] - The autocomplete attribute value.
 * @param {import('react').Ref} [props.inputRef] - Optional ref for the input element.
 * @returns {import('react').ReactElement} The input field element.
 */
function InputField({ id, label, type, value, placeholder, error, disabled, onChange, onBlur, autoComplete, inputRef }) {
  const hasError = typeof error === 'string' && error.trim() !== '';

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-dreeso-dark-200"
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        className={`w-full bg-glass-white backdrop-blur-md border rounded-xl px-4 py-3 text-sm text-white placeholder-dreeso-dark-400 outline-none transition-all duration-200 ${
          hasError
            ? 'border-semantic-error/50 focus:border-semantic-error focus:shadow-[0_0_20px_rgba(225,25,0,0.15)]'
            : 'border-glass-border focus:border-dreeso-accent-500 focus:shadow-accent-glow'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
      />
      {hasError && (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs text-semantic-error mt-1"
          role="alert"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

InputField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  autoComplete: PropTypes.string,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
};

/**
 * SignupForm component.
 * Renders a sign up form with name, email, password, and confirm password fields,
 * submit button, and validation. Styled with glassmorphism card and Uber Design
 * System typography. Includes link to login page. Uses AuthContext for signup.
 *
 * @param {object} props
 * @param {string} [props.className=''] - Additional CSS classes to apply to the wrapper.
 * @param {boolean} [props.animated=true] - Whether to apply slide-in animation.
 * @param {function} [props.onSignupSuccess] - Optional callback after successful signup. Receives the session object.
 * @param {function} [props.onLoginClick] - Optional callback when the login link is clicked.
 * @param {string} [props.title='Create Account'] - Form title text.
 * @param {string} [props.subtitle='Sign up to start using Ask Dreeso Memory'] - Form subtitle text.
 * @param {boolean} [props.showTitle=true] - Whether to display the title.
 * @param {boolean} [props.showSubtitle=true] - Whether to display the subtitle.
 * @param {boolean} [props.showLoginLink=true] - Whether to display the login link.
 * @param {string} [props.defaultPersonaId] - Default persona ID to associate with the new account.
 * @returns {import('react').ReactElement} The signup form element.
 */
export function SignupForm({
  className = '',
  animated = true,
  onSignupSuccess,
  onLoginClick,
  title = 'Create Account',
  subtitle = 'Sign up to start using Ask Dreeso Memory',
  showTitle = true,
  showSubtitle = true,
  showLoginLink = true,
  defaultPersonaId,
}) {
  const { signup } = useAuth();
  const { addNotification } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(
    defaultPersonaId && PERSONA_LIST.includes(defaultPersonaId)
      ? defaultPersonaId
      : PERSONA_LIST[0]
  );
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const nameInputRef = useRef(null);
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Focus name input on mount
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  /**
   * Handle name input change.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleNameChange = useCallback((event) => {
    const value = event.target.value;
    setName(value);
    setFormError('');

    if (touched.name) {
      setNameError(validateName(value));
    }
  }, [touched.name]);

  /**
   * Handle email input change.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleEmailChange = useCallback((event) => {
    const value = event.target.value;
    setEmail(value);
    setFormError('');

    if (touched.email) {
      setEmailError(validateEmail(value));
    }
  }, [touched.email]);

  /**
   * Handle password input change.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handlePasswordChange = useCallback((event) => {
    const value = event.target.value;
    setPassword(value);
    setFormError('');

    if (touched.password) {
      setPasswordError(validatePassword(value));
    }

    if (touched.confirmPassword && confirmPassword !== '') {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
    }
  }, [touched.password, touched.confirmPassword, confirmPassword]);

  /**
   * Handle confirm password input change.
   * @param {import('react').ChangeEvent<HTMLInputElement>} event - The change event.
   */
  const handleConfirmPasswordChange = useCallback((event) => {
    const value = event.target.value;
    setConfirmPassword(value);
    setFormError('');

    if (touched.confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(value, password));
    }
  }, [touched.confirmPassword, password]);

  /**
   * Handle name input blur — trigger validation.
   */
  const handleNameBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, name: true }));
    setNameError(validateName(name));
  }, [name]);

  /**
   * Handle email input blur — trigger validation.
   */
  const handleEmailBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, email: true }));
    setEmailError(validateEmail(email));
  }, [email]);

  /**
   * Handle password input blur — trigger validation.
   */
  const handlePasswordBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, password: true }));
    setPasswordError(validatePassword(password));
  }, [password]);

  /**
   * Handle confirm password input blur — trigger validation.
   */
  const handleConfirmPasswordBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, confirmPassword: true }));
    setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
  }, [confirmPassword, password]);

  /**
   * Toggle password visibility.
   */
  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  /**
   * Toggle confirm password visibility.
   */
  const handleToggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  /**
   * Handle persona selection change.
   * @param {import('react').ChangeEvent<HTMLSelectElement>} event - The change event.
   */
  const handlePersonaChange = useCallback((event) => {
    setSelectedPersonaId(event.target.value);
  }, []);

  /**
   * Handle form submission.
   * @param {import('react').FormEvent} event - The form submit event.
   */
  const handleSubmit = useCallback((event) => {
    event.preventDefault();

    // Validate all fields
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, password);

    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (nameErr || emailErr || passwordErr || confirmPasswordErr) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    // Simulate a small delay for UX
    setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }

      try {
        const session = signup(email.trim(), password, selectedPersonaId);

        if (mountedRef.current) {
          setIsSubmitting(false);
          addNotification('success', `Welcome, ${name.trim()}! Your account has been created.`);

          if (typeof onSignupSuccess === 'function') {
            onSignupSuccess(session);
          }
        }
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        const errorMessage = err && err.message ? err.message : 'Sign up failed. Please try again.';
        setFormError(errorMessage);
        setIsSubmitting(false);
      }
    }, 400);
  }, [name, email, password, confirmPassword, selectedPersonaId, signup, addNotification, onSignupSuccess]);

  /**
   * Handle login link click.
   * @param {import('react').MouseEvent} event - The click event.
   */
  const handleLoginClick = useCallback((event) => {
    event.preventDefault();

    if (typeof onLoginClick === 'function') {
      onLoginClick();
      return;
    }
    navigate('/');
  }, [onLoginClick, navigate]);

  const hasTitle = showTitle && typeof title === 'string' && title.trim() !== '';
  const hasSubtitle = showSubtitle && typeof subtitle === 'string' && subtitle.trim() !== '';
  const animationClass = animated ? 'animate-slide-in' : '';
  const isFormValid =
    name.trim() !== '' &&
    email.trim() !== '' &&
    password !== '' &&
    confirmPassword !== '' &&
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError;

  /**
   * Persona label mapping for the select dropdown.
   * @type {Record<string, string>}
   */
  const personaLabels = {
    'persona-lukas': 'Lukas Müller — Project Director',
    'persona-elena': 'Elena Rossi — Senior Quantity Surveyor',
    'persona-sophie': 'Sophie Dubois — Project Manager',
    'persona-james': 'James Carter — Sales Director',
  };

  return (
    <div className={`w-full max-w-md mx-auto ${animationClass} ${className}`}>
      <GlassCard
        variant="default"
        animated={false}
        className="space-y-6"
      >
        {/* Header */}
        {(hasTitle || hasSubtitle) && (
          <div className="text-center space-y-2">
            {hasTitle && (
              <h1 className="text-2xl font-semibold text-white">
                {title}
              </h1>
            )}
            {hasSubtitle && (
              <p className="text-sm text-dreeso-dark-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-dreeso-accent-500 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-6.5-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 013.5 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM5.404 5.404a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zm8.131 8.132a.75.75 0 011.06 0l1.061 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM5.404 14.596a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm8.131-8.132a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.061 1.06l-1.06 1.06a.75.75 0 01-1.061 0z" />
              <path fillRule="evenodd" d="M10 6a4 4 0 100 8 4 4 0 000-8zm-2.5 4a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Form error */}
        {formError && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-semantic-error/5 border border-semantic-error/20 rounded-xl" role="alert">
            <svg className="w-4.5 h-4.5 text-semantic-error shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-semantic-error leading-relaxed">
              {formError}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name field */}
          <InputField
            id="signup-name"
            label="Full Name"
            type="text"
            value={name}
            placeholder="Your full name"
            error={nameError}
            disabled={isSubmitting}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoComplete="name"
            inputRef={nameInputRef}
          />

          {/* Email field */}
          <InputField
            id="signup-email"
            label="Email"
            type="email"
            value={email}
            placeholder="you@example.com"
            error={emailError}
            disabled={isSubmitting}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            autoComplete="email"
          />

          {/* Password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="block text-sm font-medium text-dreeso-dark-200"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                name="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Create a password"
                disabled={isSubmitting}
                onChange={handlePasswordChange}
                onBlur={handlePasswordBlur}
                autoComplete="new-password"
                className={`w-full bg-glass-white backdrop-blur-md border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-dreeso-dark-400 outline-none transition-all duration-200 ${
                  passwordError
                    ? 'border-semantic-error/50 focus:border-semantic-error focus:shadow-[0_0_20px_rgba(225,25,0,0.15)]'
                    : 'border-glass-border focus:border-dreeso-accent-500 focus:shadow-accent-glow'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'signup-password-error' : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-dreeso-dark-400 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                onClick={handleTogglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p
                id="signup-password-error"
                className="flex items-center gap-1.5 text-xs text-semantic-error mt-1"
                role="alert"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm password field */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-confirm-password"
              className="block text-sm font-medium text-dreeso-dark-200"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                name="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                placeholder="Confirm your password"
                disabled={isSubmitting}
                onChange={handleConfirmPasswordChange}
                onBlur={handleConfirmPasswordBlur}
                autoComplete="new-password"
                className={`w-full bg-glass-white backdrop-blur-md border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-dreeso-dark-400 outline-none transition-all duration-200 ${
                  confirmPasswordError
                    ? 'border-semantic-error/50 focus:border-semantic-error focus:shadow-[0_0_20px_rgba(225,25,0,0.15)]'
                    : 'border-glass-border focus:border-dreeso-accent-500 focus:shadow-accent-glow'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-invalid={!!confirmPasswordError}
                aria-describedby={confirmPasswordError ? 'signup-confirm-password-error' : undefined}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-dreeso-dark-400 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-glass-border"
                onClick={handleToggleConfirmPassword}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <p
                id="signup-confirm-password-error"
                className="flex items-center gap-1.5 text-xs text-semantic-error mt-1"
                role="alert"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* Persona selection */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-persona"
              className="block text-sm font-medium text-dreeso-dark-200"
            >
              Role / Persona
            </label>
            <select
              id="signup-persona"
              name="signup-persona"
              value={selectedPersonaId}
              onChange={handlePersonaChange}
              disabled={isSubmitting}
              className={`w-full bg-glass-white backdrop-blur-md border border-glass-border rounded-xl px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:border-dreeso-accent-500 focus:shadow-accent-glow appearance-none cursor-pointer ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Select a persona role"
            >
              {PERSONA_LIST.map((pid) => (
                <option key={pid} value={pid} className="bg-dreeso-dark-900 text-white">
                  {personaLabels[pid] || pid}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-dreeso-accent-500 ${
              isSubmitting || !isFormValid
                ? 'bg-dreeso-accent-500/50 text-white/50 cursor-not-allowed'
                : 'bg-dreeso-accent-500 text-white hover:bg-dreeso-accent-600 hover:shadow-accent-glow'
            }`}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        {showLoginLink && (
          <div className="text-center pt-2 border-t border-glass-border/50">
            <p className="text-sm text-dreeso-dark-400">
              Already have an account?{' '}
              <a
                href="#"
                className="text-dreeso-accent-400 hover:text-dreeso-accent-300 font-medium transition-colors duration-150 focus:outline-none focus:underline"
                onClick={handleLoginClick}
              >
                Sign in
              </a>
            </p>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-dreeso-dark-400 bg-dreeso-dark-800 border border-glass-border rounded">
            ↵
          </kbd>
          <span className="text-[10px] text-dreeso-dark-500">to create account</span>
        </div>
      </GlassCard>
    </div>
  );
}

SignupForm.propTypes = {
  className: PropTypes.string,
  animated: PropTypes.bool,
  onSignupSuccess: PropTypes.func,
  onLoginClick: PropTypes.func,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  showTitle: PropTypes.bool,
  showSubtitle: PropTypes.bool,
  showLoginLink: PropTypes.bool,
  defaultPersonaId: PropTypes.string,
};

export default SignupForm;