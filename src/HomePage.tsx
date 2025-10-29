

import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './auth';

function HomePage() {
    const { user } = useAuth();

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // You can use result.user to get user info and proceed in your app
            console.log('Logged in user:', result.user);
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
    }

    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            {user ? (
                <div>
                    <div>Signed in as: {user.email}</div>
                    <button onClick={handleSignOut}>Sign out</button>
                </div>
            ) : (
                <button onClick={handleLogin}>Log in with Google</button>
            )}
        </div>
    );
}

export default HomePage;