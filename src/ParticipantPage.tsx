import { useSessionId } from "./useSessionId";
import { useEffect, useState } from "react";
import { doc, onSnapshot, getDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    CircularProgress,
    Stack,
    Alert
} from '@mui/material';

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

function ParticipantPage() {
    const sessionId = useSessionId();
    const [session, setSession] = useState<Session | null>(null);
    const [preset, setPreset] = useState<Preset | null>(null);
    const [loading, setLoading] = useState(true);
    const [answered, setAnswered] = useState(false);
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

    const submitAnswer = async (answerId: string) => {
        if (!sessionId) return;
        try {
            await addDoc(collection(db, 'sessions', sessionId, 'responses'), {
                questionIndex: session?.currentQuestionIndex,
                answerId,
                createdAt: new Date()
            });
            setAnswered(true);
        } catch {
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

    if (!session.isOpen) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                        Thank You for Participating
                    </Typography>
                    <Typography color="text.secondary">
                        This session has ended.
                    </Typography>
                </Box>
            </Container>
        );
    }

    const currentIndex = session.currentQuestionIndex;
    const question = currentIndex !== null ? preset?.questions?.[currentIndex] : null;
    const endAt = session.questionEndAt?.toDate();
    const now = new Date();
    const isTimeUp = endAt && now > endAt;

    if (currentIndex === null || !question) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Waiting for the Next Question
                    </Typography>
                    <Typography color="text.secondary">
                        The director will start the next question shortly.
                    </Typography>
                </Box>
            </Container>
        );
    }

    if (isTimeUp) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom>
                        Time's Up!
                    </Typography>
                    <Typography color="text.secondary">
                        Please wait for the next question.
                    </Typography>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    {question.text}
                </Typography>

                {answered ? (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Answer submitted successfully! Waiting for the next question.
                    </Alert>
                ) : (
                    <Stack spacing={2} sx={{ mt: 3 }}>
                        {question.answers?.map((answer) => (
                            <Button
                                key={answer.id}
                                variant="outlined"
                                size="large"
                                fullWidth
                                onClick={() => submitAnswer(answer.id)}
                            >
                                {answer.text}
                            </Button>
                        ))}
                    </Stack>
                )}

                {endAt && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            Ends at: {endAt.toLocaleTimeString()}
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default ParticipantPage;