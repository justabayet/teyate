import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
import {
    Container,
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    NavigateNext as NextIcon,
    NavigateBefore as PrevIcon,
    Phone as PhoneIcon,
    Tv as TvIcon,
    QrCode as QrCodeIcon,
} from '@mui/icons-material';

type Answer = { id: string; text: string };
type Question = { id: string; text: string; answers: Answer[] };
type Preset = { id: string; name: string; directorId: string; questions: Question[] };
type Session = {
    id: string;
    name: string;
    presetId: string;
    directorId: string;
    isActive: boolean;
    currentQuestionIndex: number;
    createdAt: Date;
};

function SessionPage() {
    const { sessionId } = useParams();
    useAuth(); // Ensure user is authenticated
    const [session, setSession] = useState<Session | null>(null);
    const [preset, setPreset] = useState<Preset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        const unsubscribeSession = onSnapshot(
            doc(db, 'sessions', sessionId),
            async (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const sessionData: Session = {
                        id: docSnapshot.id,
                        name: data.name,
                        presetId: data.presetId,
                        directorId: data.directorId,
                        isActive: data.isActive,
                        currentQuestionIndex: data.currentQuestionIndex,
                        createdAt: data.createdAt.toDate() || new Date(),
                    };
                    setSession(sessionData);

                    // Get preset data
                    const unsubscribePreset = onSnapshot(
                        doc(db, 'presets', data.presetId),
                        (presetDoc) => {
                            if (presetDoc.exists()) {
                                const presetData = presetDoc.data() as Omit<Preset, 'id'>;
                                setPreset({ id: presetDoc.id, ...presetData });
                            } else {
                                setError('Preset not found');
                            }
                            setLoading(false);
                        },
                        (error) => {
                            setError('Error loading preset: ' + error.message);
                            setLoading(false);
                        }
                    );

                    return () => unsubscribePreset();
                } else {
                    setError('Session not found');
                    setLoading(false);
                }
            },
            (error) => {
                setError('Error loading session: ' + error.message);
                setLoading(false);
            }
        );

        return () => unsubscribeSession();
    }, [sessionId]);

    const handleToggleSession = async () => {
        if (!session) return;
        try {
            await updateDoc(doc(db, 'sessions', session.id), {
                isActive: !session.isActive,
            });
        } catch (err) {
            setError('Failed to update session: ' + (err as Error).message);
        }
    };

    const handleNavigateQuestion = async (direction: 'prev' | 'next') => {
        if (!session || !preset) return;

        const newIndex = direction === 'next'
            ? Math.min(session.currentQuestionIndex + 1, preset.questions.length - 1)
            : Math.max(session.currentQuestionIndex - 1, 0);

        try {
            await updateDoc(doc(db, 'sessions', session.id), {
                currentQuestionIndex: newIndex,
            });
        } catch (err) {
            setError('Failed to navigate: ' + (err as Error).message);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !session || !preset) {
        return (
            <Container maxWidth="sm">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error || 'Session or preset not found'}
                </Alert>
            </Container>
        );
    }

    const currentQuestion = session.currentQuestionIndex === -1
        ? preset.questions[session.currentQuestionIndex]
        : null;
    const progress = ((session.currentQuestionIndex + 1) / preset.questions.length) * 100;

    const PreviewScreen = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
        <Paper
            sx={{
                p: 2,
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                bgcolor: '#f5f5f5',
            }}
        >
            <Box sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                {icon}
            </Box>
            <Typography variant="subtitle1" align="center" sx={{ mb: 2 }}>
                {title}
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 2 }}>
                <Typography variant="h6" gutterBottom align="center">
                    {currentQuestion?.text}
                </Typography>
                <Box sx={{ mt: 2 }}>
                    {currentQuestion?.answers.map(answer => (
                        <Button
                            key={answer.id}
                            variant="outlined"
                            fullWidth
                            sx={{ mb: 1 }}
                        >
                            {answer.text}
                        </Button>
                    ))}
                </Box>
            </Box>
        </Paper>
    );

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4">{session.name}</Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            {preset.name}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<QrCodeIcon />}
                            onClick={() => window.open(`/join/${session.id}`, '_blank')}
                        >
                            Join QR
                        </Button>
                        <Button
                            variant="contained"
                            color={session.isActive ? 'error' : 'success'}
                            startIcon={session.isActive ? <StopIcon /> : <PlayIcon />}
                            onClick={handleToggleSession}
                        >
                            {session.isActive ? 'Stop Session' : 'Start Session'}
                        </Button>
                    </Box>
                </Box>

                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ mb: 3 }}
                    >
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
                    <PreviewScreen
                        icon={<TvIcon color="primary" />}
                        title="Projector View"
                    />
                    <PreviewScreen
                        icon={<PhoneIcon color="primary" />}
                        title="Phone Preview"
                    />
                </Box>

                <Paper sx={{ mt: 3, p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography>
                            Question {session.currentQuestionIndex + 1} of {preset.questions.length}
                        </Typography>
                        <Box sx={{ flex: 1, mx: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                                onClick={() => handleNavigateQuestion('prev')}
                                disabled={session.currentQuestionIndex === 0}
                            >
                                <PrevIcon />
                            </IconButton>
                            <IconButton
                                onClick={() => handleNavigateQuestion('next')}
                                disabled={session.currentQuestionIndex === preset.questions.length - 1}
                            >
                                <NextIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    <List>
                        {preset.questions.map((question, index) => (
                            <ListItem
                                key={question.id}
                                sx={{
                                    bgcolor: index === session.currentQuestionIndex ? 'action.selected' : 'transparent',
                                    borderRadius: 1,
                                }}
                            >
                                <ListItemText
                                    primary={question.text}
                                    secondary={`${question.answers.length} answers`}
                                />
                                {index === session.currentQuestionIndex && (
                                    <Chip label="Current" color="primary" size="small" />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
}

export default SessionPage;