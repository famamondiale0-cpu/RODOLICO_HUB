import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// La tua configurazione ufficiale
const firebaseConfig = {
  apiKey: "AIzaSyAsW9T36UH47Cy2hLVfC9m2wZxE_S22k4M",
  authDomain: "rodolicohub.firebaseapp.com",
  projectId: "rodolicohub",
  storageBucket: "rodolicohub.firebasestorage.app",
  messagingSenderId: "1066843178658",
  appId: "1:1066843178658:web:5c0d95f10eae4a7384b9fb"
};

// Inizializzazione dei servizi
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configurazione per l'accesso con Google (fondamentale per il tasto Google)
const googleProvider = new GoogleAuthProvider();
// Imposta il prompt per forzare la scelta dell'account ogni volta (opzionale ma consigliato)
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Esportiamo tutto ciò che serve agli altri file (Auth.jsx e App.jsx)
export { auth, db, googleProvider };