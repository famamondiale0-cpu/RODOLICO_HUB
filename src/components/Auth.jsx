import React, { useState } from 'react';
// Importiamo auth, db e googleProvider dal TUO file di configurazione locale
import { auth, db, googleProvider } from '../firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup
} from 'firebase/auth';
import { motion } from 'framer-motion'; 
import { LogIn, UserPlus, Chrome, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // GESTIONE LOGIN E REGISTRAZIONE STANDARD
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // ACCESSO: L'utente entra, se l'email non è verificata 
        // verrà bloccato dalla logica che abbiamo messo in App.jsx
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // REGISTRAZIONE: Crea l'utente e invia l'email di verifica
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Invia il link di verifica
        await sendEmailVerification(userCredential.user);
        
        alert("🚨 REGISTRAZIONE QUASI COMPLETATA!\n\nAbbiamo inviato un link di verifica a " + email + ".\nControlla la tua posta (anche lo SPAM) e clicca sul link per attivare l'account prima di accedere.");
        
        setIsLogin(true); // Riporta l'utente alla schermata di login
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') setError("Questa email è già registrata.");
      else if (err.code === 'auth/weak-password') setError("La password deve avere almeno 6 caratteri.");
      else if (err.code === 'auth/invalid-credential') setError("Email o password errate.");
      else setError("Errore: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // GESTIONE ACCESSO CON GOOGLE (Mantenuta)
  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      // Con Google l'email è già verificata, quindi l'utente entra subito
    } catch (err) {
      setError("Errore con Google: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-100 text-center"
      >
        <div className="mb-8">
          <div className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-violet-200">
            {isLogin ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
          </div>
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">
            Rodolico <span className="text-violet-600">Hub</span>
          </h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase mt-2 tracking-[0.2em]">
            {isLogin ? "Accedi alla tua area" : "Crea il tuo profilo studente"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 text-red-600 text-[11px] font-black uppercase rounded-2xl border border-red-100 tracking-wider"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input 
              type="email" 
              required 
              placeholder="Email Istituzionale" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-violet-600 focus:bg-white transition-all font-bold text-sm" 
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            <input 
              type="password" 
              required 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-violet-600 focus:bg-white transition-all font-bold text-sm" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-[0.15em] shadow-xl shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? "Elaborazione..." : isLogin ? "Entra nel Hub" : "Registrati Ora"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-400"><span className="bg-white px-4 tracking-widest">Oppure</span></div>
        </div>

        {/* PULSANTE GOOGLE */}
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3 mb-6 shadow-sm"
        >
          <Chrome className="w-5 h-5 text-red-500" /> Accedi con l'account Scuola
        </button>

        <button 
          onClick={() => { setIsLogin(!isLogin); setError(''); }} 
          className="text-[10px] font-black text-violet-500 uppercase tracking-widest hover:text-violet-700 transition-colors"
        >
          {isLogin ? "Non hai un account? Registrati qui" : "Hai già un account? Torna al login"}
        </button>
      </motion.div>
    </div>
  );
}