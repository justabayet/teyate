import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase'; // Import your initialized db

function MyComponent() {
  const [items, setItems] = useState<{ id: string }[]>([]);

  useEffect(() => {
    const itemsCollection = collection(db, 'sessions');

    // Fetch data once
    // getDocs(itemsCollection).then((snapshot) => {
    //   const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setItems(itemsData);
    // });

    // Listen for real-time updates
    const unsubscribe = onSnapshot(itemsCollection, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemsData);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Sessions</h1>
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.id}</li>
        ))}
      </ul>
    </div>
  );
}

export default MyComponent;