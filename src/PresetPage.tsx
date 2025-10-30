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

    Divider,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
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
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [dialogData, setDialogData] = useState({ text: '', answers: ['Yes', 'No'] });

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

    const handleAddQuestion = () => {
        setDialogMode('add');
        setDialogData({ text: '', answers: ['Yes', 'No'] });
        setDialogOpen(true);
    };

    const handleEditQuestion = (question: Question) => {
        setDialogMode('edit');
        setDialogData({
            text: question.text,
            answers: question.answers.map(a => a.text)
        });
        setSelectedQuestion(question);
        setDialogOpen(true);
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!preset || !window.confirm('Delete this question?')) return;

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

    const handleSaveQuestion = async () => {
        if (!preset || !dialogData.text || dialogData.answers.some(a => !a)) return;

        try {
            const updatedQuestions = [...preset.questions];
            const questionData = {
                id: dialogMode === 'add' ? Date.now().toString() : selectedQuestion!.id,
                text: dialogData.text,
                answers: dialogData.answers.map((text, index) => ({
                    id: 'a' + (index + 1),
                    text
                }))
            };

            if (dialogMode === 'add') {
                updatedQuestions.push(questionData);
            } else {
                const index = updatedQuestions.findIndex(q => q.id === selectedQuestion!.id);
                if (index !== -1) {
                    updatedQuestions[index] = questionData;
                }
            }

            await updateDoc(doc(db, 'presets', preset.id), {
                questions: updatedQuestions
            });
            setDialogOpen(false);
            setSelectedQuestion(questionData);
        } catch {
            setError('Failed to save question');
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

    if (error || !preset) {
        return (
            <Container maxWidth="sm">
                <Alert severity="error" sx={{ mt: 4 }}>
                    {error || 'Preset not found'}
                </Alert>
            </Container>
        );
    }

    const PhonePreview = () => (
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
                            {selectedQuestion.text}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {selectedQuestion.answers.map(answer => (
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

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {preset.name}
                </Typography>

                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError(null)}
                        sx={{ mb: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                <Box
                    sx={{
                        display: 'grid',
                        gap: 3,
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: '1fr 2fr 1fr'
                        }
                    }}
                >
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
                                    component="div"
                                    selected={selectedQuestion?.id === question.id}
                                    onClick={() => setSelectedQuestion(question)}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <ListItemText
                                        primary={`${index + 1}. ${question.text}`}
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditQuestion(question);
                                            }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
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

                    {/* Selected Question */}
                    <Paper sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column' }}>
                        {selectedQuestion ? (
                            <>
                                <Typography variant="h5" gutterBottom>
                                    {selectedQuestion.text}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Answers
                                </Typography>
                                <List>
                                    {selectedQuestion.answers.map((answer, index) => (
                                        <ListItem key={answer.id} component="div">
                                            <ListItemText
                                                primary={`${index + 1}. ${answer.text}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                <Box sx={{ mt: 'auto', display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleEditQuestion(selectedQuestion)}
                                        startIcon={<EditIcon />}
                                    >
                                        Edit Question
                                    </Button>
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
                        <PhoneIcon
                            sx={{
                                position: 'absolute',
                                top: -12,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                color: 'primary.main'
                            }}
                        />
                        <PhonePreview />
                    </Box>
                </Box>
            </Box>

            {/* Add/Edit Question Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add New Question' : 'Edit Question'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Question Text"
                        fullWidth
                        value={dialogData.text}
                        onChange={(e) => setDialogData({ ...dialogData, text: e.target.value })}
                    />
                    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                        Answers
                    </Typography>
                    {dialogData.answers.map((answer, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                value={answer}
                                onChange={(e) => {
                                    const newAnswers = [...dialogData.answers];
                                    newAnswers[index] = e.target.value;
                                    setDialogData({ ...dialogData, answers: newAnswers });
                                }}
                            />
                            {dialogData.answers.length > 2 && (
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        const newAnswers = dialogData.answers.filter((_, i) => i !== index);
                                        setDialogData({ ...dialogData, answers: newAnswers });
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => setDialogData({
                            ...dialogData,
                            answers: [...dialogData.answers, '']
                        })}
                        sx={{ mt: 1 }}
                    >
                        Add Answer
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveQuestion}
                        disabled={!dialogData.text || dialogData.answers.some(a => !a)}
                        variant="contained"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default PresetPage;