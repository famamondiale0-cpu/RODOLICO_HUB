import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ShieldCheck, User, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function Auth() {
  const [isRep, setIsRep] = useState(false); // Toggle Studente / Rappresentante
  const [mode, setMode] = useState('login'); // 'login' o 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // --- CONFIGURAZIONE PIN ---
  // Questo è il PIN che i rappresentanti devono usare per REGISTRARSI
  const SECRET_REP_PIN = "12345"; 

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Errore con l'accesso Google. Riprova.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin.trim();

    try {
      if (isRep) {
        // --- LOGICA RAPPRESENTANTE ---
        if (mode === 'register') {
          if (cleanPin !== SECRET_REP_PIN) {
            setError("PIN Segreto non valido. Non puoi creare un account Rappresentante.");
            return;
          }
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          await setDoc(doc(db, 'admins', cleanEmail), {
            uid: userCredential.user.uid,
            email: cleanEmail,
            role: 'admin'
          });
        } else {
          // Accesso Rappresentante: Controlla se è nel database admins
          const adminSnap = await getDoc(doc(db, 'admins', cleanEmail));
          if (!adminSnap.exists()) {
            setError("Accesso negato: questa email non è tra gli amministratori.");
            return;
          }
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        }
      } else {
        // --- LOGICA STUDENTE ---
        if (mode === 'register') {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } else {
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Email già registrata.");
      else if (err.code === 'auth/wrong-password') setError("Password errata.");
      else if (err.code === 'auth/user-not-found') setError("Utente non trovato.");
      else setError("Errore: controlla i dati e riprova.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-sans">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[40px] p-8 md:p-10 shadow-2xl border border-violet-50">
        
        {/* Switch Principale: Studente / Rappresentante */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          <button onClick={() => {setIsRep(false); setError(''); setMode('login');}} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Studente</button>
          <button onClick={() => {setIsRep(true); setError(''); setMode('login');}} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Rappresentante</button>
        </div>

        {/* Intestazione Dinamica */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-4">
            {isRep ? <ShieldCheck className="w-8 h-8"/> : <User className="w-8 h-8"/>}
          </div>
          <h2 className="text-2xl font-black uppercase text-gray-900 leading-tight">
            {mode === 'login' ? 'Bentornato' : 'Crea Account'}<br/>
            <span className="text-violet-600 text-sm">{isRep ? 'Area Rappresentanti' : 'Area Studenti'}</span>
          </h2>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-bold border border-red-100 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo PIN solo per Registrazione Rappresentante */}
          {isRep && mode === 'register' && (
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
              <input type="text" required placeholder="PIN SEGRETO" value={pin} onChange={e => setPin(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-violet-50 border-2 border-violet-100 rounded-2xl focus:border-violet-600 outline-none font-black text-violet-600" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:outline-violet-600 outline-none font-medium" />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:outline-violet-600 outline-none font-medium" />
          </div>

          <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-violet-600/20 flex items-center justify-center gap-2 hover:bg-violet-700 active:scale-[0.98] transition-all">
            {mode === 'login' ? <><LogIn className="w-5 h-5"/> Entra</> : <><UserPlus className="w-5 h-5"/> Registrati</>}
          </button>
        </form>

        {/* Pulsante Google (Sempre visibile per Studenti, rimosso per Rep per sicurezza) */}
        {!isRep && (
          <>
            <div className="flex items-center my-6 gap-4">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-[10px] font-black text-gray-300 uppercase">Oppure</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>
            <button onClick={handleGoogleAuth} className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" />
              Continua con Google
            </button>
          </>
        )}

        {/* Switch tra Login e Registrazione */}
        <button 
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-violet-600 transition-colors"
        >
          {mode === 'login' ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>

      </motion.div>
    </div>
  );
}