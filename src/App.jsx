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
import TabLayout from '@/components/btau/TabLayout';
import TabOutletLayout from '@/components/btau/TabOutletLayout';
import ThemeColorSync from '@/components/ThemeColorSync';
import { TabStackProvider, TAB_PATHS } from '@/hooks/useTabStack';

const Home = lazy(() => import('./pages/Home'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const OAuthConsent = lazy(() => import('./pages/OAuthConsent'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Moments = lazy(() => import('./pages/Moments'));
const MomentDetail = lazy(() => import('./pages/MomentDetail'));

const Spinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const isTabScoped = TAB_PATHS.some((p) =>
    location.pathname === p || (p !== '/' && location.pathname.startsWith(p + '/'))
  );
  const groupKey = isTabScoped ? 'tabs' : location.pathname;
  return (
    <TabStackProvider>
      <Suspense fallback={<Spinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={groupKey}>
            <Route element={<TabLayout />}>
              <Route path="/" element={<TabOutletLayout />}>
                <Route index element={<Home />} />
              </Route>
              <Route path="/moments" element={<TabOutletLayout />}>
                <Route index element={<Moments />} />
                <Route path=":id" element={<MomentDetail />} />
              </Route>
              <Route path="/settings" element={<TabOutletLayout />}>
                <Route index element={<Settings />} />
              </Route>
            </Route>
            <Route path="/login" element={<MotionPage><Login /></MotionPage>} />
            <Route path="/register" element={<MotionPage><Register /></MotionPage>} />
            <Route path="/forgot-password" element={<MotionPage><ForgotPassword /></MotionPage>} />
            <Route path="/reset-password" element={<MotionPage><ResetPassword /></MotionPage>} />
            <Route path="/oauth-consent" element={<MotionPage><OAuthConsent /></MotionPage>} />
            <Route path="/about" element={<MotionPage><About /></MotionPage>} />
            <Route path="/privacy" element={<MotionPage><Privacy /></MotionPage>} />
            <Route path="/terms" element={<MotionPage><Terms /></MotionPage>} />
            <Route path="/contact" element={<MotionPage><Contact /></MotionPage>} />
            <Route path="*" element={<MotionPage><PageNotFound /></MotionPage>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </TabStackProvider>
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
      <ThemeColorSync />
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