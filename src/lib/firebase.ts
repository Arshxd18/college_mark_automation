import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAAh5sxgpEzllundz9sgTksa7AFC60DNDk",
    authDomain: "co-automation-8bf93.firebaseapp.com",
    projectId: "co-automation-8bf93",
    storageBucket: "co-automation-8bf93.firebasestorage.app",
    messagingSenderId: "429151841149",
    appId: "1:429151841149:web:65d9480d447b56c5a43a14",
};

// Prevent re-initialization in Next.js dev hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export default app;
