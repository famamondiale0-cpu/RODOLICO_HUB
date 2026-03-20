import { db } from '../firebase.js';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  query,
  where
} from 'firebase/firestore';

// Invia una nuova idea al database
export const submitIdea = async (idea) => {
  try {
    const ideasCollection = collection(db, 'ideas');
    const docRef = await addDoc(ideasCollection, {
      ...idea,
      createdAt: new Date(),
      approvalStatus: 'pending'
    });
    return docRef.id;
  } catch (error) {
    console.error('Errore nel submit dell\'idea:', error);
    throw error;
  }
};

// Recupera tutte le idee dal database
export const fetchIdeas = async () => {
  try {
    const ideasCollection = collection(db, 'ideas');
    const snapshot = await getDocs(ideasCollection);
    const ideas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return ideas;
  } catch (error) {
    console.error('Errore nel caricamento delle idee:', error);
    throw error;
  }
};

// Aggiorna lo stato di approvazione di un'idea
export const updateIdeaApproval = async (ideaId, approvalStatus) => {
  try {
    const ideaDoc = doc(db, 'ideas', ideaId);
    await updateDoc(ideaDoc, {
      approvalStatus: approvalStatus
    });
    return true;
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'approvazione:', error);
    throw error;
  }
};
