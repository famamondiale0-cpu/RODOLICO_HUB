import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Bell, Lightbulb, MessageSquare, ShieldCheck, User, ThumbsUp, ThumbsDown, ArrowLeft, Send, BookOpen, ChevronRight, Trophy, School, GraduationCap, KeyRound } from 'lucide-react';
import Auth from './components/Auth';

const GiglioIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-violet-600 fill-current`}><path d="M50 10c-5 15-15 20-15 35 0 10 5 15 15 15s15-5 15-15c0-15-10-20-15-35zM30 45c-10 0-15 5-15 15 0 15 15 20 20 30 5-10 10-15 10-25 0-10-5-20 15-20zM70 45c10 0 15 5 15 15 0 15-15 20-20 30-5-10-10-15-10-25 0-10-5-20 15-20z" /></svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Stati Profilo Studente
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileData, setProfileData] = useState({ nome: '', cognome: '', classe: '' });
  
  // Stati Sportelli
  const [sportelliStep, setSportelliStep] = useState('choice'); // 'choice', 'prof-pin', 'coming-soon'
  const [profPinInput, setProfPinInput] = useState('');
  const [sportelliRole, setSportelliRole] = useState(''); // 'student', 'prof'

  // Dati Firebase
  const [ideas, setIdeas] = useState([]);
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', desc: '', anonymous: false });
  const [newNotice, setNewNotice] = useState({ title: '', category: 'Circolare', content: '' });

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u) {
        try {
          await reload(u);
          setUser(u);
          const adminDoc = await getDoc(doc(db, 'admins', u.email.toLowerCase()));
          const isAdminUser = adminDoc.exists();
          setIsAdmin(isAdminUser);

          if (!isAdminUser) {
            const userProfile = await getDoc(doc(db, 'users', u.uid));
            if (!userProfile.exists()) setNeedsProfile(true);
            else setNeedsProfile(false);
          } else {
            setNeedsProfile(false);
          }

          onSnapshot(query(collection(db, 'ideas'), orderBy('createdAt', 'desc')), (snap) => setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
          onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        } catch (err) { console.error(err); setUser(u); setIsAdmin(false); }
      } else { setUser(null); setIsAdmin(false); }
      setLoading(false);
    });
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        nome: profileData.nome.trim(), cognome: profileData.cognome.trim(),
        classe: profileData.classe.toUpperCase().trim(), email: user.email,
        role: 'student', createdAt: serverTimestamp()
      });
      setNeedsProfile(false);
    } catch (err) { alert("Errore salvataggio profilo. Riprova."); }
    setLoading(false);
  };

  const handleProfPinSubmit = (e) => {
    e.preventDefault();
    if (profPinInput === '56789') {
      setSportelliRole('prof');
      setSportelliStep('coming-soon');
    } else {
      alert('PIN non valido. Riprovare.');
      setProfPinInput('');
    }
  };

  // Funzioni Firebase Idee/Avvisi (Invariate)
  const submitIdea = async (e) => {
    e.preventDefault();
    let authorDisplayName = user.displayName || user.email.split('@')[0];
    if (!isAdmin && !newIdea.anonymous) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const d = userDoc.data();
        authorDisplayName = `${d.nome} ${d.cognome} (${d.classe})`;
      }
    }
    await addDoc(collection(db, 'ideas'), { ...newIdea, authorId: user.uid, authorName: newIdea.anonymous ? 'Studente Anonimo' : authorDisplayName, upvotes: [], downvotes: [], createdAt: serverTimestamp() });
    setNewIdea({ title: '', desc: '', anonymous: false }); setShowForm(false);
  };

  const handleVote = async (ideaId, type, currentUpvotes, currentDownvotes) => {
    const ref = doc(db, 'ideas', ideaId);
    const hasUpvoted = currentUpvotes.includes(user.uid);
    const hasDownvoted = currentDownvotes.includes(user.uid);
    if (type === 'up') {
      if (hasUpvoted) await updateDoc(ref, { upvotes: arrayRemove(user.uid) });
      else { await updateDoc(ref, { upvotes: arrayUnion(user.uid) }); if (hasDownvoted) await updateDoc(ref, { downvotes: arrayRemove(user.uid) }); }
    } else {
      if (hasDownvoted) await updateDoc(ref, { downvotes: arrayRemove(user.uid) });
      else { await updateDoc(ref, { downvotes: arrayUnion(user.uid) }); if (hasUpvoted) await updateDoc(ref, { upvotes: arrayRemove(user.uid) }); }
    }
  };

  const submitNotice = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    await addDoc(collection(db, 'notices'), { ...newNotice, authorName: "Rappresentanti d'Istituto", createdAt: serverTimestamp() });
    setNewNotice({ title: '', category: 'Circolare', content: '' }); setShowForm(false);
  };

  if (loading) return <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="p-6 bg-white rounded-3xl shadow-xl"><GiglioIcon className="w-12 h-12" /></motion.div></div>;
  if (!user) return <Auth />;

  if (needsProfile) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-[48px] p-10 shadow-2xl shadow-violet-200/50 border border-white relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="mb-4 p-4 bg-violet-50 rounded-3xl text-violet-600"><User className="w-10 h-10"/></div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Chi sei?</h2>
            <p className="text-gray-400 text-sm font-semibold mt-2">Completa il tuo profilo per entrare.</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <input type="text" required placeholder="Nome" value={profileData.nome} onChange={e => setProfileData({...profileData, nome: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-[20px] font-medium" />
            <input type="text" required placeholder="Cognome" value={profileData.cognome} onChange={e => setProfileData({...profileData, cognome: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-[20px] font-medium" />
            <input type="text" required placeholder="Classe (es. 3A)" maxLength={3} value={profileData.classe} onChange={e => setProfileData({...profileData, classe: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-[20px] font-bold uppercase" />
            <button type="submit" className="w-full py-5 mt-4 bg-violet-600 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all">Avanza <ChevronRight className="inline w-5 h-5" /></button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-violet-50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-violet-100 border border-violet-50"><GiglioIcon className="w-7 h-7" /></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-gray-900 uppercase">Rodolico <span className="text-violet-600">Hub</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
            <div className="flex flex-col items-end hidden sm:flex mr-2">
              <span className="text-xs font-black text-gray-900">{user.displayName || user.email.split('@')[0]}</span>
              <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${isAdmin ? 'text-rose-500' : 'text-violet-500'}`}>
                {isAdmin ? <ShieldCheck className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                {isAdmin ? "Rappresentante" : "Studente"}
              </span>
            </div>
            <button onClick={() => signOut(auth)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView !== 'dashboard' && (
          <button onClick={() => {setCurrentView('dashboard'); setShowForm(false); setSportelliStep('choice');}} className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 uppercase hover:text-violet-600 transition-colors"><ArrowLeft className="w-4 h-4"/> Torna alla Dashboard</button>
        )}

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* SEZIONI ATTIVE */}
            <motion.div whileHover={{ y: -5 }} onClick={() => setCurrentView('bacheca')} className="cursor-pointer bg-white p-8 rounded-[40px] shadow-xl shadow-violet-100/30 border border-violet-50 group">
              <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Bell /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Bacheca</h3>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} onClick={() => setCurrentView('idee')} className="cursor-pointer bg-white p-8 rounded-[40px] shadow-xl shadow-yellow-100/30 border border-yellow-50 group">
              <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Lightbulb /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Idee</h3>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} onClick={() => setCurrentView('sportelli')} className="cursor-pointer bg-white p-8 rounded-[40px] shadow-xl shadow-emerald-100/30 border border-emerald-50 group">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><BookOpen /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Sportelli</h3>
            </motion.div>

            {/* SEZIONI IN ARRIVO */}
            {[
              { id: 'tornei', title: 'Tornei Scolastici', icon: Trophy, color: 'bg-rose-500', shadow: 'shadow-rose-100/30' },
              { id: 'scuola', title: 'Dentro la Scuola', icon: School, color: 'bg-blue-500', shadow: 'shadow-blue-100/30' },
              { id: 'forum', title: 'Forum Libero', icon: MessageSquare, color: 'bg-gray-400', shadow: 'shadow-gray-100/30' }
            ].map(item => (
              <div key={item.id} className="relative bg-white p-8 rounded-[40px] border border-gray-100 opacity-70">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-[40px] z-10 flex items-center justify-center">
                  <span className="bg-gray-900 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">In Arrivo</span>
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black uppercase text-gray-900 mb-2">Area Sportelli</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Seleziona il tuo ruolo per continuare</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => { setSportelliRole('student'); setSportelliStep('coming-soon'); }} className="bg-white p-10 rounded-[40px] shadow-xl shadow-emerald-100/30 border border-emerald-50 hover:border-emerald-500 transition-colors group flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform"><GraduationCap className="w-10 h-10"/></div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase">Sono uno Studente</h3>
                    <p className="text-sm text-gray-400 mt-2 font-medium">Prenota e visualizza le tue attività</p>
                  </button>
                  <button onClick={() => setSportelliStep('prof-pin')} className="bg-white p-10 rounded-[40px] shadow-xl shadow-violet-100/30 border border-violet-50 hover:border-violet-500 transition-colors group flex flex-col items-center">
                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform"><User className="w-10 h-10"/></div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase">Sono un Docente</h3>
                    <p className="text-sm text-gray-400 mt-2 font-medium">Gestisci i tuoi sportelli (Richiede PIN)</p>
                  </button>
                </div>
              </motion.div>
            )}

            {sportelliStep === 'prof-pin' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-violet-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-4"><KeyRound className="w-8 h-8"/></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Area Docenti</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Inserisci il PIN di sicurezza</p>
                </div>
                <form onSubmit={handleProfPinSubmit} className="space-y-4">
                  <input type="password" placeholder="•••••" value={profPinInput} onChange={e => setProfPinInput(e.target.value)} className="w-full p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:outline-violet-600 placeholder:tracking-normal" maxLength={5} autoFocus />
                  <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-violet-700 transition-all">Verifica PIN</button>
                  <button type="button" onClick={() => setSportelliStep('choice')} className="w-full text-xs font-black uppercase text-gray-400 hover:text-gray-600 mt-2">← Annulla</button>
                </form>
              </motion.div>
            )}

            {sportelliStep === 'coming-soon' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
                <div className="mb-6"><BookOpen className="w-20 h-20 mx-auto text-gray-300" /></div>
                <h2 className="text-4xl font-black uppercase text-gray-900">Sezione in Sviluppo</h2>
                <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest">Stiamo preparando questo modulo</p>
                <div className="mt-8 px-6 py-2 bg-gray-100 text-gray-600 rounded-full inline-block font-black text-xs uppercase">
                  Modalità: {sportelliRole === 'student' ? 'Studente (Prenotazioni)' : 'Docente (Gestione)'}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ... Logica Idee e Bacheca rimane uguale ... */}
        {currentView === 'idee' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-black uppercase text-gray-900 flex items-center gap-3"><Lightbulb className="text-yellow-500 w-8 h-8"/> Proposte</h2>
              <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-yellow-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{showForm ? 'Annulla' : '+ Nuova Idea'}</button>
            </div>
            {/* Form e Lista Idee come prima */}
            {showForm && (
              <form onSubmit={submitIdea} className="bg-white p-8 rounded-[32px] shadow-xl border border-yellow-100 space-y-4">
                <input type="text" required placeholder="Titolo dell'idea..." value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl focus:outline-yellow-500 font-bold" />
                <textarea required placeholder="Descrivi la proposta..." value={newIdea.desc} onChange={e => setNewIdea({...newIdea, desc: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl focus:outline-yellow-500 min-h-[120px]" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600"><input type="checkbox" checked={newIdea.anonymous} onChange={e => setNewIdea({...newIdea, anonymous: e.target.checked})} className="w-5 h-5 accent-yellow-500" /> Anonimo</label>
                  <button type="submit" className="px-8 py-4 bg-yellow-500 text-white rounded-xl font-black uppercase tracking-widest"><Send className="w-4 h-4 inline mr-2"/> Pubblica</button>
                </div>
              </form>
            )}
            <div className="space-y-4">
              {ideas.map(idea => (
                <div key={idea.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-2 bg-gray-50 p-2 rounded-2xl">
                    <button onClick={() => handleVote(idea.id, 'up', idea.upvotes, idea.downvotes)} className={`p-2 rounded-xl ${idea.upvotes.includes(user.uid) ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-200'}`}><ThumbsUp className="w-5 h-5"/></button>
                    <span className="font-black text-lg">{idea.upvotes.length - idea.downvotes.length}</span>
                    <button onClick={() => handleVote(idea.id, 'down', idea.upvotes, idea.downvotes)} className={`p-2 rounded-xl ${idea.downvotes.includes(user.uid) ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-200'}`}><ThumbsDown className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 mt-1">
                    <h4 className="text-xl font-black uppercase">{idea.title}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-3">Da: <span className="text-yellow-600">{idea.authorName}</span></p>
                    <p className="text-gray-600 text-sm">{idea.desc}</p>
                  </div>
                </div>
              ))}
              {ideas.length === 0 && <p className="text-center text-gray-400 font-bold py-12">Nessuna idea proposta al momento.</p>}
            </div>
          </div>
        )}

        {currentView === 'bacheca' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-3xl font-black uppercase text-gray-900 flex items-center gap-3"><Bell className="text-violet-600 w-8 h-8"/> Bacheca</h2>
              {isAdmin && <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{showForm ? 'Annulla' : '+ Crea Avviso'}</button>}
            </div>
            {isAdmin && showForm && (
              <form onSubmit={submitNotice} className="bg-white p-8 rounded-[32px] shadow-xl border-l-4 border-l-violet-500 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <select value={newNotice.category} onChange={e => setNewNotice({...newNotice, category: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-black text-violet-600 uppercase text-sm border">
                    <option>Circolare</option><option>Evento</option><option>Importante</option>
                  </select>
                  <input type="text" required placeholder="Titolo Avviso" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-xl font-bold border" />
                </div>
                <textarea required placeholder="Contenuto..." value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl min-h-[120px] border" />
                <div className="flex justify-end"><button type="submit" className="px-8 py-4 bg-violet-600 text-white rounded-xl font-black uppercase tracking-widest"><Send className="w-4 h-4 inline mr-2"/> Pubblica</button></div>
              </form>
            )}
            <div className="grid gap-6">
              {notices.map(notice => (
                <div key={notice.id} className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${notice.category === 'Importante' ? 'bg-red-500' : notice.category === 'Evento' ? 'bg-emerald-500' : 'bg-violet-500'}`}></div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${notice.category === 'Importante' ? 'bg-red-50 text-red-600' : notice.category === 'Evento' ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}`}>{notice.category}</span>
                    <span className="text-xs text-gray-400 font-bold">{notice.createdAt?.toDate().toLocaleDateString('it-IT')}</span>
                  </div>
                  <h4 className="text-2xl font-black uppercase mb-2">{notice.title}</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{notice.content}</p>
                </div>
              ))}
              {notices.length === 0 && <p className="text-center text-gray-400 font-bold py-12">Nessun avviso in bacheca.</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}