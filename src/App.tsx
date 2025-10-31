import { Routes, Route, Navigate, HashRouter, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './App.css'
import LoginPage from './LoginPage';
import ParticipantPage from './ParticipantPage'
import DirectorPage from './DirectorPage'
import PresetPage from './PresetPage'
import SessionsPage from './SessionsPage'
import SessionPage from './SessionPage'
import { AuthProvider, useAuth } from './auth'
import Navigation from './Navigation';
import theme from './theme';
import ProjectorPage from './ProjectorPage';

function AuthLayout() {
  return (
    <Navigation>
      <Outlet />
    </Navigation>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* --- 1. PUBLIC ROUTES ---
        These are accessible to everyone, logged in or not.
      */}
      <Route path="/projector/:sessionId" element={<ProjectorPage />} />
      <Route path="/participant/:sessionId" element={<ParticipantPage />} />

      {/* --- 2. AUTHENTICATED ROUTES ---
        These are only accessible if 'user' exists. They are all
        rendered inside the <AuthLayout /> (which has the Navigation).
      */}
      {user && (
        <Route element={<AuthLayout />}>
          {/* Note: paths are relative to the parent */}
          <Route path="/presets" element={<DirectorPage />} />
          <Route path="/presets/:presetId" element={<PresetPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionPage />} />

          {/* Redirects for logged-in users:
            - If they go to "/", send them to "/presets".
            - If they go to any other un-matched path, send them to "/presets".
          */}
          <Route path="/" element={<Navigate to="/presets" replace />} />
          <Route path="*" element={<Navigate to="/presets" replace />} />
        </Route>
      )}

      {/* --- 3. UNAUTHENTICATED ROUTES ---
        These are only accessible if 'user' does NOT exist.
      */}
      {!user && (
        <Route> {/* A "grouping" route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Redirects for logged-out users:
            - If they go to "/", send them to "/login".
            - If they go to any other path (e.g., /presets), send to "/login".
          */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Route>
      )}
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
