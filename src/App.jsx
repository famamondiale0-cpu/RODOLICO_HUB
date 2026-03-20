import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Bell, Lightbulb, MessageSquare, ShieldCheck, 
  User, ThumbsUp, ThumbsDown, ArrowLeft, Send, 
  ChevronRight, Trophy, School, GraduationCap, KeyRound, BookOpen, Sparkles
} from 'lucide-react';
import Auth from './components/Auth';

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
  
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileData, setProfileData] = useState({ nome: '', cognome: '', classe: '' });
  
  const [sportelliStep, setSportelliStep] = useState('choice'); 
  const [profPinInput, setProfPinInput] = useState('');
  const [sportelliRole, setSportelliRole] = useState('');

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
        const adminDoc = await getDoc(doc(db, 'admins', u.email.toLowerCase().trim()));
        const isAdminUser = adminDoc.exists();
        setIsAdmin(isAdminUser);

        if (!isAdminUser) {
          const userProfile = await getDoc(doc(db, 'users', u.uid));
          if (!userProfile.exists()) {
            setNeedsProfile(true);
          } else {
            setNeedsProfile(false);
          }
        } else {
          setNeedsProfile(false);
        }

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

  const handleVote = async (ideaId, type, currentUpvotes = [], currentDownvotes = []) => {
    const ref = doc(db, 'ideas', ideaId);
    const hasUpvoted = currentUpvotes.includes(user.uid);
    const hasDownvoted = currentDownvotes.includes(user.uid);
    
    if (type === 'up') {
      if (hasUpvoted) await updateDoc(ref, { upvotes: arrayRemove(user.uid) });
      else { 
        await updateDoc(ref, { upvotes: arrayUnion(user.uid) }); 
        if (hasDownvoted) await updateDoc(ref, { downvotes: arrayRemove(user.uid) }); 
      }
    } else {
      if (hasDownvoted) await updateDoc(ref, { downvotes: arrayRemove(user.uid) });
      else { 
        await updateDoc(ref, { downvotes: arrayUnion(user.uid) }); 
        if (hasUpvoted) await updateDoc(ref, { upvotes: arrayRemove(user.uid) }); 
      }
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-white to-violet-50 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
        <GiglioIcon className="w-16 h-16" />
      </motion.div>
    </div>
  );

  if (!user) return <Auth />;

  if (needsProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-white to-violet-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-white rounded-[40px] p-12 shadow-2xl text-center border border-violet-100"
          style={{ boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.15)' }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-violet-50 rounded-3xl flex items-center justify-center text-violet-600 mx-auto mb-8 shadow-lg shadow-violet-200/50">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <User className="w-12 h-12" />
            </motion.div>
          </div>
          <h2 className="text-4xl font-black uppercase text-gray-900 mb-2 tracking-tighter">Quasi fatto!</h2>
          <p className="text-sm font-bold text-gray-500 uppercase mb-10 tracking-widest">✨ Completa il tuo profilo studente</p>
          
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <motion.input 
              whileFocus={{ scale: 1.02 }}
              type="text" 
              required 
              placeholder="Nome" 
              value={profileData.nome} 
              onChange={e => setProfileData({...profileData, nome: e.target.value})} 
              className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all font-medium text-gray-900" 
            />
            <motion.input 
              whileFocus={{ scale: 1.02 }}
              type="text" 
              required 
              placeholder="Cognome" 
              value={profileData.cognome} 
              onChange={e => setProfileData({...profileData, cognome: e.target.value})} 
              className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all font-medium text-gray-900" 
            />
            <motion.input 
              whileFocus={{ scale: 1.02 }}
              type="text" 
              required 
              placeholder="Classe (es. 4G)" 
              maxLength={3} 
              value={profileData.classe} 
              onChange={e => setProfileData({...profileData, classe: e.target.value})} 
              className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all font-black uppercase text-center text-lg text-gray-900" 
            />
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full py-5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:shadow-2xl hover:shadow-violet-300 transition-all flex items-center justify-center gap-2 mt-6"
            >
              Avanza <ChevronRight className="w-5 h-5" />
            </motion.button>
          </form>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            onClick={() => signOut(auth)} 
            className="mt-10 text-[11px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            Esci dall'account
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-white to-violet-50 flex flex-col font-sans">
      <nav className="bg-white/70 backdrop-blur-xl border-b border-violet-50/50 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4 cursor-pointer" 
            onClick={() => setCurrentView('dashboard')}
          >
            <GiglioIcon className="w-8 h-8" />
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Rodolico <span className="bg-gradient-to-r from-violet-600 to-violet-700 bg-clip-text text-transparent">Hub</span></h1>
          </motion.div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-black text-gray-900 uppercase">{isAdmin ? "👤 Admin Rappresentante" : "👨‍🎓 Area Studenti"}</span>
              <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">{user.email}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut(auth)} 
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-lg"
            >
              <LogOut className="w-5 h-5"/>
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView !== 'dashboard' && (
          <motion.button 
            whileHover={{ x: -5 }}
            onClick={() => {setCurrentView('dashboard'); setSportelliStep('choice'); setShowForm(false);}} 
            className="mb-10 flex items-center gap-2 text-xs font-black text-gray-400 uppercase hover:text-violet-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4"/> Torna alla Dashboard
          </motion.button>
        )}

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{y:-8, boxShadow: "0 20px 40px rgba(139, 92, 246, 0.2)"}} 
              onClick={() => setCurrentView('bacheca')} 
              className="cursor-pointer bg-white p-8 rounded-[40px] shadow-lg border border-violet-50 group transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-50 rounded-3xl flex items-center justify-center text-violet-600 mb-6 group-hover:scale-110 transition-transform shadow-md shadow-violet-200/50">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Bacheca</h3>
            </motion.div>

            <motion.div 
              whileHover={{y:-8, boxShadow: "0 20px 40px rgba(234, 179, 8, 0.2)"}} 
              onClick={() => setCurrentView('idee')} 
              className="cursor-pointer bg-white p-8 rounded-[40px] shadow-lg border border-yellow-50 group transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-3xl flex items-center justify-center text-yellow-500 mb-6 group-hover:scale-110 transition-transform shadow-md shadow-yellow-200/50">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Idee</h3>
            </motion.div>

            <motion.div 
              whileHover={{y:-8, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.2)"}} 
              onClick={() => setCurrentView('sportelli')} 
              className="cursor-pointer bg-white p-8 rounded-[40px] shadow-lg border border-emerald-50 group transition-all"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform shadow-md shadow-emerald-200/50">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Sportelli</h3>
            </motion.div>

            {[
              { title: 'Tornei Scolastici', icon: Trophy, color: 'bg-rose-500', shadowColor: 'shadow-rose-200/50' },
              { title: 'Dentro la Scuola', icon: School, color: 'bg-blue-500', shadowColor: 'shadow-blue-200/50' },
              { title: 'Forum Libero', icon: MessageSquare, color: 'bg-slate-400', shadowColor: 'shadow-slate-200/50' }
            ].map((item, idx) => (
              <div key={idx} className="relative bg-white p-8 rounded-[40px] border border-gray-100 shadow-lg overflow-hidden group">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-sm rounded-[40px] z-10 flex items-center justify-center"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-gradient-to-r from-violet-600 to-violet-700 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg"
                  >
                    ✨ In Arrivo
                  </motion.span>
                </motion.div>
                <div className={`w-16 h-16 ${item.color} rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg ${item.shadowColor}`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase">{item.title}</h3>
              </div>
            ))}
          </div>
        )}

        {currentView === 'sportelli' && (
          <div className="max-w-3xl mx-auto">
            {sportelliStep === 'choice' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10"
              >
                <motion.button 
                  whileHover={{y:-8}}
                  onClick={() => { setSportelliRole('studente'); setSportelliStep('coming-soon'); }} 
                  className="p-12 bg-white rounded-[40px] shadow-lg border-2 border-transparent hover:border-emerald-500 transition-all group"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md shadow-emerald-200/50">
                    <User className="w-10 h-10" />
                  </div>
                  <span className="block font-black uppercase text-xl text-gray-900">Sono uno Studente</span>
                </motion.button>
                
                <motion.button 
                  whileHover={{y:-8}}
                  onClick={() => setSportelliStep('prof-pin')} 
                  className="p-12 bg-white rounded-[40px] shadow-lg border-2 border-transparent hover:border-violet-500 transition-all group"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-50 rounded-3xl flex items-center justify-center text-violet-600 mx-auto mb-6 group-hover:scale-110 transition-transform shadow-md shadow-violet-200/50">
                    <KeyRound className="w-10 h-10" />
                  </div>
                  <span className="block font-black uppercase text-xl text-gray-900">Sono un Professore</span>
                </motion.button>
              </motion.div>
            )}

            {sportelliStep === 'prof-pin' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-md mx-auto bg-white p-12 rounded-[40px] shadow-2xl border border-violet-100"
                style={{ boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.15)' }}
              >
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-50 rounded-3xl flex items-center justify-center text-violet-600 mx-auto mb-4 shadow-lg shadow-violet-200/50">
                    <KeyRound className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-black uppercase text-gray-900">Accesso Docenti</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase mt-3 tracking-widest">🔐 Inserisci il PIN di gestione</p>
                </div>
                <form onSubmit={handleProfPinSubmit} className="space-y-5">
                  <motion.input 
                    whileFocus={{ scale: 1.02 }}
                    type="password" 
                    placeholder="•••••" 
                    value={profPinInput} 
                    onChange={e => setProfPinInput(e.target.value)} 
                    className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-2xl text-center text-4xl font-black tracking-[0.5em] focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all" 
                    maxLength={5} 
                    autoFocus 
                  />
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full py-5 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:shadow-2xl transition-all"
                  >
                    Verifica
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    type="button" 
                    onClick={() => setSportelliStep('choice')} 
                    className="w-full py-3 text-xs font-black text-gray-400 uppercase hover:text-violet-600 transition-colors"
                  >
                    ← Indietro
                  </motion.button>
                </form>
              </motion.div>
            )}

            {sportelliStep === 'coming-soon' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 bg-white rounded-[40px] border border-dashed border-emerald-200 shadow-lg"
              >
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                  <BookOpen className="w-24 h-24 text-emerald-200 mx-auto mb-8" />
                </motion.div>
                <h2 className="text-5xl font-black uppercase text-gray-900 mb-3">In Arrivo</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Il modulo <span className="text-emerald-500 font-black">{sportelliRole}</span> è in fase di sviluppo</p>
              </motion.div>
            )}
          </div>
        )}

        {currentView === 'bacheca' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-black uppercase text-gray-900">Bacheca</motion.h2>
              {isAdmin && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowForm(!showForm)} 
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-200 hover:shadow-xl transition-all"
                >
                  {showForm ? '✕ Annulla' : '+ Nuovo Avviso'}
                </motion.button>
              )}
            </div>
            {isAdmin && showForm && (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={submitNotice} 
                className="bg-white p-10 rounded-[32px] shadow-xl border-l-8 border-violet-600 space-y-5"
              >
                <div className="flex gap-4">
                  <select 
                    value={newNotice.category} 
                    onChange={e => setNewNotice({...newNotice, category: e.target.value})} 
                    className="p-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-xl font-black text-violet-600 uppercase text-xs focus:outline-none focus:border-violet-600"
                  >
                    <option>Circolare</option>
                    <option>Evento</option>
                    <option>Importante</option>
                  </select>
                  <motion.input 
                    whileFocus={{ scale: 1.02 }}
                    type="text" 
                    required 
                    placeholder="Titolo dell'avviso" 
                    value={newNotice.title} 
                    onChange={e => setNewNotice({...newNotice, title: e.target.value})} 
                    className="flex-1 p-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all"
                  />
                </div>
                <motion.textarea 
                  whileFocus={{ scale: 1.02 }}
                  required 
                  placeholder="Scrivi il testo dell'avviso..." 
                  value={newNotice.content} 
                  onChange={e => setNewNotice({...newNotice, content: e.target.value})} 
                  className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-xl min-h-[150px] focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200 transition-all resize-none"
                />
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-violet-200 hover:shadow-2xl transition-all"
                >
                  Pubblica in Bacheca
                </motion.button>
              </motion.form>
            )}
            <div className="space-y-6">
              {notices.map(n => (
                <motion.div 
                  key={n.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all"
                >
                  <div className={`absolute left-0 top-0 h-full w-1.5 ${n.category === 'Importante' ? 'bg-red-500' : n.category === 'Evento' ? 'bg-emerald-500' : 'bg-violet-600'}`}></div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest ${n.category === 'Importante' ? 'bg-red-100 text-red-600' : n.category === 'Evento' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600'}`}>
                      {n.category}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{n.createdAt?.toDate().toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase text-gray-900 mb-3">{n.title}</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'idee' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl font-black uppercase text-gray-900">Idee e Proposte</motion.h2>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowForm(!showForm)} 
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-yellow-200 hover:shadow-xl transition-all"
              >
                {showForm ? '✕ Chiudi' : '💡 Proponi Idea'}
              </motion.button>
            </div>
            {showForm && (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={submitIdea} 
                className="bg-white p-10 rounded-[32px] shadow-xl border border-yellow-100 space-y-5"
              >
                <motion.input 
                  whileFocus={{ scale: 1.02 }}
                  type="text" 
                  required 
                  placeholder="Che idea hai?" 
                  value={newIdea.title} 
                  onChange={e => setNewIdea({...newIdea, title: e.target.value})} 
                  className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
                />
                <motion.textarea 
                  whileFocus={{ scale: 1.02 }}
                  required 
                  placeholder="Spiegaci meglio la tua proposta..." 
                  value={newIdea.desc} 
                  onChange={e => setNewIdea({...newIdea, desc: e.target.value})} 
                  className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-50 border border-gray-200 rounded-xl min-h-[120px] focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all resize-none"
                />
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-3 text-xs font-black text-gray-600 uppercase cursor-pointer hover:text-yellow-600 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={newIdea.anonymous} 
                      onChange={e => setNewIdea({...newIdea, anonymous: e.target.checked})} 
                      className="w-5 h-5 accent-yellow-500 cursor-pointer rounded" 
                    />
                    Pubblica in Anonimo
                  </label>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    type="submit" 
                    className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-yellow-200 hover:shadow-xl transition-all"
                  >
                    Invia
                  </motion.button>
                </div>
              </motion.form>
            )}
            <div className="grid gap-6">
              {ideas.map(i => (
                <motion.div 
                  key={i.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100 flex gap-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-gray-50 to-gray-50 p-4 rounded-2xl min-w-[70px] shadow-sm border border-gray-100">
                    <motion.button 
                      whileHover={{ scale: 1.2 }}
                      onClick={() => handleVote(i.id, 'up', i.upvotes, i.downvotes)} 
                      className={`transition-all ${i.upvotes?.includes(user?.uid) ? 'text-emerald-500 scale-110' : 'text-gray-400 hover:text-emerald-500'}`}
                    >
                      <ThumbsUp className="w-6 h-6"/>
                    </motion.button>
                    <span className="font-black text-lg text-gray-900">{(i.upvotes?.length || 0) - (i.downvotes?.length || 0)}</span>
                    <motion.button 
                      whileHover={{ scale: 1.2 }}
                      onClick={() => handleVote(i.id, 'down', i.upvotes, i.downvotes)} 
                      className={`transition-all ${i.downvotes?.includes(user?.uid) ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500'}`}
                    >
                      <ThumbsDown className="w-6 h-6"/>
                    </motion.button>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-xl font-black uppercase text-gray-900 leading-tight">{i.title}</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{i.desc}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center text-[8px] font-black text-yellow-600 uppercase shadow-sm">S</div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Postato da: <span className="text-yellow-600 font-black">{i.authorName}</span></span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
