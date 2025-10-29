

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

function HomePage() {
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

    return (
        <div>
            <h1>Welcome to the Home Page</h1>
            <button onClick={handleLogin}>Log in with Google</button>
        </div>
    );
}

export default HomePage;