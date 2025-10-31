import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, Timestamp, collection, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Stack,
    Alert
} from '@mui/material';
import { getQuestion } from "./questions";
import { useParams } from "react-router-dom";
import { useAuth } from "./auth";

interface Answer {
    id: string;
    text: string;
}

interface Question {
    id: string;
    text: string;
    answers: Answer[];
}

interface Preset {
    id: string;
    name: string;
    questions: Question[];
}

interface Session {
    id: string;
    isOpen: boolean;
    currentQuestionIndex: number | null;
    questionEndAt: Timestamp | null;
    presetId: string;
}

const USER_ANONYMOUS_ID = `anonymous_${Math.random().toString(36).substr(2, 9)}`;
function ParticipantPage() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const userId = user?.uid || USER_ANONYMOUS_ID;
    const [session, setSession] = useState<Session | null>(null);
    const [preset, setPreset] = useState<Preset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;
        const ref = doc(db, 'sessions', sessionId);
        const unsub = onSnapshot(ref, async (snap) => {
            if (!snap.exists()) {
                setSession(null);
                setPreset(null);
                setError('Session not found');
                setLoading(false);
                return;
            }
            const data = snap.data() as Omit<Session, 'id'>;
            setSession({ id: snap.id, ...data });
            setLoading(false);

            try {
                if (data.presetId) {
                    const presetSnap = await getDoc(doc(db, 'presets', data.presetId));
                    setPreset(presetSnap.exists() ? { id: presetSnap.id, ...(presetSnap.data() as Omit<Preset, 'id'>) } : null);
                }
            } catch {
                setError('Failed to load session content');
            }
        });
        return () => unsub();
    }, [sessionId]);

    const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);

    const submitAnswer = async (answerId: string) => {
        if (!sessionId || !session || !userId) return;
        setSelectedAnswerId(answerId)
        try {
            const sessions = collection(db, 'sessions');
            const questionCollection = collection(sessions, sessionId, 'questions');
            const respondantCollection = collection(questionCollection, (session.currentQuestionIndex || 0).toString(), 'respondants');
            await setDoc(doc(respondantCollection, userId), {
                questionIndex: session?.currentQuestionIndex,
                answerId,
                createdAt: new Date()
            });
        } catch (e) {
            console.log(e)
            setError('Failed to submit answer. Please try again.');
        }
    };

    if (!sessionId) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                        Session Closed
                    </Typography>
                    <Typography color="text.secondary">
                        Please scan a valid QR code to join a session.
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !session) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8 }}>
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error || 'Session not found'}
                    </Alert>
                    <Typography color="text.secondary" align="center">
                        Please check the URL or scan the QR code again.
                    </Typography>
                </Box>
            </Container>
        );
    }

    const currentIndex = session.currentQuestionIndex;
    const question = getQuestion(currentIndex, preset?.questions);

    if (currentIndex === null || !question) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Waiting for the Next Question
                    </Typography>
                </Box>
            </Container>
        );
    }



    return (
        <div style={{ backgroundColor: "#fff", color: "#111", width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h5" align="center" sx={{ maxWidth: '90%' }}>
                {question.text || 'Waiting for question...'}
            </Typography>

            <Stack spacing={2} sx={{ mt: 3, maxWidth: '90%' }}>
                {question.answers?.map((answer) => (
                    <Button
                        key={answer.id}
                        variant={selectedAnswerId === answer.id ? 'contained' : 'outlined'}
                        size="large"
                        fullWidth
                        onClick={() => submitAnswer(answer.id)}
                    >
                        {answer.text}
                    </Button>
                ))}
            </Stack>
        </div>
    );
}

export default ParticipantPage;