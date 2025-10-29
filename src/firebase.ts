import { type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBdyToCk3N_IgrI2KCVyW_UNi4YkZIPXlU",
  authDomain: "teyate-d145a.firebaseapp.com",
  projectId: "teyate-d145a",
  storageBucket: "teyate-d145a.firebasestorage.app",
  messagingSenderId: "552072253319",
  appId: "1:552072253319:web:452f4bf4044b692d300d22",
  measurementId: "G-J7VVVLR3JV"
};

const firebaseApp: FirebaseApp = initializeApp(firebaseConfig)

export const auth: Auth = getAuth(firebaseApp)

export const db: Firestore = getFirestore(firebaseApp)