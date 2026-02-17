import React, { useCallback, useEffect, useState } from 'react';
import { useLearning } from '../../context/LearningContext';

const TeachingModule = ({ atomId, onComplete }) => {
    const [content, setContent] = useState(null);
    const [error, setError] = useState('');
    const [showExample, setShowExample] = useState(false);
    const [showAnalogy, setShowAnalogy] = useState(false);
    
    const { getTeachingContent, loading } = useLearning();

    const loadContent = useCallback(async () => {
        const result = await getTeachingContent(atomId);
        if (result.success) {
            setContent(result.data);
        } else {
            setError(result.error || 'Failed to load content.');
        }
    }, [atomId, getTeachingContent]);

    useEffect(() => {
        setContent(null);
        setError('');
        setShowExample(false);
        setShowAnalogy(false);

        if (atomId === null || atomId === undefined) {
            setError('No teaching atom selected. Please restart this learning step.');
            return;
        }

        loadContent();
    }, [atomId, loadContent]);

    const handleContinue = () => {
        onComplete(atomId);
    };

    if (loading && !content) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading teaching content...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error || 'Failed to load content.'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">{content.name}</h2>
            
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                <div className="prose max-w-none">
                    <p className="text-lg mb-6">{content.explanation}</p>
                    
                    <div className="border-t pt-6">
                        <button
                            onClick={() => setShowExample(!showExample)}
                            className="text-blue-600 hover:text-blue-800 font-medium mb-2"
                        >
                            {showExample ? 'Hide' : 'Show'} Example
                        </button>
                        
                        {showExample && (
                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                <p className="text-gray-800">{content.examples?.[0]}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="border-t pt-6">
                        <button
                            onClick={() => setShowAnalogy(!showAnalogy)}
                            className="text-blue-600 hover:text-blue-800 font-medium mb-2"
                        >
                            {showAnalogy ? 'Hide' : 'Show'} Analogy
                        </button>
                        
                        {showAnalogy && (
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <p className="text-gray-800 italic">
                                    💡 {content.analogy}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={handleContinue}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
            >
                Got it! Let's Practice →
            </button>
        </div>
    );
};

export default TeachingModule;