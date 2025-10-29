import './App.css'
import HomePage from './HomePage'
import MyComponent from './MyComponent'
import ParticipantPage from './ParticipantPage'
import DirectorPage from './DirectorPage'
import { useSessionId } from './useSessionId'
import { AuthProvider, useAuth } from './auth'

function AppContent({ sessionId }: { sessionId: string | null }) {
  const { user } = useAuth();

  if (sessionId) {
    return (
      <>
        <MyComponent />
        <ParticipantPage />
      </>
    );
  }

  if (user) {
    return (
      <>
        <MyComponent />
        <DirectorPage />
      </>
    );
  }

  return (
    <>
      <MyComponent />
      <HomePage />
    </>
  );
}

function App() {
  const sessionId = useSessionId()

  return (
    <AuthProvider>
      <AppContent sessionId={sessionId} />
    </AuthProvider>
  );
}

export default App
