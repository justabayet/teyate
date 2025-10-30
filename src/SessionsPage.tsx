import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
import {
    Container,
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Stop as StopIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
} from '@mui/icons-material';

type Preset = {
    id: string;
    name: string;
    directorId: string;
    questions: Array<{
        id: string;
        text: string;
        answers: Array<{ id: string; text: string }>;
    }>;
};

type Session = {
    id: string;
    name: string;
    presetId: string;
    directorId: string;
    isActive: boolean;
    currentQuestionIndex: number;
    createdAt: Date;
};

function SessionsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newSession, setNewSession] = useState({
        name: '',
        presetId: '',
    });

    useEffect(() => {
        if (!user) return;

        // Subscribe to sessions
        const unsubscribeSessions = onSnapshot(
            collection(db, 'sessions'),
            (snapshot) => {
                const sessionsData: Session[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    sessionsData.push({
                        id: doc.id,
                        name: data.name,
                        presetId: data.presetId,
                        directorId: data.directorId,
                        isActive: data.isActive,
                        currentQuestionIndex: data.currentQuestionIndex,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    });
                });
                setSessions(sessionsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
                setLoading(false);
            },
            (error) => {
                setError('Error loading sessions: ' + error.message);
                setLoading(false);
            }
        );

        // Subscribe to presets
        const unsubscribePresets = onSnapshot(
            collection(db, 'presets'),
            (snapshot) => {
                const presetsData: Preset[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data() as Omit<Preset, 'id'>;
                    presetsData.push({ id: doc.id, ...data });
                });
                setPresets(presetsData);
            },
            (error) => {
                setError('Error loading presets: ' + error.message);
            }
        );

        return () => {
            unsubscribeSessions();
            unsubscribePresets();
        };
    }, [user]);

    const handleCreateSession = async () => {
        if (!user || !newSession.name || !newSession.presetId) return;

        try {
            const sessionDoc = await addDoc(collection(db, 'sessions'), {
                name: newSession.name,
                presetId: newSession.presetId,
                directorId: user.uid,
                isActive: false,
                currentQuestionIndex: 0,
                createdAt: new Date(),
            });
            setDialogOpen(false);
            navigate(`/sessions/${sessionDoc.id}`);
        } catch (err) {
            setError('Failed to create session: ' + (err as Error).message);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!window.confirm('Are you sure you want to delete this session?')) return;

        try {
            await deleteDoc(doc(db, 'sessions', sessionId));
        } catch (err) {
            setError('Failed to delete session: ' + (err as Error).message);
        }
    };

    const handleToggleSession = async (session: Session) => {
        try {
            await updateDoc(doc(db, 'sessions', session.id), {
                isActive: !session.isActive,
            });
        } catch (err) {
            setError('Failed to update session: ' + (err as Error).message);
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

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Sessions</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setDialogOpen(true)}
                        disabled={presets.length === 0}
                    >
                        New Session
                    </Button>
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

                {presets.length === 0 && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Create a preset first to start a new session
                    </Alert>
                )}

                <Paper>
                    <List>
                        {sessions.length === 0 ? (
                            <ListItem>
                                <ListItemText
                                    primary="No sessions yet"
                                    secondary="Create a new session to get started"
                                />
                            </ListItem>
                        ) : (
                            sessions.map((session) => {
                                const preset = presets.find(p => p.id === session.presetId);
                                return (
                                    <ListItem
                                        key={session.id}
                                        onClick={() => navigate(`/sessions/${session.id}`)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <ListItemText
                                            primary={session.name}
                                            secondary={
                                                <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <span>
                                                        {preset?.name || 'Unknown preset'}
                                                    </span>
                                                    <Chip
                                                        label={session.isActive ? 'Active' : 'Inactive'}
                                                        color={session.isActive ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleSession(session);
                                                }}
                                                color={session.isActive ? 'error' : 'success'}
                                            >
                                                {session.isActive ? <StopIcon /> : <PlayIcon />}
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session.id);
                                                }}
                                                sx={{ ml: 1 }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                </Paper>
            </Box>

            {/* Create Session Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Session</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="normal"
                        label="Session Name"
                        fullWidth
                        value={newSession.name}
                        onChange={(e) => setNewSession({ ...newSession, name: e.target.value })}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Preset</InputLabel>
                        <Select
                            value={newSession.presetId}
                            label="Preset"
                            onChange={(e) => setNewSession({ ...newSession, presetId: e.target.value })}
                        >
                            {presets.map((preset) => (
                                <MenuItem key={preset.id} value={preset.id}>
                                    {preset.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateSession}
                        variant="contained"
                        disabled={!newSession.name || !newSession.presetId}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default SessionsPage;