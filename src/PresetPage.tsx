import { useEffect, useState } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
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
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    // Phone as PhoneIcon,
    DragHandle as DragHandleIcon
} from '@mui/icons-material';
type Answer = { id: string; text: string };
type Question = { id: string; text: string; answers: Answer[] };
type Preset = { id: string; name: string; directorId: string; questions: Question[] };

const QUESTION_NB_CHAR = 15
function PresetPage() {
    const { presetId } = useParams();
    useAuth(); // Ensure user is authenticated
    const [preset, setPreset] = useState<Preset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [editData, setEditData] = useState<{ text: string; answers: string[] }>({ text: '', answers: ['Yes', 'No'] });


    const sensors = useSensors(useSensor(PointerSensor));
    const [questionsOrder, setQuestionsOrder] = useState<string[]>([]);
    useEffect(() => {
        if (preset) {
            setQuestionsOrder(preset.questions.map(q => q.id));
        }
    }, [preset]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id || !preset) return;
        const oldIndex = questionsOrder.indexOf(active.id as string);
        const newIndex = questionsOrder.indexOf(over.id as string);
        const newOrder = arrayMove(questionsOrder, oldIndex, newIndex);
        setQuestionsOrder(newOrder);
        // Reorder questions array and update Firestore
        const reorderedQuestions = newOrder.map(id => preset.questions.find(q => q.id === id)!);
        updateDoc(doc(db, 'presets', preset.id), { questions: reorderedQuestions });
        setPreset({ ...preset, questions: reorderedQuestions });
    };

    function SortableQuestion({ question, index }: { question: Question, index: number }) {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
        return (
            <ListItem
                ref={setNodeRef}
                {...attributes}
                onClick={() => setSelectedQuestion(question)}
                sx={{
                    cursor: 'pointer',
                    bgcolor: selectedQuestion?.id === question.id ? 'action.selected' : undefined,
                    boxShadow: isDragging ? 4 : undefined,
                    transform: CSS.Transform.toString(transform),
                    transition
                }}
            >
                <ListItemText
                    primary={`${index + 1}. ${question.text.substring(0, QUESTION_NB_CHAR)}${question.text.length > QUESTION_NB_CHAR ? '...' : ''}`}
                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                />
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
                <IconButton
                    size="small"
                    {...listeners}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(question.id);
                    }}
                >
                    <DragHandleIcon fontSize="small" />
                </IconButton>
            </ListItem>
        );
    }

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

    // const PhonePreview = () => {
    //     let previewText = selectedQuestion ? selectedQuestion.text : '';
    //     let previewAnswers = selectedQuestion ? selectedQuestion.answers : [];
    //     // If editing, show live editData
    //     if (selectedQuestion && editData && editData.text && editData.answers.length > 0) {
    //         previewText = editData.text;
    //         previewAnswers = editData.answers.map((text, index) => ({ id: 'a' + (index + 1), text }));
    //     }
    //     return (
    //         <Paper
    //             sx={{
    //                 p: 2,
    //                 height: '600px',
    //                 width: '300px',
    //                 mx: 'auto',
    //                 display: 'flex',
    //                 flexDirection: 'column',
    //                 bgcolor: '#f5f5f5'
    //             }}
    //         >
    //             <Box sx={{ flex: 1, overflow: 'auto' }}>
    //                 {selectedQuestion ? (
    //                     <>
    //                         <Typography variant="h6" gutterBottom>
    //                             {previewText}
    //                         </Typography>
    //                         <Box sx={{ mt: 2 }}>
    //                             {previewAnswers.map(answer => (
    //                                 <Button
    //                                     key={answer.id}
    //                                     variant="outlined"
    //                                     disabled
    //                                     fullWidth
    //                                     sx={{ mb: 1 }}
    //                                 >
    //                                     {answer.text}
    //                                 </Button>
    //                             ))}
    //                         </Box>
    //                     </>
    //                 ) : (
    //                     <Typography color="textSecondary" align="center">
    //                         Select a question to preview
    //                     </Typography>
    //                 )}
    //             </Box>
    //         </Paper>
    //     );
    // };

    return (
        <Container maxWidth="lg">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {preset.name}
                </Typography>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>
                )}

                <Box sx={{ display: 'grid', gap: { xs: 1, md: 4 }, gridTemplateColumns: '1fr 2fr' }}>
                    {/* Questions List */}
                    <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6">Questions</Typography>
                            <Typography variant="body2">{preset.questions.length}</Typography>
                        </Box>
                        <List sx={{ flex: 1, overflow: 'auto' }}>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                            >
                                <SortableContext items={questionsOrder} strategy={verticalListSortingStrategy}>
                                    {questionsOrder.map((id, index) => {
                                        const question = preset.questions.find(q => q.id === id);
                                        if (!question) return null;
                                        return <SortableQuestion key={question.id} question={question} index={index} />;
                                    })}
                                </SortableContext>
                            </DndContext>
                            <ListItem key={'add-question'} onClick={() => handleAddQuestion()}>
                                <Button startIcon={<AddIcon />} sx={{ mt: 1 }}>Question</Button>
                            </ListItem>
                        </List>
                    </Paper>

                    {/* Selected Question / Edit Panel */}
                    <Paper sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column', minWidth: '300px' }}>
                        {selectedQuestion ? (
                            <>
                                <TextField
                                    label="Question Text"
                                    fullWidth
                                    multiline
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
                                            multiline
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
                                    Answer
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
                    {/* <Box sx={{ position: 'relative' }}>
                        <PhoneIcon sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', color: 'primary.main' }} />
                        <PhonePreview />
                    </Box> */}
                </Box>
            </Box>
        </Container>
    );
}

export default PresetPage;