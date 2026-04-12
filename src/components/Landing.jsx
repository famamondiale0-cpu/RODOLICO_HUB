import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Lightbulb, Trophy, School, Heart } from 'lucide-react';

export default function Landing({ onEnter }) {
  // Varianti per le animazioni
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-sans overflow-hidden">
      {/* Header / Navbar semplice */}
      <nav className="w-full px-8 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md fixed top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <School className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">Rodolico Hub</span>
        </div>
        <button 
          onClick={onEnter}
          className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-full transition-all active:scale-95 shadow-md"
        >
          Accedi
        </button>
      </nav>

      {/* Hero Section (Sezione Principale) */}
      <main className="pt-32 pb-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Badge "Novità" */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-6">
          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-100">
            Il nuovo portale studentesco
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight"
        >
          Tutta la tua scuola,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            in un unico posto.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-500 font-medium max-w-2xl mb-10"
        >
          Dimentica le chat disordinate e le circolari perse. Rodolico Hub è lo spazio creato dagli studenti, per gli studenti. Informati, proponi idee e partecipa alla vita scolastica.
        </motion.p>

        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          onClick={onEnter}
          className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
        >
          <span className="relative z-10">Entra nel Portale</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Sezione "Cosa Facciamo" */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <FeatureCard 
            icon={<Lightbulb className="w-6 h-6 text-yellow-500" />}
            title="Proponi le tue Idee"
            desc="Hai un'idea per migliorare la scuola? Pubblicala, falla votare dagli altri e aiutaci a realizzarla."
            delay={0.4}
          />
          <FeatureCard 
            icon={<Trophy className="w-6 h-6 text-green-500" />}
            title="Tornei & Eventi"
            desc="Iscriviti ai tornei sportivi, crea la tua squadra e segui i tabelloni aggiornati in tempo reale."
            delay={0.5}
          />
          <FeatureCard 
            icon={<Users className="w-6 h-6 text-blue-500" />}
            title="Comunicazione Diretta"
            desc="Avvisi dai rappresentanti, sondaggi per le assemblee e notizie importanti senza distrazioni."
            delay={0.6}
          />
        </div>

        {/* Sezione "Chi Siamo" */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="mt-32 max-w-4xl bg-white p-10 sm:p-14 rounded-[3rem] shadow-2xl border border-gray-100 text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-purple-500" />
              <h2 className="text-3xl font-extrabold text-gray-900">Chi siamo e perché l'abbiamo fatto</h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed mb-6 font-medium">
              Siamo i Rappresentanti degli Studenti. Abbiamo creato <strong>Rodolico Hub</strong> perché crediamo che la nostra scuola avesse bisogno di una "casa digitale" moderna. Spesso le comunicazioni si perdono nei gruppi WhatsApp e le belle idee non trovano lo spazio per essere ascoltate.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              Questo sito è il nostro regalo per la community del Rodolico: un posto sicuro (accessibile solo con l'email istituzionale) dove ogni studente ha voce in capitolo e dove organizzare la vita studentesca diventa finalmente semplice e divertente.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer Semplice */}
      <footer className="w-full py-8 text-center text-gray-400 font-medium text-sm">
        <p>© {new Date().getFullYear()} Liceo Scientifico Rodolico. Progetto Studentesco.</p>
      </footer>
    </div>
  );
}

// Componentino per le card delle funzionalità
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay }}
      className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 text-left hover:-translate-y-2 transition-transform duration-300"
    >
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}