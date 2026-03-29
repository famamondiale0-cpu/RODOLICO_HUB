import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Aggiungi GoogleAuthProvider qui
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // le tue chiavi API qui...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider(); // Crea l'istanza qui

// ESPORTALI TUTTI E TRE
export { auth, db, googleProvider };