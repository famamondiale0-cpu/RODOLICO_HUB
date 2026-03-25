import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Bell, Lightbulb, MessageSquare, ShieldCheck, 
  User, ThumbsUp, ThumbsDown, ArrowLeft, Send, 
  ChevronRight, Trophy, School, GraduationCap, KeyRound, 
  BookOpen, Calendar, MapPin, Users, CheckCircle
} from 'lucide-react';
import Auth from './components/Auth';

const GiglioIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={`${className} text-violet-600 fill-current`}>
    <path d="M50 10c-5 15-15 20-15 35 0 10 5 15 15 15s15-5 15-15c0-15-10-20-15-35zM30 45c-10 0-15 5-15 15 0 15 15 20 20 30 5-10 10-15 10-25 0-10-5-20 15-20zM70 45c10 0 15 5 15 15 0 15-15 20-20 30-5-10-10-15-10-25 0-10-5-20 15-20z" />
  </svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null); // NUOVO: Salva i dati profilo dello studente
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileData, setProfileData] = useState({ nome: '', cognome: '', classe: '' });
  
  // STATI SPORTELLI
  const [sportelliStep, setSportelliStep] = useState('choice'); 
  const [profPinInput, setProfPinInput] = useState('');
  const [sportelli, setSportelli] = useState([]);
  const [showSportelloForm, setShowSportelloForm] = useState(false);
  const [newSportello, setNewSportello] = useState({ prof: '', materia: '', aula: '', dataOra: '', maxStudenti: 10 });
  const [bookingSportelloId, setBookingSportelloId] = useState(null);
  const [bookingNote, setBookingNote] = useState('');

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
            setCurrentUserData(userProfile.data()); // Salviamo i dati per poterli usare nelle prenotazioni
          }
        } else {
          setNeedsProfile(false);
        }

        // Listener Bacheca e Idee
        onSnapshot(query(collection(db, 'ideas'), orderBy('createdAt', 'desc')), (snap) => setIdeas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')), (snap) => setNotices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        
        // Listener Sportelli
        onSnapshot(query(collection(db, 'sportelli'), orderBy('createdAt', 'desc')), (snap) => setSportelli(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

      } else {
        setUser(null);
        setIsAdmin(false);
        setCurrentUserData(null);
      }
      setLoading(false);
    });
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.nome || !profileData.cognome || !profileData.classe) return;
    
    try {
      const newData = {
        nome: profileData.nome.trim(),
        cognome: profileData.cognome.trim(),
        classe: profileData.classe.toUpperCase().trim(),
        email: user.email,
        role: 'student',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), newData);
      setCurrentUserData(newData);
      setNeedsProfile(false);
    } catch (err) {
      alert("Errore durante il salvataggio. Riprova.");
    }
  };

  // ---- FUNZIONI SPORTELLI ----
  const handleProfPinSubmit = (e) => {
    e.preventDefault();
    if (profPinInput === '56789') {
      setSportelliStep('prof-dashboard');
      setProfPinInput('');
    } else {
      alert('PIN errato! Accesso negato.');
      setProfPinInput('');
    }
  };

  const handleCreateSportello = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'sportelli'), {
      ...newSportello,
      maxStudenti: parseInt(newSportello.maxStudenti),
      prenotazioni: [],
      createdAt: serverTimestamp()
    });
    setNewSportello({ prof: '', materia: '', aula: '', dataOra: '', maxStudenti: 10 });
    setShowSportelloForm(false);
  };

  const handleBookSportello = async (sportelloId) => {
    if (!bookingNote.trim()) return alert("Devi specificare l'argomento su cui hai difficoltà!");
    
    const studenteInfo = {
      uid: user.uid,
      nome: `${currentUserData?.nome || 'Studente'} ${currentUserData?.cognome || ''} (${currentUserData?.classe || ''})`,
      note: bookingNote
    };

    await updateDoc(doc(db, 'sportelli', sportelloId), {
      prenotazioni: arrayUnion(studenteInfo)
    });
    
    setBookingSportelloId(null);
    setBookingNote('');
  };

  // ---- FUNZIONI IDEE & BACHECA ----
  const submitIdea = async (e) => {
    e.preventDefault();
    let authorName = "Studente Anonimo";
    if (!newIdea.anonymous) {
      if (isAdmin) authorName = "Rappresentante";
      else if (currentUserData) authorName = `${currentUserData.nome} ${currentUserData.cognome} (${currentUserData.classe})`;
    }
    await addDoc(collection(db, 'ideas'), {
      ...newIdea, authorId: user.uid, authorName, upvotes: [], downvotes: [],
      status: isAdmin ? 'approved' : 'pending', createdAt: serverTimestamp()
    });
    setNewIdea({ title: '', desc: '', anonymous: false }); setShowForm(false);
  };

  const handleApproveIdea = async (ideaId) => await updateDoc(doc(db, 'ideas', ideaId), { status: 'approved' });
  const handleRejectIdea = async (ideaId) => await updateDoc(doc(db, 'ideas', ideaId), { status: 'rejected' });

  const handleVote = async (ideaId, type, currentUpvotes = [], currentDownvotes = []) => {
    const ref = doc(db, 'ideas', ideaId);
    const hasUp = currentUpvotes.includes(user.uid); const hasDown = currentDownvotes.includes(user.uid);
    if (type === 'up') {
      if (hasUp) await updateDoc(ref, { upvotes: arrayRemove(user.uid) });
      else { await updateDoc(ref, { upvotes: arrayUnion(user.uid) }); if (hasDown) await updateDoc(ref, { downvotes: arrayRemove(user.uid) }); }
    } else {
      if (hasDown) await updateDoc(ref, { downvotes: arrayRemove(user.uid) });
      else { await updateDoc(ref, { downvotes: arrayUnion(user.uid) }); if (hasUp) await updateDoc(ref, { upvotes: arrayRemove(user.uid) }); }
    }
  };

  const submitNotice = async (e) => {
    e.preventDefault(); if (!isAdmin) return;
    await addDoc(collection(db, 'notices'), { ...newNotice, createdAt: serverTimestamp() });
    setNewNotice({ title: '', category: 'Circolare', content: '' }); setShowForm(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}><GiglioIcon className="w-12 h-12" /></motion.div>
    </div>
  );

  if (!user) return <Auth />;

  if (needsProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl text-center border border-violet-100">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mx-auto mb-6"><User className="w-8 h-8" /></div>
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

  const visibleIdeas = ideas.filter(i => {
    const status = i.status || 'approved';
    if (isAdmin) return status !== 'rejected';
    return status === 'approved' || i.authorId === user?.uid;
  });

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
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
          </div>
        )}

        {currentView === 'sportelli' && (
          <div className="max-w-4xl mx-auto">
            {sportelliStep === 'choice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10">
                <button onClick={() => { setSportelliStep('studente'); }} className="p-10 bg-white rounded-[40px] shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all group text-center">
                  <User className="w-16 h-16 mx-auto mb-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="block font-black uppercase text-xl text-gray-900">Area Studenti</span>
                  <span className="block text-xs text-gray-400 font-bold mt-2 uppercase">Prenota uno sportello</span>
                </button>
                <button onClick={() => setSportelliStep('prof-pin')} className="p-10 bg-white rounded-[40px] shadow-xl border-2 border-transparent hover:border-violet-500 transition-all group text-center">
                  <KeyRound className="w-16 h-16 mx-auto mb-4 text-violet-500 group-hover:scale-110 transition-transform" />
                  <span className="block font-black uppercase text-xl text-gray-900">Area Docenti</span>
                  <span className="block text-xs text-gray-400 font-bold mt-2 uppercase">Gestisci i tuoi sportelli</span>
                </button>
              </div>
            )}

            {/* SEZIONE LOG-IN PROFESSORE */}
            {sportelliStep === 'prof-pin' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-violet-100">
                <div className="text-center mb-8">
                  <KeyRound className="w-12 h-12 text-violet-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black uppercase text-gray-900">Accesso Docenti</h3>
                  <p className="text-gray-400 font-bold text-xs uppercase mt-2">Inserisci il PIN di gestione</p>
                </div>
                <form onSubmit={handleProfPinSubmit} className="space-y-4">
                  <input type="password" placeholder="•••••" value={profPinInput} onChange={e => setProfPinInput(e.target.value)} className="w-full p-6 bg-gray-50 rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:outline-violet-600 outline-none transition-colors border border-transparent focus:border-violet-100" maxLength={5} autoFocus />
                  <button type="submit" className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Verifica PIN</button>
                  <button type="button" onClick={() => setSportelliStep('choice')} className="w-full text-xs font-black text-gray-400 uppercase pt-4 hover:text-violet-600">Indietro</button>
                </form>
              </motion.div>
            )}

            {/* DASHBOARD PROFESSORE */}
            {sportelliStep === 'prof-dashboard' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                  <div>
                    <h2 className="text-2xl font-black uppercase text-gray-900 flex items-center gap-3">
                      <GraduationCap className="w-8 h-8 text-emerald-500" /> Area Gestione Docenti
                    </h2>
                    <p className="text-xs text-gray-500 font-bold uppercase mt-1">Crea e monitora le prenotazioni</p>
                  </div>
                  <button onClick={() => setShowSportelloForm(!showSportelloForm)} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-colors">
                    {showSportelloForm ? 'Chiudi Form' : '+ Crea Sportello'}
                  </button>
                </div>

                {showSportelloForm && (
                  <form onSubmit={handleCreateSportello} className="bg-white p-8 rounded-[32px] shadow-xl border-t-8 border-emerald-500 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" required placeholder="Tuo Nome (es. Prof. Rossi)" value={newSportello.prof} onChange={e => setNewSportello({...newSportello, prof: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-200" />
                      <input type="text" required placeholder="Materia (es. Italiano)" value={newSportello.materia} onChange={e => setNewSportello({...newSportello, materia: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-200" />
                      <input type="text" required placeholder="Aula (es. Laboratorio 3)" value={newSportello.aula} onChange={e => setNewSportello({...newSportello, aula: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-200" />
                      <input type="text" required placeholder="Giorno e Ora (es. Lunedì 14:30)" value={newSportello.dataOra} onChange={e => setNewSportello({...newSportello, dataOra: e.target.value})} className="p-4 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-200" />
                      <div className="flex flex-col md:col-span-2 gap-2">
                        <label className="text-xs font-black uppercase text-gray-400">Posti massimi disponibili</label>
                        <input type="number" required min="1" max="50" value={newSportello.maxStudenti} onChange={e => setNewSportello({...newSportello, maxStudenti: e.target.value})} className="w-32 p-4 bg-gray-50 rounded-xl font-black text-center text-xl text-emerald-600 outline-none" />
                      </div>
                    </div>
                    <button type="submit" className="w-full mt-6 py-4 bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">Pubblica Sportello</button>
                  </form>
                )}

                <div className="space-y-6">
                  {sportelli.length === 0 ? <p className="text-center text-gray-400 font-bold mt-10">Nessuno sportello attivo.</p> : sportelli.map(s => (
                    <div key={s.id} className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full tracking-widest">{s.materia}</span>
                          <h3 className="text-2xl font-black uppercase text-gray-900 mt-2">{s.prof}</h3>
                          <div className="flex gap-4 mt-2 text-sm font-bold text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {s.dataOra}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> Aula {s.aula}</span>
                          </div>
                        </div>
                        <div className="text-center bg-gray-50 p-4 rounded-2xl">
                          <Users className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          <span className="text-xl font-black text-gray-900">{s.prenotazioni?.length || 0}</span>
                          <span className="text-xs font-bold text-gray-400"> / {s.maxStudenti}</span>
                        </div>
                      </div>

                      {/* LISTA PRENOTAZIONI PER IL DOCENTE */}
                      <div className="bg-gray-50 p-6 rounded-2xl">
                        <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest border-b border-gray-200 pb-2">Studenti Prenotati ed Esigenze</h4>
                        {s.prenotazioni?.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">Ancora nessuna prenotazione.</p>
                        ) : (
                          <ul className="space-y-3">
                            {s.prenotazioni?.map((p, idx) => (
                              <li key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1">
                                <span className="font-black text-gray-900 uppercase text-sm">{p.nome}</span>
                                <span className="text-sm text-gray-600"><strong>Difficoltà su:</strong> {p.note}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BACHECA SPORTELLI PER STUDENTI */}
            {sportelliStep === 'studente' && (
              <div className="space-y-6">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black uppercase text-gray-900">Sportelli Disponibili</h2>
                  <p className="text-gray-400 font-bold uppercase text-xs mt-2 tracking-widest">Prenota il tuo posto e segnala l'argomento</p>
                </div>

                <div className="grid gap-6">
                  {sportelli.length === 0 ? <p className="text-center text-gray-400 font-bold mt-10">Nessuno sportello disponibile al momento.</p> : sportelli.map(s => {
                    
                    const isBooked = s.prenotazioni?.some(p => p.uid === user.uid);
                    const isFull = (s.prenotazioni?.length || 0) >= s.maxStudenti;
                    const bookingData = s.prenotazioni?.find(p => p.uid === user.uid);

                    return (
                      <div key={s.id} className={`bg-white p-8 rounded-[32px] shadow-sm border ${isBooked ? 'border-emerald-300' : 'border-gray-100'}`}>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-3 py-1 rounded-full tracking-widest">{s.materia}</span>
                              {isBooked && <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full tracking-widest flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Prenotato</span>}
                            </div>
                            <h3 className="text-2xl font-black uppercase text-gray-900">{s.prof}</h3>
                            <div className="flex gap-4 mt-2 text-sm font-bold text-gray-500">
                              <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {s.dataOra}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> Aula {s.aula}</span>
                            </div>
                          </div>
                          
                          {/* BOTTONI PRENOTAZIONE */}
                          <div className="flex items-center gap-4">
                            <div className="text-center px-4">
                              <span className="block text-2xl font-black text-gray-900">{s.prenotazioni?.length || 0} <span className="text-lg text-gray-400">/ {s.maxStudenti}</span></span>
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Posti</span>
                            </div>
                            
                            {!isBooked && !isFull && bookingSportelloId !== s.id && (
                              <button onClick={() => setBookingSportelloId(s.id)} className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                                Prenotati
                              </button>
                            )}
                            
                            {!isBooked && isFull && (
                              <button disabled className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed">
                                Pieno
                              </button>
                            )}
                          </div>
                        </div>

                        {/* BOX RIASSUNTO PRENOTAZIONE EFFETTUATA */}
                        {isBooked && (
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">Il tuo argomento richiesto:</p>
                              <p className="text-sm font-medium text-emerald-700">{bookingData?.note}</p>
                            </div>
                          </div>
                        )}

                        {/* FORM INLINE DI PRENOTAZIONE */}
                        {bookingSportelloId === s.id && !isBooked && (
                          <div className="bg-gray-50 p-6 rounded-2xl mt-4 border border-emerald-200">
                            <label className="block text-sm font-black text-gray-900 uppercase mb-2">Su cosa hai difficoltà?</label>
                            <p className="text-xs text-gray-500 font-medium mb-3">Spiega brevemente al professore l'argomento (es. "Analisi logica" o "Non ho capito le derivate").</p>
                            <textarea autoFocus value={bookingNote} onChange={(e) => setBookingNote(e.target.value)} placeholder="Scrivi qui l'argomento..." className="w-full p-4 bg-white rounded-xl border border-gray-200 focus:border-emerald-500 outline-none min-h-[100px] mb-4" />
                            <div className="flex gap-3">
                              <button onClick={() => handleBookSportello(s.id)} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-colors">Conferma Prenotazione</button>
                              <button onClick={() => {setBookingSportelloId(null); setBookingNote('');}} className="px-6 py-3 bg-white text-gray-500 border border-gray-200 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-50">Annulla</button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'bacheca' && (
          // ... [IL CODICE BACHECA RESTA INVARIATO]
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

        {currentView === 'idee' && (
          // ... [IL CODICE IDEE RESTA INVARIATO]
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
                  <button type="submit" className="px-10 py-4 bg-yellow-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg">Invia {isAdmin ? '' : 'per approvazione'}</button>
                </div>
              </form>
            )}
            
            <div className="grid gap-6">
              {visibleIdeas.map(i => {
                const status = i.status || 'approved'; 
                return (
                  <div key={i.id} className={`bg-white p-6 rounded-[32px] shadow-sm border flex gap-6 ${status === 'pending' ? 'border-yellow-300 opacity-90' : status === 'rejected' ? 'border-red-300 opacity-70' : 'border-gray-100'}`}>
                    
                    <div className="flex flex-col items-center justify-center gap-2 bg-gray-50 p-3 rounded-2xl min-w-[60px]">
                      {status === 'approved' ? (
                        <>
                          <button onClick={() => handleVote(i.id, 'up', i.upvotes, i.downvotes)} className={`hover:text-emerald-500 transition-colors ${i.upvotes?.includes(user?.uid) ? 'text-emerald-500' : 'text-gray-400'}`}>
                            <ThumbsUp className="w-5 h-5"/>
                          </button>
                          <span className="font-black text-xl">{(i.upvotes?.length || 0) - (i.downvotes?.length || 0)}</span>
                          <button onClick={() => handleVote(i.id, 'down', i.upvotes, i.downvotes)} className={`hover:text-red-500 transition-colors ${i.downvotes?.includes(user?.uid) ? 'text-red-500' : 'text-gray-400'}`}>
                            <ThumbsDown className="w-5 h-5"/>
                          </button>
                        </>
                      ) : status === 'pending' ? (
                        <span className="text-2xl" title="In attesa">⏳</span>
                      ) : (
                        <span className="text-2xl" title="Rifiutata">❌</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-xl font-black uppercase leading-tight ${status === 'rejected' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{i.title}</h4>
                        {status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">In approvazione</span>}
                        {status === 'rejected' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Rifiutata</span>}
                      </div>
                      
                      <p className={`text-sm mb-4 leading-relaxed ${status === 'rejected' ? 'text-red-400 font-bold' : 'text-gray-600'}`}>
                        {status === 'rejected' ? "Idea rifiutata dai Rappresentanti o non conforme al regolamento. Proponine un'altra!" : i.desc}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black uppercase ${status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>S</div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Postato da: <span className={status === 'rejected' ? 'text-red-500' : 'text-yellow-600'}>{i.authorName}</span></span>
                      </div>

                      {isAdmin && status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                          <button onClick={() => handleApproveIdea(i.id)} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors">Apprezza e Pubblica</button>
                          <button onClick={() => handleRejectIdea(i.id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Rifiuta Idea</button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
              
              {visibleIdeas.length === 0 && (
                <p className="text-center text-gray-400 font-bold mt-10">Nessuna idea da mostrare al momento.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}