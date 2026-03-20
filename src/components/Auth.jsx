import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ShieldCheck, UserPlus, LogIn, FileText, X } from 'lucide-react';

export default function Auth() {
  const [isRep, setIsRep] = useState(false);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false); // NUOVO STATO PER IL POPUP POLICY
  const [error, setError] = useState('');

  const SECRET_REP_PIN = "12345"; 

  const handleGoogleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (!result.user.email.endsWith('@liceorodolico.it')) {
        await auth.signOut();
        setError("Accesso negato! Devi usare l'account Google della scuola (@liceorodolico.it).");
      }
    } catch (err) { 
      setError("Errore con l'accesso Google."); 
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@liceorodolico.it')) {
      setError("Devi usare l'email istituzionale (@liceorodolico.it).");
      return;
    }

    if (mode === 'register' && !policyAccepted) {
      setError("Devi accettare la Privacy Policy per poterti registrare.");
      return;
    }

    if (isRep && mode === 'register' && pin !== SECRET_REP_PIN) {
      setError("PIN Rappresentante errato!");
      return;
    }

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (isRep) {
          await setDoc(doc(db, 'admins', cleanEmail), { uid: userCredential.user.uid, email: cleanEmail, role: 'admin' });
        }
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
    } catch (err) {
      setError("Credenziali errate o account già esistente.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-violet-50">
        
        <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
          <button onClick={() => {setIsRep(false); setMode('login'); setError('');}} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Studente</button>
          <button onClick={() => {setIsRep(true); setMode('login'); setError('');}} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${isRep ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400'}`}>Rappresentante</button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black uppercase text-gray-900 leading-tight">
            {mode === 'login' ? 'Accesso' : 'Registrazione'}<br/>
            <span className="text-violet-600 text-sm">{isRep ? 'Area Rappresentanti' : 'Area Studenti'}</span>
          </h2>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-bold text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRep && mode === 'register' && (
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
              <input type="password" required placeholder="PIN SEGRETO" value={pin} onChange={e => setPin(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-violet-50 border-2 border-violet-100 rounded-2xl focus:border-violet-600 outline-none font-black text-violet-600" />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" required placeholder="mario.rossi@liceorodolico.it" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-medium" />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl outline-none" />
          </div>

          {mode === 'register' && (
            <div className="flex items-start gap-3 mt-2 mb-2 px-2">
              <input type="checkbox" id="policy" checked={policyAccepted} onChange={e => setPolicyAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-violet-600 rounded cursor-pointer shrink-0" />
              <label htmlFor="policy" className="text-[10px] text-gray-500 font-medium leading-tight select-none">
                Ho letto e accetto i <span onClick={(e) => { e.preventDefault(); setShowPolicy(true); }} className="text-violet-600 font-bold underline cursor-pointer hover:text-violet-800 transition-colors">Termini d'uso e la Privacy Policy</span> del Rodolico Hub.
              </label>
            </div>
          )}

          <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
            {mode === 'login' ? <><LogIn className="w-5 h-5"/> Entra</> : <><UserPlus className="w-5 h-5"/> Registrati</>}
          </button>
        </form>

        {!isRep && (
          <button onClick={handleGoogleAuth} type="button" className="w-full py-4 mt-6 bg-white border-2 border-gray-100 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="G" /> Continua con Google
          </button>
        )}

        <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="w-full mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-violet-600 transition-colors">
          {mode === 'login' ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </motion.div>

      {/* POPUP POLICY E TERMINI */}
      <AnimatePresence>
        {showPolicy && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header Popup */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Regolamento Hub</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Termini & Privacy</p>
                  </div>
                </div>
                <button onClick={() => setShowPolicy(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-full shadow-sm transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenuto Testuale Scorrevole */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar text-sm text-gray-600 space-y-6">
                
                <section>
                  <h4 className="font-black text-gray-900 uppercase text-base mb-2">1. Cos'è il Rodolico Hub</h4>
                  <p className="leading-relaxed">Rodolico Hub è uno spazio digitale esclusivo creato dagli studenti per gli studenti del Liceo Scientifico N. Rodolico. L'accesso è strettamente riservato a chi possiede un indirizzo email istituzionale valido terminante in <strong>@liceorodolico.it</strong>.</p>
                </section>

                <section>
                  <h4 className="font-black text-gray-900 uppercase text-base mb-2">2. Dati Raccolti e Privacy (GDPR)</h4>
                  <p className="leading-relaxed mb-2">Per farti utilizzare la piattaforma, memorizziamo nel nostro database sicuro (su infrastruttura Google Firebase) le seguenti informazioni:</p>
                  <ul className="list-disc pl-5 space-y-1 font-medium">
                    <li>Indirizzo email istituzionale</li>
                    <li>Nome, Cognome e Classe (inseriti al primo accesso)</li>
                    <li>Idee proposte, voti assegnati (Upvote/Downvote) e interazioni con le funzionalità della piattaforma.</li>
                  </ul>
                  <p className="leading-relaxed mt-2 text-violet-600 font-bold bg-violet-50 p-3 rounded-xl">I tuoi dati NON verranno mai venduti, ceduti a terzi o usati per scopi pubblicitari. Saranno utilizzati esclusivamente per il funzionamento del sito d'istituto.</p>
                </section>

                <section>
                  <h4 className="font-black text-gray-900 uppercase text-base mb-2">3. Regole di Comportamento</h4>
                  <p className="leading-relaxed mb-2">Entrando in questa piattaforma ti impegni a:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Mantenere un linguaggio rispettoso ed educato in ogni sezione (Idee, Sportelli, ecc.).</li>
                    <li>Non pubblicare contenuti offensivi, diffamatori, discriminatori o non inerenti alla vita scolastica.</li>
                    <li>Non abusare dell'anonimato nelle "Idee". Anche se gli altri studenti non vedranno il tuo nome, in caso di infrazioni gravi (insulti o bullismo) gli Amministratori (Rappresentanti d'Istituto) possono risalire all'autore tramite il database per mantenere l'ambiente sicuro.</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-black text-gray-900 uppercase text-base mb-2">4. Moderazione</h4>
                  <p className="leading-relaxed">I Rappresentanti d'Istituto fungono da moderatori. Si riservano il diritto di nascondere o eliminare idee/post che violino questo regolamento e, in casi estremi, di sospendere l'accesso all'account trasgressore.</p>
                </section>

                <p className="text-xs text-gray-400 font-medium italic pt-4 border-t border-gray-100">
                  Questa piattaforma è un progetto studentesco. Per dubbi, richieste di cancellazione account o rimozione dati, contatta direttamente i Rappresentanti d'Istituto.
                </p>
              </div>

              {/* Footer Popup */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <button 
                  onClick={() => { setPolicyAccepted(true); setShowPolicy(false); }} 
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all"
                >
                  Ho letto, accetto e chiudi
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}