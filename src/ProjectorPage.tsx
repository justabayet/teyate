import React, { useEffect, useState } from 'react';
import { Container, Typography, CircularProgress, Box } from '@mui/material';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
import { getQuestion, WELCOME_SCREEN_INDEX } from './questions';
import QRCode from './QRCode';

type Answer = { id: string; text: string };
type Question = { id: string; text: string; answers: Answer[] };
type Preset = { id: string; name: string; directorId: string; questions: Question[] };

const ProjectorPage: React.FC = () => {
    const { sessionId } = useParams();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [preset, setPreset] = useState<Preset | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);

    const isWelcomeScreen = currentQuestionIndex === WELCOME_SCREEN_INDEX;

    useEffect(() => {
        if (!sessionId || !user) return;

        const unsubSession = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
            if (!snap.exists()) {
                setError('Session not found');
                setLoading(false);
                return;
            }
            const data = snap.data();
            const presetId = data.presetId as string | undefined;
            const qIndex = typeof data.currentQuestionIndex === 'number' ? data.currentQuestionIndex : null;
            setCurrentQuestionIndex(qIndex);
            setLoading(false);
            if (presetId) {
                // subscribe to preset separately
                const unsubPreset = onSnapshot(doc(db, 'presets', presetId), (pSnap) => {
                    if (pSnap.exists()) {
                        const pData = pSnap.data() as Omit<Preset, 'id'>;
                        setPreset({ id: pSnap.id, ...pData });
                    } else {
                        setError('Preset not found');
                    }
                }, (err) => setError(err.message));

                // cleanup for preset when session unsubscribes
                return () => unsubPreset();
            }
        }, (err) => { setError(err.message); setLoading(false); });

        return () => unsubSession();
    }, [sessionId, user]);

    const currentQuestion = getQuestion(currentQuestionIndex, preset?.questions);

    if (loading) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>
            </Container>
        );
    }

    return (
        <div style={{ backgroundColor: "#111", color: "#fff", width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h2" align="center" sx={{ maxWidth: '90%' }}>
                {currentQuestion?.text || 'Waiting for question...'}
            </Typography>
            {
                isWelcomeScreen ?
                    (
                        <div>
                            <QRCode url={`https://teyate.justabayet.com/#/participant/${sessionId}`} />
                        </div>
                    ) : null
            }

        </div>
    );
};

export default ProjectorPage;
