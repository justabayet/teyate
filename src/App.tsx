import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './App.css'
import LoginPage from './LoginPage';
import ParticipantPage from './ParticipantPage'
import DirectorPage from './DirectorPage'
import PresetPage from './PresetPage'
import SessionsPage from './SessionsPage'
import SessionPage from './SessionPage'
import { useSessionId } from './useSessionId'
import { AuthProvider, useAuth } from './auth'
import Navigation from './Navigation';
import theme from './theme';
import ProjectorPage from './ProjectorPage';

function AppContent() {
  const { user } = useAuth();
  const sessionId = useSessionId();

  if (sessionId) {
    return <ParticipantPage />;
  }

  return (
    <Routes>
      <Route path="/projector/:sessionId" element={<ProjectorPage />} />
      {user ? (
        <Route
          element={
            <Navigation>
              <Routes>
                <Route path="/presets" element={<DirectorPage />} />
                <Route path="/presets/:presetId" element={<PresetPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/sessions/:sessionId" element={<SessionPage />} />
                <Route path="/projector/:sessionId" element={<ProjectorPage />} />
                <Route path="*" element={<Navigate to="/presets" replace />} />
              </Routes>
            </Navigation>
          }
        >
          <Route path="/*" />
        </Route>
      ) : (
        <Route>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
