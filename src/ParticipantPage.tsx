import { useSessionId } from "./useSessionId";


function ParticipantPage() {
    const sessionId = useSessionId()

    // if sessionId is null, show "Session closed"
    if (!sessionId) {
        return (
            <div>
                <h1>Session closed</h1>
            </div>
        );
    }

    return (
        <div>
            <h1>Participant Page</h1>
        </div>
    );
}

export default ParticipantPage;