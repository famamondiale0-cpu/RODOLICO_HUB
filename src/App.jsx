import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { submitIdea, fetchIdeas, updateIdeaApproval } from '../services/ideaService';

const App = () => {
    const [ideas, setIdeas] = useState([]);
    const { user } = useUser();
    const [approvalStatus, setApprovalStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAndSetIdeas();
    }, []);

    const handleSubmitIdea = async (newIdea) => {
        try {
            const ideaWithApproval = { ...newIdea, approvalStatus: 'pending' };
            await submitIdea(ideaWithApproval);
            fetchAndSetIdeas();
        } catch (err) {
            setError('Errore nel submit dell\'idea');
            console.error(err);
        }
    };

    const handleApprovalDecision = async (ideaId, decision) => {
        setLoading(true);
        setError(null);
        try {
            const updatedApprovalStatus = decision === 'approve' ? 'approved' : 'rejected';
            
            // Update backend
            await updateIdeaApproval(ideaId, updatedApprovalStatus);
            
            // Update local state
            setApprovalStatus(prev => ({ ...prev, [ideaId]: updatedApprovalStatus }));
            
            // Refresh ideas to ensure consistency
            await fetchAndSetIdeas();
        } catch (err) {
            setError(`Errore nell'approvazione: ${err.message}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAndSetIdeas = async () => {
        try {
            const fetchedIdeas = await fetchIdeas();
            setIdeas(fetchedIdeas);
        } catch (err) {
            setError('Errore nel caricamento delle idee');
            console.error(err);
        }
    };

    return (
        <div>
            <h1>Ideas</h1>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <ul>
                {ideas.map(idea => (
                    <li key={idea.id}>
                        <h2>{idea.title}</h2>
                        <p>{idea.description}</p>
                        {user && user.isAdmin && (
                            <div>
                                <button 
                                    onClick={() => handleApprovalDecision(idea.id, 'approve')}
                                    disabled={loading}
                                >
                                    Approve
                                </button>
                                <button 
                                    onClick={() => handleApprovalDecision(idea.id, 'reject')}
                                    disabled={loading}
                                >
                                    Reject
                                </button>
                                <p>Status: {approvalStatus[idea.id] || idea.approvalStatus}</p>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default App;