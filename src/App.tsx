import './App.css'
import HomePage from './HomePage'
import MyComponent from './MyComponent'
import ParticipantPage from './ParticipantPage'
import { useSessionId } from './useParticipantMode'

function App() {
  const sessionId = useSessionId()

  if (sessionId) {
    return (
      <>
        <MyComponent />
        <ParticipantPage />
      </>
    )
  }

  return (
    <>
      <MyComponent />
      <HomePage />
    </>
  )
}

export default App
