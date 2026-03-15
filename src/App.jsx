import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Bell, Lightbulb, MessageSquare, ShieldCheck, 
  User, ThumbsUp, ThumbsDown, ArrowLeft, Send, 
  ChevronRight, Trophy, School, GraduationCap, KeyRound, BookOpen 
} from 'lucide-react';
import Auth from './components/Auth';

// Icona Giglio di Firenze stilizzata
const GiglioIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-violet-600 fill-current`}>
    <path d="M50 10c-5 15-15 20-15 35 0 10 5 15 15 15s15-5 15-15c0-15-10-20-15-35zM30 45c-10 0-15 5-15 15 0 15 15 20 20 30 5-10 10-15 10-25 0-10-5-20 15-20zM70 45c10 0 15 5 15 15 0 15-15 20-20 30-5-10-10-15-10-25 0-10-5-20 15-20z" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // STATI PROFILO OBBLIGATORIO
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileData, setProfileData] = useState({ nome: '', cognome: '', classe: '' });
  
  // STATI SPORTELLI
  const [sportelliStep, setSportelliStep] = useState('choice'); // 'choice', 'prof-pin', 'coming-soon'
  const [profPinInput, setProfPinInput] = useState('');
  const [sportelliRole, setSportelliRole] = useState('');

  // STATI CONTENUTI
  const [ideas, setIdeas] = useState([]);
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', desc: '', anonymous: false });
  const [newNotice, setNewNotice] = useState({ title: '', category: 'Circolare', content: '' });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u) {
        setUser(u);
        // 1. Controlla se è Admin
        const adminDoc = await getDoc(doc(db, 'admins', u.email.toLowerCase().trim()));
        const isAdminUser = adminDoc.exists();
        setIsAdmin(isAdminUser);

        // 2. Se non è admin, controlla se ha compilato il profilo
        if (!isAdminUser) {
          const userProfile = await getDoc(doc(db, 'users', u.uid));
          if (!userProfile.exists()) {
            setNeedsProfile(true);
          } else {
            setNeedsProfile(false);
          }
        } else {
          setNeedsProfile(false); // Gli admin non hanno bisogno del profilo studente
        }

        // Sottoscrizione dati (Bacheca e Idee)
        onSnapshot(query(collection(db, 'ideas'), orderBy('createdAt', 'desc')), (snap) => {
          setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), (snap) => {
          setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  // SALVATAGGIO PROFILO STUDENTE
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.nome || !profileData.cognome || !profileData.classe) return;
    
    try {
      await setDoc(doc(db, 'users', user.uid), {
        nome: profileData.nome.trim(),
        cognome: profileData.cognome.trim(),
        classe: profileData.classe.toUpperCase().trim(),
        email: user.email,
        role: 'student',
        createdAt: serverTimestamp()
      });
      setNeedsProfile(false);
    } catch (err) {
      alert("Errore durante il salvataggio. Riprova.");
    }
  };

  // LOGICA PIN PROFESSORI (SPORTELLI)
  const handleProfPinSubmit = (e) => {
    e.preventDefault();
    if (profPinInput === '56789') {
      setSportelliRole('prof');
      setSportelliStep('coming-soon');
    } else {
      alert('PIN errato! Accesso negato.');
      setProfPinInput('');
    }
  };

  // LOGICA INVIO IDEE
  const submitIdea = async (e) => {
    e.preventDefault();
    let authorName = "Studente Anonimo";
    if (!newIdea.anonymous) {
      if (isAdmin) {
        authorName = "Rappresentante";
      } else {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        if (uDoc.exists()) {
          const d = uDoc.data();
          authorName = `${d.nome} ${d.cognome} (${d.classe})`;
        }
      }
    }
    await addDoc(collection(db, 'ideas'), {
      ...newIdea,
      authorId: user.uid,
      authorName,
      upvotes: [],
      downvotes: [],
      createdAt: serverTimestamp()
    });
    setNewIdea({ title: '', desc: '', anonymous: false });
    setShowForm(false);
  };

  // LOGICA INVIO AVVISI (SOLO ADMIN)
  const submitNotice = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    await addDoc(collection(db, 'notices'), {
      ...newNotice,
      createdAt: serverTimestamp()
    });
    setNewNotice({ title: '', category: 'Circolare', content: '' });
    setShowForm(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
        <GiglioIcon className="w-12 h-12" />
      </motion.div>
    </div>
  );

  if (!user) return <Auth />;

  // SCHERMATA MURO: PROFILO OBBLIGATORIO
  if (needsProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl text-center border border-violet-100">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-6">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black uppercase text-gray-900 mb-2">Quasi fatto!</h2>
          <p className="text-gray-400 font-bold text-xs uppercase mb-8 tracking-widest">Completa il tuo profilo studente</p>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <input type="text" required placeholder="Nome" value={profileData.nome} onChange={e => setProfileData({...profileData, nome: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-violet-600 transition-all font-medium" />
            <input type="text" required placeholder="Cognome" value={profileData.cognome} onChange={e => setProfileData({...profileData, cognome: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-violet-600 transition-all font-medium" />
            <input type="text" required placeholder="Classe (es. 4G)" maxLength={3} value={profileData.classe} onChange={e => setProfileData({...profileData, classe: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-violet-600 transition-all font-black uppercase text-center text-xl" />
            
            <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 transition-all flex items-center justify-center gap-2">
              Avanza <ChevronRight className="w-5 h-5" />
            </button>
          </form>
          
          <button onClick={() => signOut(auth)} className="mt-8 text-[10px] font-black text-red-400 uppercase tracking-widest">Esci dall'account</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-violet-50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <GiglioIcon className="w-8 h-8" />
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Rodolico <span className="text-violet-600">Hub</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-black text-gray-900 uppercase">{isAdmin ? "Admin Rappresentante" : "Area Studenti"}</span>
              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">{user.email}</span>
            </div>
            <button onClick={() => signOut(auth)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut className="w-4 h-4"/></button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView !== 'dashboard' && (
          <button onClick={() => {setCurrentView('dashboard'); setSportelliStep('choice'); setShowForm(false);}} className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 uppercase hover:text-violet-600 transition-colors">
            <ArrowLeft className="w-4 h-4"/> Torna alla Dashboard
          </button>
        )}

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* CARD ATTIVE */}
            <motion.div whileHover={{y:-5}} onClick={() => setCurrentView('bacheca')} className="cursor-pointer bg-white p-8 rounded-[40px] shadow-xl shadow-violet-100/50 border border-violet-50 group">
              <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Bell /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Bacheca</h3>
            </motion.div>

            <motion.div whileHover={{y:-5}} onClick={() => setCurrentView('idee')} className="cursor-pointer bg-white p-8 rounded-[40px] shadow-xl shadow-yellow-100/50 border border-yellow-50 group">
              <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Lightbulb /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Idee</h3>
            </motion.div>

            <motion.div whileHover={{y:-5}} onClick={() => setCurrentView('sportelli')} className="cursor-pointer bg-white p-8 rounded-[40px] shadow-xl shadow-emerald-100/50 border border-emerald-50 group">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><GraduationCap /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Sportelli</h3>
            </motion.div>

            {/* CARD IN ARRIVO */}
            {[
              { title: 'Tornei Scolastici', icon: Trophy, color: 'bg-rose-500' },
              { title: 'Dentro la Scuola', icon: School, color: 'bg-blue-500' },
              { title: 'Forum Libero', icon: MessageSquare, color: 'bg-gray-400' }
            ].map((item, idx) => (
              <div key={idx} className="relative bg-white p-8 rounded-[40px] border border-gray-100 opacity-60">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-[40px] z-10 flex items-center justify-center">
                  <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">In Arrivo</span>
                </div>
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6`}><item.icon /></div>
                <h3 className="text-2xl font-black text-gray-400 uppercase">{item.title}</h3>
              </div>
            ))}
          </div>
        )}

        {/* VISTA SPORTELLI */}
        {currentView === 'sportelli' && (
          <div className="max-w-3xl mx-auto">
            {sportelliStep === 'choice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                <button onClick={() => { setSportelliRole('studente'); setSportelliStep('coming-soon'); }} className="p-10 bg-white rounded-[40px] shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all group">
                  <User className="w-16 h-16 mx-auto mb-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="block font-black uppercase text-xl text-gray-900">Sono uno Studente</span>
                </button>
                <button onClick={() => setSportelliStep('prof-pin')} className="p-10 bg-white rounded-[40px] shadow-xl border-2 border-transparent hover:border-violet-500 transition-all group">
                  <KeyRound className="w-16 h-16 mx-auto mb-4 text-violet-500 group-hover:scale-110 transition-transform" />
                  <span className="block font-black uppercase text-xl text-gray-900">Sono un Professore</span>
                </button>
              </div>
            )}

            {sportelliStep === 'prof-pin' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-violet-100">
                <div className="text-center mb-8">
                  <KeyRound className="w-12 h-12 text-violet-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black uppercase text-gray-900">Accesso Docenti</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase mt-2">Inserisci il PIN di gestione</p>
                </div>
                <form onSubmit={handleProfPinSubmit} className="space-y-4">
                  <input type="password" placeholder="•••••" value={profPinInput} onChange={e => setProfPinInput(e.target.value)} className="w-full p-6 bg-gray-50 rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:outline-violet-600" maxLength={5} autoFocus />
                  <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Verifica</button>
                  <button type="button" onClick={() => setSportelliStep('choice')} className="w-full text-xs font-black text-gray-400 uppercase">Indietro</button>
                </form>
              </motion.div>
            )}

            {sportelliStep === 'coming-soon' && (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-emerald-200">
                <BookOpen className="w-20 h-20 text-emerald-200 mx-auto mb-6" />
                <h2 className="text-4xl font-black uppercase text-gray-900">In Arrivo</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2">Il modulo {sportelliRole} è in fase di sviluppo</p>
              </div>
            )}
          </div>
        )}

        {/* VISTA BACHECA (Invariata ma pulita) */}
        {currentView === 'bacheca' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase text-gray-900">Bacheca</h2>
              {isAdmin && <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{showForm ? 'Annulla' : '+ Nuovo Avviso'}</button>}
            </div>
            {isAdmin && showForm && (
              <form onSubmit={submitNotice} className="bg-white p-8 rounded-[32px] shadow-xl border-l-8 border-violet-600 space-y-4">
                <div className="flex gap-4">
                  <select value={newNotice.category} onChange={e => setNewNotice({...newNotice, category: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-black text-violet-600 uppercase text-xs">
                    <option>Circolare</option><option>Evento</option><option>Importante</option>
                  </select>
                  <input type="text" required placeholder="Titolo dell'avviso" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-xl font-bold" />
                </div>
                <textarea required placeholder="Scrivi il testo dell'avviso..." value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl min-h-[150px]" />
                <button type="submit" className="w-full py-4 bg-violet-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg">Pubblica in Bacheca</button>
              </form>
            )}
            <div className="space-y-6">
              {notices.map(n => (
                <div key={n.id} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 h-full w-2 ${n.category === 'Importante' ? 'bg-red-500' : n.category === 'Evento' ? 'bg-emerald-500' : 'bg-violet-600'}`}></div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-black uppercase bg-gray-100 px-3 py-1 rounded-full text-gray-500 tracking-widest">{n.category}</span>
                    <span className="text-[10px] font-bold text-gray-300 uppercase">{n.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase text-gray-900 mb-2">{n.title}</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA IDEE (Invariata ma pulita) */}
        {currentView === 'idee' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase text-gray-900">Idee e Proposte</h2>
              <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-yellow-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{showForm ? 'Chiudi' : '+ Proponi Idea'}</button>
            </div>
            {showForm && (
              <form onSubmit={submitIdea} className="bg-white p-8 rounded-[32px] shadow-xl border border-yellow-100 space-y-4">
                <input type="text" required placeholder="Che idea hai?" value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl font-bold" />
                <textarea required placeholder="Spiegaci meglio la tua proposta..." value={newIdea.desc} onChange={e => setNewIdea({...newIdea, desc: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl min-h-[120px]" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase cursor-pointer">
                    <input type="checkbox" checked={newIdea.anonymous} onChange={e => setNewIdea({...newIdea, anonymous: e.target.checked})} className="w-5 h-5 accent-yellow-500" />
                    Pubblica in Anonimo
                  </label>
                  <button type="submit" className="px-10 py-4 bg-yellow-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg">Invia</button>
                </div>
              </form>
            )}
            <div className="grid gap-6">
              {ideas.map(i => (
                <div key={i.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex gap-6">
                  <div className="flex flex-col items-center gap-2 bg-gray-50 p-3 rounded-2xl min-w-[60px]">
                    <button onClick={() => {/* Logica upvote */}} className="text-gray-400 hover:text-emerald-500"><ThumbsUp className="w-5 h-5"/></button>
                    <span className="font-black text-xl">{i.upvotes?.length - i.downvotes?.length || 0}</span>
                    <button onClick={() => {/* Logica downvote */}} className="text-gray-400 hover:text-red-500"><ThumbsDown className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-black uppercase text-gray-900 leading-tight">{i.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{i.desc}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center text-[8px] font-black text-yellow-600 uppercase">S</div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Postato da: <span className="text-yellow-600">{i.authorName}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}