import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import './App.css'
import HomePage from './HomePage'
import ParticipantPage from './ParticipantPage'
import DirectorPage from './DirectorPage'
import PresetPage from './PresetPage'
import SessionsPage from './SessionsPage'
import SessionPage from './SessionPage'
import { useSessionId } from './useSessionId'
import { AuthProvider, useAuth } from './auth'
import Navigation from './Navigation';
import theme from './theme';

function AppContent() {
  const { user } = useAuth();
  const sessionId = useSessionId();

  if (sessionId) {
    return <ParticipantPage />;
  }

  return (
    <Routes>
      {user ? (
        <Route
          element={
            <Navigation>
              <Routes>
                <Route path="/" element={<Navigate to="/presets" replace />} />
                <Route path="/presets" element={<DirectorPage />} />
                <Route path="/presets/:presetId" element={<PresetPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/sessions/:sessionId" element={<SessionPage />} />
                <Route path="*" element={<Navigate to="/presets" replace />} />
              </Routes>
            </Navigation>
          }
        >
          <Route path="/*" />
        </Route>
      ) : (
        <>
          <Route path="/" element={<HomePage />} />
          <Route path="/join/:sessionId" element={<ParticipantPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
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
