import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, PasswordInput, SegmentedControl, Text, TextInput } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AlertCircle, ArrowRight, Bot, Code2, Layers, Sparkles } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { ChooseNotification } from '@/lib/choose-notification';
import styles from '@/pages/auth/auth-page.module.css';

const LOGIN_SCHEMA = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const REGISTER_SCHEMA = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password2: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password2, {
    message: "Passwords don't match",
    path: ['password2'],
  });

type ILoginFormData = z.infer<typeof LOGIN_SCHEMA>;
type IRegisterFormData = z.infer<typeof REGISTER_SCHEMA>;
type IAuthMode = 'login' | 'register';

const AuthFeatureVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (index: number) => ({ opacity: 1, x: 0, transition: { delay: 0.2 + index * 0.11 } }),
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
};

const AuthPage = () => {
  const [mode, setMode] = useState<IAuthMode>('register');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard' });
    }
  }, [isAuthenticated, navigate]);

  const loginForm = useForm<ILoginFormData>({
    resolver: zodResolver(LOGIN_SCHEMA),
    defaultValues: { username: '', password: '' },
  });

  const registerForm = useForm<IRegisterFormData>({
    resolver: zodResolver(REGISTER_SCHEMA),
    defaultValues: { username: '', email: '', password: '', password2: '' },
  });

  const changeMode = (nextMode: string) => {
    setMode(nextMode as IAuthMode);
    setError(null);
  };

  const handleLogin = async (data: ILoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await login(data.username, data.password);
      ChooseNotification.success({ message: 'Welcome back!' });
      navigate({ to: '/dashboard' });
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Invalid credentials. Please try again.');
      setError(message);
      ChooseNotification.failure({ message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: IRegisterFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await register(data.username, data.email, data.password, data.password2);
      ChooseNotification.success({ message: 'Account created successfully!' });
      navigate({ to: '/dashboard' });
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Registration failed. Please try again.');
      setError(message);
      ChooseNotification.failure({ message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <Link to="/" className={styles.brandLink}>
            <BrandLogo variant="white" className={styles.brandLogo} />
          </Link>

          <div className={styles.brandMessage}>
            <Text className={styles.brandEyebrow}>
              <Sparkles size={15} /> Your next MVP starts here
            </Text>
            <Text component="h1" className={styles.brandTitle}>
              Finish your first Flutter MVP in one focused session.
            </Text>
            <Text component="p" className={styles.brandDescription}>
              Design the product experience visually, use AI to sharpen the interface, and hand your
              developers a project they can build on.
            </Text>
          </div>

          <motion.ul initial="hidden" animate="visible" className={styles.featureList}>
            <motion.li
              custom={0}
              variants={AuthFeatureVariants}
              animate={prefersReducedMotion ? { opacity: 1, x: 0 } : undefined}
              whileHover={prefersReducedMotion ? undefined : { x: 4 }}
            >
              <Layers size={18} />
              <span>
                <strong>Arrange the screens</strong>Use drag and drop to make the MVP real.
              </span>
            </motion.li>
            <motion.li
              custom={1}
              variants={AuthFeatureVariants}
              animate={prefersReducedMotion ? { opacity: 1, x: 0 } : undefined}
              whileHover={prefersReducedMotion ? undefined : { x: 4 }}
            >
              <Bot size={18} />
              <span>
                <strong>Ask AI about the UI</strong>Keep design choices clear and editable.
              </span>
            </motion.li>
            <motion.li
              custom={2}
              variants={AuthFeatureVariants}
              animate={prefersReducedMotion ? { opacity: 1, x: 0 } : undefined}
              whileHover={prefersReducedMotion ? undefined : { x: 4 }}
            >
              <Code2 size={18} />
              <span>
                <strong>Export for developers</strong>Start the handoff with a neat codebase.
              </span>
            </motion.li>
          </motion.ul>

          <motion.div
            className={styles.sessionCard}
            animate={prefersReducedMotion ? { y: 0 } : { y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div>
              <span>SESSION GOAL</span>
              <strong>Onboarding flow</strong>
            </div>
            <div className={styles.sessionProgress}>
              <i />
              <i />
              <i />
            </div>
            <small>Screen flow ready to export</small>
          </motion.div>
        </div>
      </aside>

      <main className={styles.formArea}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={styles.formPanel}
        >
          <Link to="/" className={styles.mobileBrandLink}>
            <BrandLogo className={styles.mobileBrandLogo} />
          </Link>

          <div className={styles.formHeading}>
            <Text component="h2" className={styles.formTitle}>
              {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
            </Text>
            <Text component="p" className={styles.formSubtitle}>
              {mode === 'login'
                ? 'Sign in to continue building your Flutter project.'
                : 'Start designing your Flutter app in a visual workspace.'}
            </Text>
          </div>

          <SegmentedControl
            value={mode}
            onChange={changeMode}
            data={[
              { label: 'Sign In', value: 'login' },
              { label: 'Create Account', value: 'register' },
            ]}
            fullWidth
            classNames={{ root: styles.modeSwitcher }}
          />

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert
                  icon={<AlertCircle size={18} />}
                  color="red"
                  variant="light"
                  className={styles.error}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className={styles.form}
              >
                <TextInput
                  label="Username"
                  placeholder="Enter your username"
                  {...loginForm.register('username')}
                  error={loginForm.formState.errors.username?.message}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  {...loginForm.register('password')}
                  error={loginForm.formState.errors.password?.message}
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  rightSection={<ArrowRight size={18} />}
                >
                  Sign In
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className={styles.form}
              >
                <TextInput
                  label="Username"
                  placeholder="Choose a username"
                  {...registerForm.register('username')}
                  error={registerForm.formState.errors.username?.message}
                />
                <TextInput
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  {...registerForm.register('email')}
                  error={registerForm.formState.errors.email?.message}
                />
                <PasswordInput
                  label="Password"
                  placeholder="Create a password"
                  {...registerForm.register('password')}
                  error={registerForm.formState.errors.password?.message}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  {...registerForm.register('password2')}
                  error={registerForm.formState.errors.password2?.message}
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  rightSection={<ArrowRight size={18} />}
                >
                  Create Account
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <Text component="p" className={styles.modePrompt}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
              className={styles.modeLink}
            >
              {mode === 'login' ? 'Sign up for free' : 'Sign in'}
            </button>
          </Text>
        </motion.div>
      </main>
    </div>
  );
};

export { AuthPage };
