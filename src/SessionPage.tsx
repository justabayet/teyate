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
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    ArrowDownward,
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

const WAITING_SCREEN_INDEX = -1;
const END_SCREEN_INDEX = -3;
const SHOW_RESULTS_INDEX = -2;

const getQuestion = (index: number | undefined, questions: Question[]) => {
    if (index === WAITING_SCREEN_INDEX) {
        return { id: 'waiting', text: 'Waiting Screen', answers: [] };
    } else if (index === END_SCREEN_INDEX) {
        return { id: 'end', text: 'End Screen', answers: [] };
    } else if (index === SHOW_RESULTS_INDEX) {
        return { id: 'results', text: 'Results Screen', answers: [] };
    } else if (index !== undefined && questions) {
        return questions[index] || null;
    }
    return null;
}

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
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

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


    const currentLiveQuestion = getQuestion(session?.currentQuestionIndex, preset?.questions)
    const currentPreviewQuestion = getQuestion(selectedIndex, preset?.questions)


    const ProjectorPreview = ({ isLive = false, question }: { isLive?: boolean, question: Question | null }) => (
        <Paper sx={{ width: '60%', p: 2, position: 'relative', height: '400px', bgcolor: '#222', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>


            <Box sx={{ position: 'absolute', top: 4, left: 4, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" align="center">Projector {isLive ? 'Live' : 'Preview'}</Typography>
                {isLive && (<Box component="span" sx={{ display: 'block', width: 10, height: 10, bgcolor: 'error.main', borderRadius: '50%', boxShadow: '0 0 6px rgba(255,0,0,0.6)' }} aria-hidden="true" />)}
            </Box>

            <Typography variant="h5" align="center" sx={{ mb: 2 }}>
                {question?.text}
            </Typography>
        </Paper>
    );

    const PhonePreview = ({ isLive = false, question }: { isLive?: boolean, question: Question | null }) => (
        <Paper sx={{ width: '40%', fontSize: '0.1rem', position: 'relative', p: 2, height: '400px', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            <Box sx={{ position: 'absolute', top: 4, left: 4, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" align="center">Phone {isLive ? 'Live' : 'Preview'}</Typography>
                {isLive && (<Box component="span" sx={{ display: 'block', width: 10, height: 10, bgcolor: 'error.main', borderRadius: '50%', boxShadow: '0 0 6px rgba(255,0,0,0.6)' }} aria-hidden="true" />)}
            </Box>
            <Typography align="center" sx={{ mb: 2 }}>
                {question?.text}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {question?.answers.map(answer => (
                    <Button key={answer.id} variant="outlined" fullWidth disabled>
                        {answer.text}
                    </Button>
                ))}
            </Box>
        </Paper>
    );

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 2fr' } }}>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h5" gutterBottom>{session?.name}</Typography>
                            <Typography variant="subtitle1">{preset?.name}</Typography>
                        </Paper>

                        <Paper sx={{ p: 3, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h5" gutterBottom>Control</Typography>

                            <Button
                                variant="outlined"
                                color="success"
                                size="large"
                                startIcon={<PlayIcon />}
                                sx={{ width: '100%' }}
                                onClick={() => { setSelectedIndex(SHOW_RESULTS_INDEX) }}
                            >
                                Show Results
                            </Button>
                            <Button
                                variant="outlined"
                                color="warning"
                                size="large"
                                startIcon={<PlayIcon />}
                                sx={{ width: '100%' }}
                                onClick={() => { setSelectedIndex(WAITING_SCREEN_INDEX) }}
                            >
                                Show Waiting Screen
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="large"
                                startIcon={<StopIcon />}
                                sx={{ width: '100%' }}
                                onClick={() => { setSelectedIndex(END_SCREEN_INDEX) }}
                            >
                                Show End Screen
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="large"
                                startIcon={<OpenInNewIcon />}
                                sx={{ width: '100%' }}
                                onClick={() => {
                                    window.open(`/projector/${session.id}`, "_blank")
                                }}
                            >
                                Open Projector Screen
                            </Button>
                        </Paper>

                        <Paper sx={{ p: 3, height: 500, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                            <List>
                                {preset.questions.map((question, idx) => (
                                    <ListItem key={question.id} disablePadding sx={{ mb: 1 }}>
                                        <ListItemButton
                                            selected={selectedIndex === idx}
                                            onClick={() => setSelectedIndex(idx)}
                                            sx={{ borderRadius: 1, width: '100%' }}
                                        >
                                            <ListItemText primary={question.text} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </Box>


                    {/* Preview Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, width: '100%' }}>
                            <ProjectorPreview question={currentPreviewQuestion} />
                            <PhonePreview question={currentPreviewQuestion} />
                        </Box>

                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            startIcon={<ArrowDownward />}
                            sx={{ width: '100%' }}
                            onClick={async () => {
                                if (!session) return;
                                await updateDoc(doc(db, 'sessions', session.id), {
                                    currentQuestionIndex: selectedIndex
                                });
                            }}
                        >
                            Commit
                        </Button>

                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, width: '100%' }}>
                            <ProjectorPreview isLive question={currentLiveQuestion} />
                            <PhonePreview isLive question={currentLiveQuestion} />
                        </Box>
                    </Box>


                    {/* Data Section */}
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h5" gutterBottom>Data</Typography>
                        <Typography>Expected users: <b>?</b></Typography>
                        <Typography>Answers received: <b>?</b></Typography>
                        {/* TODO: Wire up real data */}
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
}

export default SessionPage;