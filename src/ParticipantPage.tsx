import { useSessionId } from "./useSessionId";
import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

function ParticipantPage() {
    const sessionId = useSessionId();
    const [session, setSession] = useState<any>(null);
    const [preset, setPreset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answered, setAnswered] = useState(false);

    useEffect(() => {
        if (!sessionId) return;
        const ref = doc(db, 'sessions', sessionId);
        const unsub = onSnapshot(ref, async (snap) => {
            if (!snap.exists()) {
                setSession(null);
                setPreset(null);
                setLoading(false);
                return;
            }
            const data = snap.data();
            setSession({ id: snap.id, ...data });
            setLoading(false);
            if (data.presetId) {
                const presetSnap = await getDoc(doc(db, 'presets', data.presetId));
                setPreset(presetSnap.exists() ? { id: presetSnap.id, ...(presetSnap.data() as any) } : null);
            }
        });
        return () => unsub();
    }, [sessionId]);

    if (!sessionId) {
        return (
            <div>
                <h1>Session closed</h1>
            </div>
        );
    }

    if (loading) return <div>Loading session...</div>;

    if (!session) {
        return <div>Session not found</div>;
    }

    if (!session.isOpen) {
        return (
            <div>
                <h1>Thank you for coming</h1>
            </div>
        );
    }

    const currentIndex = session.currentQuestionIndex;

    // no question running
    if (currentIndex === null || currentIndex === undefined) {
        return (
            <div>
                <h1>Please wait — the director will start the next question shortly</h1>
            </div>
        );
    }

    const question = preset?.questions?.[currentIndex];
    if (!question) {
        return <div>Waiting for question...</div>;
    }

    // check timer
    const endAt = session.questionEndAt ? (session.questionEndAt as Timestamp).toDate() : null;
    const now = new Date();

    if (endAt && now > endAt) {
        return (
            <div>
                <h1>Time's up — please wait for the next question</h1>
            </div>
        );
    }

    const submitAnswer = async (answerId: string) => {
        if (!sessionId) return;
        try {
            await addDoc(collection(db, 'sessions', sessionId, 'responses'), {
                questionIndex: currentIndex,
                answerId,
                createdAt: new Date()
            });
            setAnswered(true);
        } catch (e) {
            console.error('Failed to submit answer', e);
        }
    };

    return (
        <div>
            <h1>{question.text}</h1>
            {answered ? (
                <div>Answer submitted — waiting for next question.</div>
            ) : (
                <div>
                    {question.answers?.map((a: any) => (
                        <button key={a.id} onClick={() => submitAnswer(a.id)} style={{ display: 'block', margin: 8 }}>
                            {a.text}
                        </button>
                    ))}
                </div>
            )}
            {endAt && <div>Ends at: {endAt.toLocaleTimeString()}</div>}
        </div>
    );
}

export default ParticipantPage;