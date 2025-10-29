import { useEffect, useState } from 'react';
import { collection, addDoc, query, where, onSnapshot, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';

type Answer = { id: string; text: string };
type Question = { id: string; text: string; answers: Answer[] };
type Preset = { id: string; name: string; directorId: string; questions?: Question[] };

function DirectorPage() {
    const { user, loading } = useAuth();
    const [presets, setPresets] = useState<Preset[]>([]);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (!user) return;
        const presetsCol = collection(db, 'presets');
        const q = query(presetsCol, where('directorId', '==', user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const items: Preset[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
            setPresets(items);
        });
        return () => unsub();
    }, [user]);

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Please log in to access director controls.</div>;

    const createPreset = async () => {
        if (!newName) return;
        await addDoc(collection(db, 'presets'), { name: newName, directorId: user.uid, questions: [] });
        setNewName('');
    };

    const addQuestion = async (presetId: string) => {
        const qText = prompt('Question text');
        if (!qText) return;
        const docRef = doc(db, 'presets', presetId);
        const snap = await getDoc(docRef);
        const data = snap.data() || { questions: [] };
        const questions = data.questions || [];
        questions.push({ id: Date.now().toString(), text: qText, answers: [{ id: 'a1', text: 'Yes' }, { id: 'a2', text: 'No' }] });
        await updateDoc(docRef, { questions });
    };

    const deletePreset = async (presetId: string) => {
        if (!confirm('Delete preset?')) return;
        await deleteDoc(doc(db, 'presets', presetId));
    };

    const startSession = async (presetId: string) => {
        // create sessions doc linking to preset
        const sessionRef = await addDoc(collection(db, 'sessions'), {
            presetId,
            directorId: user!.uid,
            isOpen: true,
            currentQuestionIndex: null,
            questionEndAt: null,
            createdAt: new Date()
        });
        alert('Session started. Share this link with participants:\n' + window.location.origin + '?sessionId=' + sessionRef.id);
    };

    return (
        <div>
            <h1>Director — Presets</h1>
            <div>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New preset name" />
                <button onClick={createPreset}>Create Preset</button>
            </div>
            <ul>
                {presets.map(p => (
                    <li key={p.id} style={{ marginBottom: 12 }}>
                        <strong>{p.name}</strong>
                        <div>
                            <button onClick={() => addQuestion(p.id)}>Add Question</button>
                            <button onClick={() => startSession(p.id)} style={{ marginLeft: 8 }}>Start Session</button>
                            <button onClick={() => deletePreset(p.id)} style={{ marginLeft: 8 }}>Delete</button>
                        </div>
                        <ol>
                            {p.questions?.map(q => (
                                <li key={q.id}>{q.text} — answers: {q.answers.map(a => a.text).join(', ')}</li>
                            ))}
                        </ol>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DirectorPage;
