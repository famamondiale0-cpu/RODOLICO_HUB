import React, { useState } from 'react';
import { auth, db, googleProvider } from '../firebase'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Mail, Lock, Key, ArrowRight, Shield, GraduationCap, School, CheckSquare, Square } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repCode, setRepCode] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false); // NUOVO STATO PER LA POLICY
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidSchoolEmail = (email) => {
    const lowerEmail = email.toLowerCase().trim();
    return lowerEmail.endsWith('@liceorodolico.it') && lowerEmail.split('@')[0].includes('.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValidSchoolEmail(email)) {
      setError("Usa la tua email istituzionale (es. cognome.nome@liceorodolico.it)");
      return;
    }

    // CONTROLLO POLICY IN FASE DI REGISTRAZIONE
    if (!isLogin && !acceptedPolicy) {
      setError("Devi accettare la Privacy Policy per registrarti.");
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (role === 'rep' && repCode !== '12345') {
          throw new Error("Codice segreto errato. Accesso negato.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (role === 'rep') {
          await setDoc(doc(db, 'admins', email.toLowerCase().trim()), {
            uid: user.uid,
            email: email.toLowerCase().trim(),
            role: 'representative',
            activatedAt: serverTimestamp()
          });
        }

        await sendEmailVerification(user);
        alert(`Account creato!\nTi abbiamo inviato un link a ${email}. Cliccalo per verificare l'account.`);
        
        setIsLogin(true);
        setPassword('');
        setRepCode('');
        setAcceptedPolicy(false);
      }
    } catch (err) {
      if (err.message.includes("Codice")) setError(err.message);
      else if (err.code === 'auth/email-already-in-use') setError("Questa email è già registrata.");
      else if (err.code === 'auth/invalid-credential') setError("Credenziali errate.");
      else if (err.code === 'auth/weak-password') setError("La password deve avere almeno 6 caratteri.");
      else setError("Errore di sistema: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError("Autenticazione Google fallita.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4fc] to-[#e6e9f0] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white p-8 sm:p-10 relative overflow-hidden"
      >
        <div className="text-center relative z-10 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg text-white mb-5">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Rodolico Hub</h1>
        </div>

        <div className="relative z-10 flex bg-gray-100/80 p-1.5 rounded-2xl mb-8">
          <button type="button" onClick={() => setRole('student')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
            <GraduationCap className="w-4 h-4" /> Studenti
          </button>
          <button type="button" onClick={() => setRole('rep')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${role === 'rep' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>
            <Shield className="w-4 h-4" /> Rappresentanti
          </button>
        </div>

        <div className="flex justify-center mb-6 relative z-10">
          <div className="inline-flex bg-gray-50 border border-gray-100 rounded-full p-1">
            <button onClick={() => { setIsLogin(true); setError(''); }} className={`px-6 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>Accedi</button>
            <button onClick={() => { setIsLogin(false); setError(''); }} className={`px-6 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>Registrati</button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 text-center relative z-10">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-4 h-5 w-5 mt-3.5 text-gray-400" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cognome.nome@liceorodolico.it" className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-4 h-5 w-5 mt-3.5 text-gray-400" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min. 6 caratteri)" className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            </div>
          </div>

          <AnimatePresence>
            {!isLogin && role === 'rep' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-1 overflow-hidden">
                <div className="relative mt-2">
                  <Key className="absolute inset-y-0 left-0 pl-4 h-5 w-5 mt-3.5 text-purple-400" />
                  <input type="text" required={role === 'rep' && !isLogin} value={repCode} onChange={(e) => setRepCode(e.target.value)} placeholder="PIN Rappresentanti (es. 12345)" className="block w-full pl-11 pr-4 py-3.5 bg-purple-50 border border-purple-200 rounded-xl text-sm font-bold text-purple-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SPUNTA PRIVACY POLICY (Solo in registrazione) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 mt-4"
              >
                <button type="button" onClick={() => setAcceptedPolicy(!acceptedPolicy)} className="mt-0.5 text-indigo-600 focus:outline-none">
                  {acceptedPolicy ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-400" />}
                </button>
                <p className="text-xs text-gray-500 leading-tight">
                  Dichiaro di aver letto e compreso la <a href="#" className="text-indigo-600 font-bold hover:underline">Privacy Policy</a>. Accetto che i miei dati vengano trattati al solo scopo di accedere al portale studentesco del Liceo Rodolico.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all ${loading ? 'opacity-70' : ''}`}>
            {loading ? "Elaborazione..." : (isLogin ? "Accedi" : "Registrati")}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 relative z-10">
          <button onClick={handleGoogleLogin} type="button" className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Accedi con l'account Scuola
          </button>
        </div>
      </motion.div>
    </div>
  );
}