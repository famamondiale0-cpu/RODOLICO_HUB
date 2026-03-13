import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { getDocs, collection, doc, setDoc } from 'firebase/firestore';
import { GraduationCap, Shield, Mail, Lock, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GiglioIcon = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-violet-600 fill-current`}><path d="M50 10c-5 15-15 20-15 35 0 10 5 15 15 15s15-5 15-15c0-15-10-20-15-35zM30 45c-10 0-15 5-15 15 0 15 15 20 20 30 5-10 10-15 10-25 0-10-5-20-15-20zM70 45c10 0 15 5 15 15 0 15-15 20-20 30-5-10-10-15-10-25 0-10-5-20 15-20z" /></svg>
);

const BackgroundDecor = () => (
  <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-100/40 blur-[120px] rounded-full"></div>
    <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-violet-200/30 blur-[120px] rounded-full"></div>
  </div>
);

export default function Auth() {
  const [authMode, setAuthMode] = useState(null); // null, 'student', 'rep'
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (err) { setError('Errore Google Login'); }
    finally { setLoading(false); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    // Controllo PIN per i Rappresentanti
    if (authMode === 'rep' && pin !== '12345') {
      return setError('PIN Sicurezza Errato');
    }

    setLoading(true);
    try {
      if (isRegistering) {
        if (authMode === 'rep') {
          const snap = await getDocs(collection(db, 'admins'));
          if (snap.size >= 4) throw new Error('Limite di 4 Rappresentanti raggiunto.');
        }
        
        const res = await createUserWithEmailAndPassword(auth, email, password);
        
        // Se è rappresentante, lo salvo nel database degli admin
        if (authMode === 'rep') {
          await setDoc(doc(db, 'admins', email.toLowerCase()), { email: email.toLowerCase(), role: 'admin' });
        }
        
        await sendEmailVerification(res.user);
        alert("Account creato! Verifica la tua mail (controlla lo spam) prima di accedere.");
        setIsRegistering(false); setPassword(''); setPin('');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { 
      setError(err.message.includes('Limite') ? err.message : 'Credenziali non valide o errore server'); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <BackgroundDecor />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[48px] p-10 shadow-2xl shadow-violet-200/50 border border-white relative z-10">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="mb-6 p-4 bg-white rounded-3xl shadow-xl shadow-violet-100 border border-violet-50">
            <GiglioIcon />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Rodolico <span className="text-violet-600">Hub</span></h1>
        </div>

        <AnimatePresence mode="wait">
          {!authMode ? (
            <motion.div key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <button onClick={() => {setAuthMode('student'); setIsRegistering(false);}} className="w-full p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-6 hover:border-violet-600 transition-all shadow-sm hover:shadow-xl group">
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all"><GraduationCap className="w-7 h-7"/></div>
                <div className="text-left"><p className="font-black text-gray-900 uppercase text-lg">Studenti</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email o Google</p></div>
              </button>
              <button onClick={() => {setAuthMode('rep'); setIsRegistering(false);}} className="w-full p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-6 hover:border-black transition-all shadow-sm hover:shadow-xl group">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all"><Shield className="w-7 h-7"/></div>
                <div className="text-left"><p className="font-black text-gray-900 uppercase text-lg">Rappresentanti</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email + PIN</p></div>
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
              <button onClick={() => { setAuthMode(null); setError(''); }} className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors hover:text-violet-800">← Torna indietro</button>
              
              <div className="text-center space-y-1 mb-6">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{authMode === 'student' ? 'Area Studenti' : 'Area Rappresentanti'}</h2>
                <p className="text-gray-400 text-xs font-semibold">{isRegistering ? 'Crea un nuovo account' : 'Inserisci le tue credenziali'}</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email istituzionale" className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:outline-none focus:border-violet-600 font-medium" /></div>
                <div className="relative"><Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" minLength={6} className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[20px] focus:outline-none focus:border-violet-600 font-medium" /></div>
                
                {authMode === 'rep' && (
                  <div className="relative"><KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" /><input type="password" required value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN di Sicurezza" maxLength={5} className="w-full pl-14 pr-6 py-4 bg-violet-50/50 border border-violet-100 rounded-[20px] focus:outline-none focus:border-violet-600 font-black tracking-widest placeholder:tracking-normal" /></div>
                )}

                {error && <p className="text-[10px] text-red-500 font-bold uppercase text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
                
                <button type="submit" disabled={loading} className="w-full py-4 bg-violet-600 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3 hover:bg-violet-700 transition-all">
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>{isRegistering ? 'Registrati' : 'Accedi'} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="flex flex-col gap-3 pt-2">
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-bold text-gray-400 uppercase text-center hover:text-violet-600">{isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}</button>
                
                {authMode === 'student' && !isRegistering && (
                  <>
                    <div className="flex items-center gap-4 py-2"><div className="flex-1 h-px bg-gray-100"></div><span className="text-[10px] font-black text-gray-300 uppercase">Oppure</span><div className="flex-1 h-px bg-gray-100"></div></div>
                    <button onClick={handleGoogle} type="button" className="w-full py-4 bg-white border border-gray-200 text-gray-800 rounded-[20px] font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                      <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" /> Google
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}