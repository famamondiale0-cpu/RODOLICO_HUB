import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, Bell, Lightbulb, MessageSquare, ShieldCheck, User, ThumbsUp, ThumbsDown, ArrowLeft, Send } from 'lucide-react';
import Auth from './components/Auth';

const GiglioIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-violet-600 fill-current`}><path d="M50 10c-5 15-15 20-15 35 0 10 5 15 15 15s15-5 15-15c0-15-10-20-15-35zM30 45c-10 0-15 5-15 15 0 15 15 20 20 30 5-10 10-15 10-25 0-10-5-20-15-20zM70 45c10 0 15 5 15 15 0 15-15 20-20 30-5-10-10-15-10-25 0-10-5-20 15-20z" /></svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, bacheca, idee
  
  // Dati Firebase
  const [ideas, setIdeas] = useState([]);
  const [notices, setNotices] = useState([]);
  
  // Form State
  const [newIdea, setNewIdea] = useState({ title: '', desc: '', anonymous: false });
  const [newNotice, setNewNotice] = useState({ title: '', category: 'Circolare', content: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const adminDoc = await getDoc(doc(db, 'admins', u.email.toLowerCase()));
        setIsAdmin(adminDoc.exists());

        // Carica Idee
        const qIdee = query(collection(db, 'ideas'), orderBy('createdAt', 'desc'));
        onSnapshot(qIdee, (snap) => setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        
        // Carica Avvisi
        const qAvvisi = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
        onSnapshot(qAvvisi, (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      } else { setUser(null); setIsAdmin(false); }
    });
  }, []);

  // --- LOGICA IDEE ---
  const submitIdea = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'ideas'), {
      ...newIdea,
      authorId: user.uid,
      authorName: newIdea.anonymous ? 'Studente Anonimo' : (user.displayName || user.email.split('@')[0]),
      upvotes: [], downvotes: [],
      createdAt: serverTimestamp()
    });
    setNewIdea({ title: '', desc: '', anonymous: false });
    setShowForm(false);
  };

  const handleVote = async (ideaId, type, currentUpvotes, currentDownvotes) => {
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

  // --- LOGICA AVVISI (Solo Admin) ---
  const submitNotice = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    await addDoc(collection(db, 'notices'), {
      ...newNotice, authorName: user.email.split('@')[0], createdAt: serverTimestamp()
    });
    setNewNotice({ title: '', category: 'Circolare', content: '' });
    setShowForm(false);
  };

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      {/* NAVBAR */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-violet-50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-violet-100 border border-violet-50"><GiglioIcon className="w-7 h-7" /></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-gray-900 uppercase">Rodolico <span className="text-violet-600">Hub</span></h1>
              <p className="text-[9px] text-violet-400 uppercase tracking-widest font-black">Liceo Scientifico</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
            <div className="flex flex-col items-end hidden sm:flex mr-2">
              <span className="text-xs font-black text-gray-900">{user.displayName || user.email.split('@')[0]}</span>
              {/* ETICHETTA RUOLO PRECISA */}
              <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${isAdmin ? 'text-rose-500' : 'text-violet-500'}`}>
                {isAdmin ? <ShieldCheck className="w-3 h-3"/> : <User className="w-3 h-3"/>}
                {isAdmin ? "Rappresentante d'Istituto" : "Studente"}
              </span>
            </div>
            <button onClick={() => signOut(auth)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </nav>

      {/* CONTENUTO */}
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView !== 'dashboard' && (
          <button onClick={() => {setCurrentView('dashboard'); setShowForm(false);}} className="mb-8 flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-violet-600 transition-colors"><ArrowLeft className="w-4 h-4"/> Torna alla Dashboard</button>
        )}

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} onClick={() => setCurrentView('bacheca')} className="cursor-pointer bg-white p-10 rounded-[40px] shadow-xl shadow-violet-100/30 border border-violet-50 group">
              <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Bell /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Bacheca</h3>
              <p className="text-sm text-gray-400 mt-2 font-medium">Circolari e avvisi dai rappresentanti.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} onClick={() => setCurrentView('idee')} className="cursor-pointer bg-white p-10 rounded-[40px] shadow-xl shadow-yellow-100/30 border border-yellow-50 group">
              <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform"><Lightbulb /></div>
              <h3 className="text-2xl font-black text-gray-900 uppercase">Idee</h3>
              <p className="text-sm text-gray-400 mt-2 font-medium">Proponi e vota iniziative studentesche.</p>
            </motion.div>

            {/* FORUM DISABILITATO */}
            <motion.div className="relative bg-white p-10 rounded-[40px] border border-gray-100 opacity-60">
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] rounded-[40px] z-10 flex items-center justify-center">
                <span className="bg-gray-900 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">In Arrivo</span>
              </div>
              <div className="w-14 h-14 bg-gray-300 rounded-2xl flex items-center justify-center text-white mb-6"><MessageSquare /></div>
              <h3 className="text-2xl font-black text-gray-400 uppercase">Forum</h3>
              <p className="text-sm text-gray-400 mt-2 font-medium">Spazio di discussione libera.</p>
            </motion.div>
          </div>
        )}

        {/* VISTA IDEE */}
        {currentView === 'idee' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase text-gray-900 flex items-center gap-3"><Lightbulb className="text-yellow-500 w-8 h-8"/> Proposte Studenti</h2>
              <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-yellow-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-yellow-200">{showForm ? 'Annulla' : '+ Nuova Idea'}</button>
            </div>

            {showForm && (
              <form onSubmit={submitIdea} className="bg-white p-8 rounded-[32px] shadow-xl border border-yellow-100 space-y-4">
                <input type="text" required placeholder="Titolo dell'idea..." value={newIdea.title} onChange={e => setNewIdea({...newIdea, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl focus:outline-yellow-500 font-bold" />
                <textarea required placeholder="Descrivi la tua proposta nel dettaglio..." value={newIdea.desc} onChange={e => setNewIdea({...newIdea, desc: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl focus:outline-yellow-500 min-h-[120px]" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={newIdea.anonymous} onChange={e => setNewIdea({...newIdea, anonymous: e.target.checked})} className="w-5 h-5 accent-yellow-500" />
                    Invia in modo anonimo
                  </label>
                  <button type="submit" className="px-8 py-4 bg-yellow-500 text-white rounded-xl font-black uppercase tracking-widest flex items-center gap-2"><Send className="w-4 h-4"/> Pubblica</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {ideas.map(idea => (
                <div key={idea.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex gap-6 items-start">
                  <div className="flex flex-col items-center gap-2 bg-gray-50 p-2 rounded-2xl">
                    <button onClick={() => handleVote(idea.id, 'up', idea.upvotes, idea.downvotes)} className={`p-2 rounded-xl transition-colors ${idea.upvotes.includes(user.uid) ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-200'}`}><ThumbsUp className="w-5 h-5"/></button>
                    <span className="font-black text-lg text-gray-900">{idea.upvotes.length - idea.downvotes.length}</span>
                    <button onClick={() => handleVote(idea.id, 'down', idea.upvotes, idea.downvotes)} className={`p-2 rounded-xl transition-colors ${idea.downvotes.includes(user.uid) ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-200'}`}><ThumbsDown className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-gray-900 uppercase">{idea.title}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-3">Proposto da: <span className="text-yellow-600">{idea.authorName}</span></p>
                    <p className="text-gray-600 leading-relaxed">{idea.desc}</p>
                  </div>
                </div>
              ))}
              {ideas.length === 0 && <p className="text-center text-gray-400 font-bold py-12">Nessuna idea proposta al momento.</p>}
            </div>
          </div>
        )}

        {/* VISTA BACHECA */}
        {currentView === 'bacheca' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black uppercase text-gray-900 flex items-center gap-3"><Bell className="text-violet-600 w-8 h-8"/> Bacheca Ufficiale</h2>
              {isAdmin && <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-200">{showForm ? 'Annulla' : '+ Crea Avviso'}</button>}
            </div>

            {isAdmin && showForm && (
              <form onSubmit={submitNotice} className="bg-white p-8 rounded-[32px] shadow-xl border border-violet-100 space-y-4 border-l-4 border-l-violet-500">
                <div className="flex gap-4">
                  <select value={newNotice.category} onChange={e => setNewNotice({...newNotice, category: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-black text-violet-600 focus:outline-violet-500 uppercase text-sm">
                    <option>Circolare</option><option>Evento</option><option>Importante</option>
                  </select>
                  <input type="text" required placeholder="Titolo Avviso" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-xl focus:outline-violet-500 font-bold" />
                </div>
                <textarea required placeholder="Contenuto dell'avviso..." value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl focus:outline-violet-500 min-h-[120px]" />
                <div className="flex justify-end"><button type="submit" className="px-8 py-4 bg-violet-600 text-white rounded-xl font-black uppercase tracking-widest flex items-center gap-2"><Send className="w-4 h-4"/> Pubblica in Bacheca</button></div>
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
                  <h4 className="text-2xl font-black text-gray-900 uppercase mb-2">{notice.title}</h4>
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