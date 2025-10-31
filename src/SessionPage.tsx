import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
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
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { END_SCREEN_INDEX, getQuestion, WAITING_SCREEN_INDEX, WELCOME_SCREEN_INDEX } from './questions';
import QRCode from './QRCode';

type Answer = { id: string; text: string };
export type Question = { id: string; text: string; answers: Answer[] };
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
type Respondant = {
    id: string;
    questionIndex: number;
    answerId: string;
    createdAt: Date;
}

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

    const [answersData, setAnswersData] = useState<Respondant[]>([]);

    useEffect(() => {
        if (sessionId == null || session?.currentQuestionIndex == null) return

        const answersRef = collection(db,
            'sessions', sessionId,
            'questions', session.currentQuestionIndex.toString(),
            'respondants'
        );

        const unsubscribeAnswers = onSnapshot(
            answersRef,
            (snapshot) => {
                const answersData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data() as Omit<Respondant, 'id'>,
                }));
                setAnswersData(answersData);
            },
            (error) => {
                console.log(error);
            }
        );

        return () => {
            unsubscribeAnswers();
        };
    }, [sessionId, session?.currentQuestionIndex]);


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


    const ProjectorPreview = ({ isLive = false, question, index }: { isLive?: boolean, question: Question | null, index: number | null }) => (
        <Paper sx={{ width: '60%', p: 2, position: 'relative', height: '400px', bgcolor: '#222', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>


            <Box sx={{ position: 'absolute', top: 4, left: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" align="center">Projector {isLive ? 'Live' : 'Preview'}</Typography>
                {isLive && (<Box component="span" sx={{ display: 'block', width: 10, height: 10, bgcolor: 'error.main', borderRadius: '50%', boxShadow: '0 0 6px rgba(255,0,0,0.6)' }} aria-hidden="true" />)}
            </Box>

            <Typography variant="h5" align="center">
                {question?.text}
            </Typography>

            {
                index === WELCOME_SCREEN_INDEX ?
                    (
                        <div>
                            <QRCode url={`${window.location.origin}/#/participant/${sessionId}`} size={100} />
                        </div>
                    ) : null
            }
        </Paper>
    );

    const PhonePreview = ({ isLive = false, question }: { isLive?: boolean, question: Question | null }) => (
        <Paper sx={{ width: '40%', fontSize: '0.1rem', position: 'relative', p: 2, height: '400px', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            <Box sx={{ position: 'absolute', top: 4, left: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
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

    const answersCount: { [answerId: string]: number } = {};
    answersData.forEach(answer => {
        if (answersCount[answer.answerId]) {
            answersCount[answer.answerId] += 1;
        } else {
            answersCount[answer.answerId] = 1;
        }
    });

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 8 }}>
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 2fr' } }}>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h5">{session?.name}</Typography>
                            <Typography variant="subtitle1">{preset?.name}</Typography>
                        </Paper>

                        <Paper sx={{ p: 3, height: 500, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                            <Typography variant="h5" gutterBottom>Questions</Typography>
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



                        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h5" gutterBottom>Results</Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {currentLiveQuestion?.answers.map(answer => (
                                    <Box key={answer.id} sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Button key={answer.id} variant="outlined" fullWidth disabled>
                                            {answer.text}
                                        </Button>

                                        <Typography sx={{ ml: 2 }}>{answersCount[answer.id] || 0}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>


                        <Paper sx={{ p: 3, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="h5" gutterBottom>Control</Typography>

                            <Button
                                variant="outlined"
                                color="success"
                                size="large"
                                sx={{ width: '100%' }}
                                onClick={() => { setSelectedIndex(WELCOME_SCREEN_INDEX) }}
                            >
                                Show Welcome Screen
                            </Button>
                            <Button
                                variant="outlined"
                                color="warning"
                                size="large"
                                sx={{ width: '100%' }}
                                onClick={() => { setSelectedIndex(WAITING_SCREEN_INDEX) }}
                            >
                                Show Waiting Screen
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                size="large"
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
                            >
                                <Link to={`/projector/${session.id}`} target="_blank" rel="noopener noreferrer">Open Projector Screen</Link>
                            </Button>
                        </Paper>
                    </Box>


                    {/* Preview Section */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0, width: '100%' }}>
                            <ProjectorPreview question={currentPreviewQuestion} index={selectedIndex} />
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
                            <ProjectorPreview isLive question={currentLiveQuestion} index={session?.currentQuestionIndex} />
                            <PhonePreview isLive question={currentLiveQuestion} />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default SessionPage;