// frontend/src/components/Learning/ExternalResources.jsx

import React, { useState, useEffect } from 'react';
import axios from '../../axiosConfig';

const ExternalResources = ({ subject, concept, atomName }) => {
    const [resources, setResources] = useState({ videos: [], images: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('videos');

    useEffect(() => {
        if (subject && concept) {
            fetchResources();
        }
    }, [subject, concept, atomName]);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/auth/api/concept-resources/', {
                subject: subject,
                concept: concept,
                atom_name: atomName
            });
            setResources(response.data);
        } catch (error) {
            console.error('Failed to fetch resources:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-4">
                <p className="text-gray-600">Loading additional resources...</p>
            </div>
        );
    }

    if (!resources.videos.length && !resources.images.length) {
        return null; // Don't show anything if no resources
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Additional Learning Resources</h3>
            
            {/* Tabs */}
            <div className="flex border-b mb-4">
                {resources.videos.length > 0 && (
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'videos'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('videos')}
                    >
                        Videos ({resources.videos.length})
                    </button>
                )}
                {resources.images.length > 0 && (
                    <button
                        className={`px-4 py-2 font-medium ${
                            activeTab === 'images'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                        onClick={() => setActiveTab('images')}
                    >
                        Diagrams ({resources.images.length})
                    </button>
                )}
            </div>

            {/* Videos Tab */}
            {activeTab === 'videos' && resources.videos.length > 0 && (
                <div className="space-y-4">
                    {resources.videos.map((video, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                            <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <h4 className="font-semibold text-blue-600 hover:underline">
                                    {video.title}
                                </h4>
                                <div className="flex items-center text-sm text-gray-600 mt-2">
                                    <span className="mr-4">📺 {video.channel}</span>
                                    <span className="mr-4">⏱️ {video.duration}</span>
                                    {video.views && <span>👁️ {video.views}</span>}
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && resources.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.images.map((image, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden hover:shadow-lg">
                            <a
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <img
                                    src={image.thumbnail || image.url}
                                    alt={image.title}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                                    }}
                                />
                                <div className="p-3">
                                    <p className="text-sm text-gray-700 truncate">{image.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">Source: {image.source}</p>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExternalResources;