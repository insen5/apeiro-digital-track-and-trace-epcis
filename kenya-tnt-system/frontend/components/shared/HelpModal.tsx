'use client';

import React, { useEffect, useState } from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import { helpApi, HelpContent } from '@/lib/api/help';

interface HelpModalProps {
  topicKey: string;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ topicKey, onClose }) => {
  const [content, setContent] = useState<HelpContent | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [topicKey]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [helpContent, related] = await Promise.all([
        helpApi.getByTopic(topicKey),
        helpApi.getRelated(topicKey).catch(() => []),
      ]);

      if (!helpContent) {
        setError(`No help content found for "${topicKey}"`);
        return;
      }

      setContent(helpContent);
      setRelatedTopics(related);
    } catch (err) {
      console.error('Error loading help content:', err);
      setError('Failed to load help content');
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedTopicClick = (newTopicKey: string) => {
    // Reload with new topic
    window.history.pushState({}, '', `?help=${newTopicKey}`);
    loadContent();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center gap-2">
              <BookOpen className="text-blue-600" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">
                {loading ? 'Loading...' : content?.title || 'Help'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close help"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            )}

            {content && !loading && (
              <div className="space-y-4">
                {/* Category Badge */}
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {content.category.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Description */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{content.description}</p>
                </div>

                {/* Examples */}
                {content.examples && content.examples.length > 0 && (
                  <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Examples:</h3>
                    <ul className="space-y-1">
                      {content.examples.map((example, index) => (
                        <li key={index} className="text-sm text-gray-700 font-mono">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Topics */}
                {relatedTopics.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Related Topics:</h3>
                    <div className="flex flex-wrap gap-2">
                      {relatedTopics.map((topic) => (
                        <button
                          key={topic.topicKey}
                          onClick={() => handleRelatedTopicClick(topic.topicKey)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          {topic.title}
                          <ExternalLink size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* GS1 Link */}
                <div className="border-t border-gray-200 pt-4">
                  <a
                    href={`https://www.gs1.org/standards`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Learn more on GS1.org
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
