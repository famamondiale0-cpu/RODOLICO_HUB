import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsW9T36UH47Cy2hLVfC9m2wZxE_S22k4M",
  authDomain: "rodolicohub.firebaseapp.com",
  projectId: "rodolicohub",
  storageBucket: "rodolicohub.firebasestorage.app",
  messagingSenderId: "1066843178658",
  appId: "1:1066843178658:web:5c0d95f10eae4a7384b9fb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
