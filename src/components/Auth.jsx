import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, User, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function Auth() {
  const [isRep, setIsRep] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const SECRET_REP_PIN = "12345"; 

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) { setError("Errore con Google."); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (isRep && pin !== SECRET_REP_PIN) {
      setError("PIN Rappresentante errato!");
      return;
    }

    try {
      if (isRep) {
        if (mode === 'register') {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          await setDoc(doc(db, 'admins', cleanEmail), { uid: userCredential.user.uid, email: cleanEmail, role: 'admin' });
        } else {
          const adminSnap = await getDoc(doc(db, 'admins', cleanEmail));
          if (!adminSnap.exists()) {
            setError("Questa email non è autorizzata come Rappresentante.");
            return;
          }
          await signInWithEmailAndPassword(auth, cleanEmail, password);
        }
      } else {
        if (mode === 'register') await createUserWithEmailAndPassword(auth, cleanEmail, password);
        else await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      setError("Credenziali errate o account inesistente.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-50">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          <button onClick={() => {setIsRep(false); setMode('login');}} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Studente</button>
          <button onClick={() => {setIsRep(true); setMode('login');}} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Rappresentante</button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase text-gray-900 leading-tight">
            {mode === 'login' ? 'Accesso' : 'Registrazione'}<br/>
            <span className="text-violet-600 text-sm">{isRep ? 'Area Rappresentanti' : 'Area Studenti'}</span>
          </h2>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-bold text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRep && (
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
              <input type="password" required placeholder="PIN SEGRETO" value={pin} onChange={e => setPin(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-violet-50 border-2 border-violet-100 rounded-2xl focus:border-violet-600 outline-none font-black text-violet-600" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl outline-none" />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl outline-none" />
          </div>
          <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
            {mode === 'login' ? <><LogIn className="w-5 h-5"/> Entra</> : <><UserPlus className="w-5 h-5"/> Registrati</>}
          </button>
        </form>

        {!isRep && (
          <button onClick={handleGoogleAuth} className="w-full py-4 mt-6 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" /> Continua con Google
          </button>
        )}

        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {mode === 'login' ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </motion.div>
    </div>
  );
}