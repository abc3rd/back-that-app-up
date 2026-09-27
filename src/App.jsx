import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { SettingsProvider } from '@/hooks/useSettings';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import MotionPage from '@/components/MotionPage';
import Home from './pages/Home';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={<Spinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<MotionPage><Home /></MotionPage>} />
          <Route path="/login" element={<MotionPage><Login /></MotionPage>} />
          <Route path="/register" element={<MotionPage><Register /></MotionPage>} />
          <Route path="/forgot-password" element={<MotionPage><ForgotPassword /></MotionPage>} />
          <Route path="/reset-password" element={<MotionPage><ResetPassword /></MotionPage>} />
          <Route path="/oauth-consent" element={<MotionPage><OAuthConsent /></MotionPage>} />
          <Route path="/settings" element={<MotionPage><Settings /></MotionPage>} />
          <Route path="/about" element={<MotionPage><About /></MotionPage>} />
          <Route path="/contact" element={<MotionPage><Contact /></MotionPage>} />
          <Route path="*" element={<MotionPage><PageNotFound /></MotionPage>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <Spinner />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return <AnimatedRoutes />;
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <SettingsProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App