import { useEffect, useState } from 'react';
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
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Phone as PhoneIcon
} from '@mui/icons-material';
type Answer = { id: string; text: string };
type Question = { id: string; text: string; answers: Answer[] };
type Preset = { id: string; name: string; directorId: string; questions: Question[] };

function PresetPage() {
    const { presetId } = useParams();
    useAuth(); // Ensure user is authenticated
    const [preset, setPreset] = useState<Preset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [editData, setEditData] = useState<{ text: string; answers: string[] }>({ text: '', answers: ['Yes', 'No'] });

    useEffect(() => {
        if (!presetId) return;

        const unsubscribe = onSnapshot(
            doc(db, 'presets', presetId),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as Omit<Preset, 'id'>;
                    setPreset({ id: doc.id, ...data });
                    if (!selectedQuestion && data.questions?.length > 0) {
                        setSelectedQuestion(data.questions[0]);
                    }
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

        return () => unsubscribe();
    }, [presetId, selectedQuestion]);

    const handleAddQuestion = async () => {
        if (!preset) return;
        const newQuestion = {
            id: Date.now().toString(),
            text: 'New question',
            answers: [
                { id: 'a1', text: 'Yes' },
                { id: 'a2', text: 'No' }
            ]
        };
        const updatedQuestions = [...preset.questions, newQuestion];
        try {
            await updateDoc(doc(db, 'presets', preset.id), { questions: updatedQuestions });
            setSelectedQuestion(newQuestion);
            setEditData({ text: newQuestion.text, answers: newQuestion.answers.map(a => a.text) });
        } catch {
            setError('Failed to add question');
        }
    };

    // When a question is selected, update editData to match
    useEffect(() => {
        if (selectedQuestion) {
            setEditData({
                text: selectedQuestion.text,
                answers: selectedQuestion.answers.map(a => a.text)
            });
        }
    }, [selectedQuestion]);

    const handleDeleteQuestion = async (questionId: string) => {
        if (!preset) return;
        try {
            const updatedQuestions = preset.questions.filter(q => q.id !== questionId);
            await updateDoc(doc(db, 'presets', preset.id), {
                questions: updatedQuestions
            });
            if (selectedQuestion?.id === questionId) {
                setSelectedQuestion(updatedQuestions[0] || null);
            }
        } catch {
            setError('Failed to delete question');
        }
    };

    // Auto-save on every edit for selected question
    useEffect(() => {
        if (!preset || !selectedQuestion) return;
        if (!editData.text || editData.answers.some(a => !a)) return;
        const updatedQuestions = preset.questions.map(q =>
            q.id === selectedQuestion.id
                ? { ...q, text: editData.text, answers: editData.answers.map((text, index) => ({ id: 'a' + (index + 1), text })) }
                : q
        );
        updateDoc(doc(db, 'presets', preset.id), { questions: updatedQuestions }).catch(() => setError('Failed to save question'));
    }, [editData, preset, selectedQuestion]);

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error || !preset) {
        return (
            <Container maxWidth="sm">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error || 'Preset not found'}
                </Alert>
            </Container>
        );
    }

    const PhonePreview = () => {
        let previewText = selectedQuestion ? selectedQuestion.text : '';
        let previewAnswers = selectedQuestion ? selectedQuestion.answers : [];
        // If editing, show live editData
        if (selectedQuestion && editData && editData.text && editData.answers.length > 0) {
            previewText = editData.text;
            previewAnswers = editData.answers.map((text, index) => ({ id: 'a' + (index + 1), text }));
        }
        return (
            <Paper
                sx={{
                    p: 2,
                    height: '600px',
                    width: '300px',
                    mx: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: '#f5f5f5'
                }}
            >
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {selectedQuestion ? (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {previewText}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                {previewAnswers.map(answer => (
                                    <Button
                                        key={answer.id}
                                        variant="outlined"
                                        disabled
                                        fullWidth
                                        sx={{ mb: 1 }}
                                    >
                                        {answer.text}
                                    </Button>
                                ))}
                            </Box>
                        </>
                    ) : (
                        <Typography color="textSecondary" align="center">
                            Select a question to preview
                        </Typography>
                    )}
                </Box>
            </Paper>
        );
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {preset.name}
                </Typography>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>
                )}

                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' } }}>
                    {/* Questions List */}
                    <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Questions</Typography>
                            <IconButton onClick={handleAddQuestion} color="primary" size="small">
                                <AddIcon />
                            </IconButton>
                        </Box>
                        <List sx={{ flex: 1, overflow: 'auto' }}>
                            {preset.questions.map((question, index) => (
                                <ListItem
                                    key={question.id}
                                    onClick={() => setSelectedQuestion(question)}
                                    sx={{ cursor: 'pointer', bgcolor: selectedQuestion?.id === question.id ? 'action.selected' : undefined }}
                                >
                                    <ListItemText
                                        primary={`${index + 1}. ${question.text}`}
                                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteQuestion(question.id);
                                            }}
                                            sx={{ ml: 1 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    {/* Selected Question / Edit Panel */}
                    <Paper sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column' }}>
                        {selectedQuestion ? (
                            <>
                                <TextField
                                    label="Question Text"
                                    fullWidth
                                    value={editData.text}
                                    onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                                <Typography variant="h6" gutterBottom>
                                    Answers
                                </Typography>
                                {editData.answers.map((answer, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            value={answer}
                                            onChange={(e) => {
                                                const newAnswers = [...editData.answers];
                                                newAnswers[index] = e.target.value;
                                                setEditData({ ...editData, answers: newAnswers });
                                            }}
                                        />
                                        {editData.answers.length > 2 && (
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    const newAnswers = editData.answers.filter((_, i) => i !== index);
                                                    setEditData({ ...editData, answers: newAnswers });
                                                }}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={() => setEditData({ ...editData, answers: [...editData.answers, ''] })}
                                    sx={{ mt: 1 }}
                                >
                                    Add Answer
                                </Button>
                                <Box sx={{ mt: 'auto', display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                                        startIcon={<DeleteIcon />}
                                    >
                                        Delete Question
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <Typography color="textSecondary" align="center">
                                Select a question or create a new one
                            </Typography>
                        )}
                    </Paper>

                    {/* Phone Preview */}
                    <Box sx={{ position: 'relative' }}>
                        <PhoneIcon sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', color: 'primary.main' }} />
                        <PhonePreview />
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default PresetPage;