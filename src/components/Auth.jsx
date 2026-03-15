import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Mail, Lock, ShieldCheck, User, ArrowRight, UserPlus } from 'lucide-react';

export default function Auth() {
  const [isRep, setIsRep] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Switch tra Login e Registrazione
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // PIN SEGRETO per diventare Rappresentante (Cambialo con quello che vuoi!)
  const SECRET_REP_PIN = "2024REP"; 

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) { setError("Errore con Google. Riprova."); }
  };

  const handleRepAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      // --- LOGICA REGISTRAZIONE RAPPRESENTANTE ---
      if (pin !== SECRET_REP_PIN) {
        setError("PIN Segreto Errato! Non puoi registrarti come Rappresentante.");
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Aggiungo l'utente nel database 'admins' automaticamente
        await setDoc(doc(db, 'admins', email.toLowerCase().trim()), {
          uid: userCredential.user.uid,
          email: email.toLowerCase().trim(),
          role: 'admin'
        });
      } catch (err) {
        setError("Errore nella registrazione: " + err.message);
      }
    } else {
      // --- LOGICA ACCESSO RAPPRESENTANTE ---
      try {
        const adminRef = doc(db, 'admins', email.toLowerCase().trim());
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          setError("Questa email non è autorizzata come Rappresentante.");
          return;
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (err) {
        setError("Email o Password errati.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-50">
        
        {/* Switch Studente/Rappresentante */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          <button onClick={() => {setIsRep(false); setError('');}} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${!isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Studente</button>
          <button onClick={() => {setIsRep(true); setError('');}} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Rappresentante</button>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold border border-red-100">{error}</div>}

        {!isRep ? (
          <div className="text-center">
            <User className="w-12 h-12 text-violet-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase mb-2">Area Studenti</h2>
            <button onClick={handleGoogleLogin} className="w-full py-4 mt-6 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" />
              Accedi con Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleRepAuth} className="space-y-4">
            <div className="text-center mb-6">
              <ShieldCheck className="w-12 h-12 text-violet-600 mx-auto mb-2" />
              <h2 className="text-2xl font-black uppercase">{isRegistering ? 'Nuovo Rappresentante' : 'Area Rappresentanti'}</h2>
            </div>
            
            {/* Campo PIN (Solo per Registrazione) */}
            {isRegistering && (
              <div className="relative">
                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                <input type="text" required placeholder="PIN SEGRETO REGISTRAZIONE" value={pin} onChange={e => setPin(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-violet-50 rounded-2xl focus:outline-violet-600 font-black text-violet-600 placeholder:text-violet-300" />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:outline-violet-600" />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:outline-violet-600" />
            </div>

            <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-violet-700 transition-all">
              {isRegistering ? <><UserPlus className="w-5 h-5" /> Registrati</> : <><ArrowRight className="w-5 h-5" /> Entra</>}
            </button>

            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-center text-xs font-bold text-gray-400 uppercase tracking-tighter hover:text-violet-600">
              {isRegistering ? "Hai già un account? Accedi" : "Non hai un account? Registrati (Serve PIN)"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}