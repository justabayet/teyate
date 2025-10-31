import { useEffect, useState } from 'react';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Card,
    CardContent,
    CardActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

type Answer = { id: string; text: string };
type Question = { id: string; text: string; answers: Answer[] };
type Preset = { id: string; name: string; directorId: string; questions?: Question[] };

function DirectorPage() {
    const { user, loading } = useAuth();
    const [presets, setPresets] = useState<Preset[]>([]);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        const presetsCol = collection(db, 'presets');
        const q = query(presetsCol, where('directorId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    name: data.name as string,
                    directorId: data.directorId as string,
                    questions: data.questions as Question[] | undefined
                };
            });
            setPresets(items);
        });
        return () => unsub();
    }, [user]);

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="sm">
                <Alert severity="warning" sx={{ mt: 4 }}>
                    Please log in to access director controls.
                </Alert>
            </Container>
        );
    }

    const createPreset = async () => {
        if (!newName) return;
        try {
            await addDoc(collection(db, 'presets'), {
                name: newName,
                directorId: user.uid,
                questions: []
            });
            setNewName('');
        } catch {
            setError('Failed to create preset');
        }
    };

    const deletePreset = async (presetId: string) => {
        try {
            await deleteDoc(doc(db, 'presets', presetId));
        } catch {
            setError('Failed to delete preset');
        }
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Presets
                </Typography>

                {error && (
                    <Alert
                        severity={error.includes('started') ? 'success' : 'error'}
                        onClose={() => setError(null)}
                        sx={{ mb: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                    <TextField
                        variant="outlined"
                        size="small"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="New preset name"
                        sx={{ flexGrow: 1, maxWidth: 300 }}
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={createPreset}
                        disabled={!newName}
                    >
                        Create Preset
                    </Button>
                </Box>

                <Box sx={{ mt: 2, display: 'grid', gap: 3, gridTemplateColumns: '1fr' }}>
                    {presets.map((preset) => (
                        <Card key={preset.id} sx={{ transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 6 } }}>
                            <CardContent
                                sx={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/presets/${preset.id}`)}
                            >
                                <Typography variant="h6" gutterBottom>
                                    {preset.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {preset.questions ? preset.questions.length : 0} questions
                                    </Typography>
                                </Box>
                            </CardContent>
                            <CardActions>
                                <IconButton
                                    size="small"
                                    onClick={() => navigate(`/presets/${preset.id}`)}
                                    title="Edit Preset"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={e => { e.stopPropagation(); deletePreset(preset.id); }}
                                    color="error"
                                    title="Delete Preset"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            </Box>
        </Container>
    );
}

export default DirectorPage;