import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Lightbulb, Trophy, School, Heart, Image as ImageIcon } from 'lucide-react';

export default function Landing({ onEnter }) {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] font-sans overflow-hidden text-gray-900">
      <nav className="w-full px-8 py-6 flex justify-between items-center bg-white/50 backdrop-blur-md fixed top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <School className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Rodolico Hub</span>
        </div>
        <button onClick={onEnter} className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-full transition-all shadow-md">
          Accedi al Portale
        </button>
      </nav>

      <main className="pt-32 pb-20 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight mt-10"
        >
          La tua scuola, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            finalmente digitale.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg text-gray-500 font-medium max-w-2xl mb-10"
        >
          Una piattaforma sicura e intuitiva, creata esclusivamente per gli studenti del Liceo Rodolico. Partecipa, informati e rendi la tua voce protagonista.
        </motion.p>

        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
          onClick={onEnter}
          className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-3"
        >
          Entra in Rodolico Hub
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* SEZIONE: Chi Siamo e Perché */}
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className="mt-32 max-w-5xl bg-white p-10 sm:p-14 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col md:flex-row gap-12 items-center text-left"
        >
          <div className="md:w-1/2 space-y-6">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-purple-500" />
              <h2 className="text-3xl font-extrabold text-gray-900">Chi siamo e perché nasce questo progetto</h2>
            </div>
            <p className="text-gray-600 leading-relaxed font-medium">
              Siamo i vostri Rappresentanti degli Studenti. Abbiamo notato che spesso le idee brillanti si perdevano nei corridoi e le comunicazioni importanti finivano sepolte nei gruppi WhatsApp. 
            </p>
            <p className="text-gray-600 leading-relaxed font-medium">
              Abbiamo creato <strong>Rodolico Hub</strong> per risolvere questo problema. Volevamo uno spazio "nostro", professionale e sicuro, per connettere tutta la scuola.
            </p>
            
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Il futuro del portale</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Questo è solo l'inizio. In futuro introdurremo funzioni per la compravendita di libri usati, gruppi di studio, e la gestione digitale delle assemblee. Vogliamo che il sito cresca insieme a voi.
              </p>
            </div>
          </div>

          {/* BOX IMMAGINE: Inserisci qui la tua foto! */}
          <div className="md:w-1/2 w-full">
            <div className="w-full aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 group overflow-hidden relative">
              {/* Quando avrai l'immagine, potrai sostituire l'icona con il tag <img> così:
                  <img src="/percorso-foto.jpg" alt="Team" className="w-full h-full object-cover" /> 
              */}
              <ImageIcon className="w-12 h-12 mb-3 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Qui andrà la vostra foto/logo</span>
            </div>
          </div>
        </motion.div>

        {/* Le 3 Funzionalità */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            <Lightbulb className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Idee & Proposte</h3>
            <p className="text-gray-500 text-sm">Proponi e vota le iniziative per migliorare la nostra scuola.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            <Trophy className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Eventi Sportivi</h3>
            <p className="text-gray-500 text-sm">Gestione tornei d'istituto, tabelloni e iscrizioni delle squadre.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-white p-8 rounded-3xl shadow-md border border-gray-100">
            <Users className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Bacheca Avvisi</h3>
            <p className="text-gray-500 text-sm">Circolari, novità e comunicazioni ufficiali in tempo reale.</p>
          </motion.div>
        </div>

      </main>
    </div>
  );
}