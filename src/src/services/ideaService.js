import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';

export const submitIdea = async (ideaData) => {
    try {
        const docRef = await addDoc(collection(db, 'ideas'), ideaData);
        console.log('Idea submitted with ID: ', docRef.id);
        return docRef.id;
    } catch (e) {
        console.error('Error adding idea: ', e);
        throw new Error('Error submitting idea');
    }
};

export const fetchIdeas = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'ideas'));
        const ideas = [];
        querySnapshot.forEach((doc) => {
            ideas.push({ id: doc.id, ...doc.data() });
        });
        return ideas;
    } catch (e) {
        console.error('Error fetching ideas: ', e);
        throw new Error('Error fetching ideas');
    }
};

export const updateIdeaApproval = async (ideaId, approvalStatus) => {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        await updateDoc(ideaRef, { approved: approvalStatus });
        console.log('Idea updated with ID: ', ideaId);
    } catch (e) {
        console.error('Error updating idea: ', e);
        throw new Error('Error updating idea approval');
    }
};
