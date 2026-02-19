import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LearningProvider } from '../../context/LearningContext';
import TeachingFirstFlow from './TeachingFirstFlow';

const LearningRoute = () => {
    const { conceptId } = useParams();
    const navigate = useNavigate();
    
    if (!conceptId) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">No concept selected.</p>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <LearningProvider>
            <TeachingFirstFlow conceptId={parseInt(conceptId)} />
        </LearningProvider>
    );
};

export default LearningRoute;