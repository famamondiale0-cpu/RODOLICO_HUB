import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { submitIdea, fetchIdeas } from '../services/ideaService';

const App = () => {
    const [ideas, setIdeas] = useState([]);
    const { user } = useUser();
    const [approvalStatus, setApprovalStatus] = useState({});

    const handleSubmitIdea = async (newIdea) => {
        const ideaWithApproval = { ...newIdea, approvalStatus: 'pending' };
        await submitIdea(ideaWithApproval);
        fetchAndSetIdeas();
    };

    const handleApprovalDecision = async (ideaId, decision) => {
        const updatedApprovalStatus = decision === 'approve' ? 'approved' : 'rejected';
        setApprovalStatus(prev => ({ ...prev, [ideaId]: updatedApprovalStatus }));
        // Update the idea status in your backend (implementation depends on the backend setup)
    };

    const fetchAndSetIdeas = async () => {
        const fetchedIdeas = await fetchIdeas();
        setIdeas(fetchedIdeas);
    };

    return (
        <div>
            <h1>Ideas</h1>
            <ul>
                {ideas.map(idea => (
                    <li key={idea.id}>
                        <h2>{idea.title}</h2>
                        <p>{idea.description}</p>
                        {user.isAdmin && (
                            <div>
                                <button onClick={() => handleApprovalDecision(idea.id, 'approve')}>Approve</button>
                                <button onClick={() => handleApprovalDecision(idea.id, 'reject')}>Reject</button>
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
