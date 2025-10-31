import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Container, Typography, TextField, Button, Alert, Paper, Tabs, Tab } from '@mui/material';

const LoginPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setSuccess('Logged in successfully!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleSignup = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setSuccess('Account created and logged in!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    };

    const handleLoginGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // You can use result.user to get user info and proceed in your app
            console.log('Logged in user:', result.user);
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <>
            <Typography variant="h1">
                Welcome to Teyate
            </Typography>
            <Container maxWidth="xs">
                <Paper sx={{ mt: 8, p: 4 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
                        <Tab label="Login" />
                        <Tab label="Sign Up" />
                    </Tabs>
                    <Typography variant="h5" align="center" gutterBottom>
                        {tab === 0 ? 'Login' : 'Sign Up'}
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={tab === 0 ? handleLogin : handleSignup}
                        disabled={loading || !email || !password}
                        sx={{ mb: 1 }}
                    >
                        {tab === 0 ? 'Login' : 'Sign Up'}
                    </Button>
                    <Button
                        variant="contained"
                        color="inherit"
                        fullWidth
                        onClick={handleLoginGoogle}
                        disabled={loading}
                    >
                        Login Google
                    </Button>
                </Paper>
            </Container>
        </>
    );
};

export default LoginPage;
