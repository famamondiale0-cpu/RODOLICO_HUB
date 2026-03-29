import React, { useState } from 'react';
import { auth } from '../firebase'; // Assicurati che il percorso sia giusto per il tuo progetto
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Manda l'email di verifica
        await sendEmailVerification(userCredential.user);
        alert("Registrazione completata! Controlla la tua email per verificare l'account prima di accedere.");
        setIsLogin(true); // Riporta al login
      }
    } catch (err) {
      setError(err.message || "Errore durante l'autenticazione");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-100 text-center">
        <h2 className="text-3xl font-black uppercase text-gray-900 mb-2">Rodolico Hub</h2>
        <p className="text-gray-400 font-bold text-xs uppercase mb-8 tracking-widest">
          {isLogin ? "Accedi al tuo account" : "Crea un nuovo account"}
        </p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" required placeholder="Email istituzionale o personale" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-violet-600 transition-all font-medium" />
          <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-violet-600 transition-all font-medium" />
          <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
            {isLogin ? <><LogIn className="w-5 h-5" /> Entra</> : <><UserPlus className="w-5 h-5" /> Registrati</>}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="mt-6 text-xs font-bold text-violet-500 uppercase tracking-widest hover:text-violet-700">
          {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </motion.div>
    </div>
  );
}