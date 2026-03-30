import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react'; 
import { LogIn, UserPlus, Chrome, Mail, Lock, ShieldCheck, Star } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isRep, setIsRep] = useState(false); // Stato per distinguere Studente/Rappresentante
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repCode, setRepCode] = useState(''); // Il codice 12345
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // --- LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // --- REGISTRAZIONE ---
        
        // Controllo codice se ha scelto Rappresentante
        if (isRep && repCode !== '12345') {
          throw new Error("Codice Rappresentante errato! Chiedi al tuo coordinatore.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Se è Rappresentante, lo aggiungiamo subito alla lista Admin nel DB
        if (isRep) {
          await setDoc(doc(db, 'admins', email.toLowerCase().trim()), {
            uid: user.uid,
            email: email.toLowerCase().trim(),
            role: 'representative',
            activatedAt: serverTimestamp()
          });
        }

        // Invia email di verifica
        await sendEmailVerification(user);
        
        alert("Account creato! Verifica la tua email " + email + " prima di accedere. Se sei Rappresentante, i tuoi poteri saranno attivi dopo la verifica.");
        
        setIsLogin(true);
        setIsRep(false);
      }
    } catch (err) {
      console.error(err);
      if (err.message.includes("Codice")) setError(err.message);
      else if (err.code === 'auth/email-already-in-use') setError("Questa email è già in uso.");
      else setError("Errore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Errore Google: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-100 text-center"
      >
        <div className="mb-6">
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">
            Rodolico <span className="text-violet-600">Hub</span>
          </h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase mt-2 tracking-[0.2em]">
            {isLogin ? "Area Riservata Studenti" : "Crea un nuovo account"}
          </p>
        </div>

        {/* Tab Scelta Studente/Rappresentante (Solo in Registrazione) */}
        {!isLogin && (
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button 
              onClick={() => setIsRep(false)}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${!isRep ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-400'}`}
            >
              Studente
            </button>
            <button 
              onClick={() => setIsRep(true)}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${isRep ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-400'}`}
            >
              Rappresentante
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative text-left">
            <label className="text-[9px] font-black text-gray-400 uppercase ml-4 mb-1 block tracking-widest">Email</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-violet-600 focus:bg-white transition-all font-bold text-sm" placeholder="nome@email.it" />
            </div>
          </div>
          
          <div className="relative text-left">
            <label className="text-[9px] font-black text-gray-400 uppercase ml-4 mb-1 block tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-violet-600 focus:bg-white transition-all font-bold text-sm" placeholder="••••••••" />
            </div>
          </div>

          {/* Campo Codice Segreto (Appare solo se seleziona Rappresentante) */}
          <AnimatePresence>
            {!isLogin && isRep && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="relative text-left overflow-hidden"
              >
                <label className="text-[9px] font-black text-orange-500 uppercase ml-4 mb-1 block tracking-widest">Codice Segreto Rappresentanti</label>
                <div className="relative">
                  <Star className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  <input type="text" required={isRep} value={repCode} onChange={e => setRepCode(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-orange-50 border-2 border-orange-200 rounded-2xl outline-none focus:border-orange-500 font-black text-sm" placeholder="Inserisci PIN" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Attendi..." : isLogin ? "Accedi" : "Registrati"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400"><span className="bg-white px-4">Oppure</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6"
        >
          <Chrome className="w-5 h-5 text-red-500" /> Google Login
        </button>

        <button 
          onClick={() => { setIsLogin(!isLogin); setIsRep(false); setError(''); }} 
          className="text-[10px] font-black text-violet-500 uppercase tracking-widest hover:underline"
        >
          {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </motion.div>
    </div>
  );
}