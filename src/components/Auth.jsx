import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  googleProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion'; // o 'motion/react' a seconda della tua versione
import { LogIn, UserPlus, Chrome } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // FUNZIONE LOGIN/REGISTRAZIONE STANDARD
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        // ACCESSO: Firebase farà entrare l'utente, 
        // ma il blocco in App.jsx lo fermerà se non ha verificato l'email
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // REGISTRAZIONE NUOVO UTENTE
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 1. Invia immediatamente l'email di verifica
        await sendEmailVerification(userCredential.user);
        
        alert("Account creato! Ti abbiamo inviato un link di verifica a " + email + ". Controlla la tua casella di posta (anche spam) prima di accedere.");
        
        // Riporta l'utente al modulo di login
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Questa email è già registrata.");
      else if (err.code === 'auth/weak-password') setError("La password deve avere almeno 6 caratteri.");
      else setError("Errore: " + err.message);
    }
  };

  // FUNZIONE ACCESSO CON GOOGLE (Mantenuta come richiesto)
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Gli utenti Google sono verificati automaticamente da Google, 
      // quindi per loro l'accesso sarà diretto.
      console.log("Accesso Google riuscito:", result.user.email);
    } catch (err) {
      setError("Errore con Google: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-100 text-center"
      >
        <h2 className="text-3xl font-black uppercase text-gray-900 mb-2">Rodolico <span className="text-violet-600">Hub</span></h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase mb-8 tracking-[0.2em]">
          {isLogin ? "Bentornato Studente" : "Unisciti alla Community"}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            required 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-violet-600 focus:bg-white transition-all font-medium" 
          />
          <input 
            type="password" 
            required 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:border-violet-600 focus:bg-white transition-all font-medium" 
          />
          
          <button 
            type="submit" 
            className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all flex items-center justify-center gap-2"
          >
            {isLogin ? <><LogIn className="w-5 h-5" /> Accedi</> : <><UserPlus className="w-5 h-5" /> Crea Account</>}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400"><span className="bg-white px-4">Oppure</span></div>
        </div>

        {/* PULSANTE GOOGLE MANTENUTO */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-[24px] font-bold uppercase text-xs tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6"
        >
          <Chrome className="w-5 h-5 text-red-500" /> Entra con Google
        </button>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="text-[10px] font-black text-violet-500 uppercase tracking-widest hover:text-violet-700 transition-colors"
        >
          {isLogin ? "Non hai un account? Registrati qui" : "Hai già un account? Torna al login"}
        </button>
      </motion.div>
    </div>
  );
}