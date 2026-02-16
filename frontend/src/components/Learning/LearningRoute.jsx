import React from 'react';
import { useParams } from 'react-router-dom';
import { LearningProvider } from '../../context/LearningContext';
import AdaptiveLearning from './AdaptiveLearning';

const LearningRoute = () => {
    const { subject } = useParams();

    return (
        <LearningProvider>
            <AdaptiveLearning subject={subject} />
        </LearningProvider>
    );
};

export default LearningRoute;
