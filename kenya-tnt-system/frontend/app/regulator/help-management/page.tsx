'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Save, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { helpApi, HelpContent, UpsertHelpContentDto, HelpCategory } from '@/lib/api/help';

export default function HelpManagementPage() {
  const [topics, setTopics] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTopic, setEditingTopic] = useState<HelpContent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState<UpsertHelpContentDto>({
    topicKey: '',
    title: '',
    description: '',
    category: 'GS1_IDENTIFIERS',
    examples: [],
    relatedTopics: [],
  });
  const [examplesInput, setExamplesInput] = useState('');
  const [relatedTopicsInput, setRelatedTopicsInput] = useState('');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await helpApi.getAll();
      setTopics(data.sort((a, b) => a.topicKey.localeCompare(b.topicKey)));
    } catch (error) {
      console.error('Failed to load topics:', error);
      setMessage({ type: 'error', text: 'Failed to load help topics' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (topic: HelpContent) => {
    setEditingTopic(topic);
    setForm({
      topicKey: topic.topicKey,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      examples: topic.examples || [],
      relatedTopics: topic.relatedTopics || [],
    });
    setExamplesInput((topic.examples || []).join('\n'));
    setRelatedTopicsInput((topic.relatedTopics || []).join(', '));
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingTopic(null);
    setForm({
      topicKey: '',
      title: '',
      description: '',
      category: 'GS1_IDENTIFIERS',
      examples: [],
      relatedTopics: [],
    });
    setExamplesInput('');
    setRelatedTopicsInput('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTopic(null);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      // Parse examples and related topics
      const examples = examplesInput
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const relatedTopics = relatedTopicsInput
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);

      await helpApi.upsert({
        ...form,
        examples,
        relatedTopics,
      });

      setMessage({ 
        type: 'success', 
        text: editingTopic ? 'Topic updated successfully' : 'Topic created successfully' 
      });
      
      setShowForm(false);
      setEditingTopic(null);
      loadTopics();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save topic' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (topicKey: string) => {
    if (!confirm(`Are you sure you want to delete topic "${topicKey}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await helpApi.delete(topicKey);
      setMessage({ type: 'success', text: 'Topic deleted successfully' });
      loadTopics();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete topic' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help Content Management</h1>
          <p className="mt-2 text-gray-600">Manage GS1 help topics and educational content</p>
        </div>
        <button
          onClick={handleNew}
          disabled={showForm}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={18} /> New Topic
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingTopic ? 'Edit Topic' : 'New Topic'}
            </h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Key *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingTopic}
                  value={form.topicKey}
                  onChange={(e) => setForm({ ...form, topicKey: e.target.value })}
                  placeholder="e.g., GTIN, GLN, SSCC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as HelpCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GS1_IDENTIFIERS">GS1 Identifiers</option>
                  <option value="EPCIS_EVENTS">EPCIS Events</option>
                  <option value="SUPPLY_CHAIN">Supply Chain</option>
                  <option value="WORKFLOW">Workflow</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Global Trade Item Number (GTIN)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={6}
                placeholder="Detailed explanation of the topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Examples (one per line)
              </label>
              <textarea
                value={examplesInput}
                onChange={(e) => setExamplesInput(e.target.value)}
                rows={4}
                placeholder="e.g.,&#10;01234567890128&#10;09876543210987"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Topics (comma-separated)
              </label>
              <input
                type="text"
                value={relatedTopicsInput}
                onChange={(e) => setRelatedTopicsInput(e.target.value)}
                placeholder="e.g., SGTIN, EPC, BARCODE"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                Save Topic
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Topics List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Help Topics ({topics.length})</h2>
          <button
            onClick={loadTopics}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading && !showForm ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-blue-600" />
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No help topics found</p>
            <button
              onClick={handleNew}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              Create your first topic
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Examples
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topics.map((topic) => (
                  <tr key={topic.topicKey}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                      {topic.topicKey}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {topic.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {topic.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {topic.examples?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(topic.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleEdit(topic)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit topic"
                      >
                        <Edit size={16} className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(topic.topicKey)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete topic"
                      >
                        <Trash2 size={16} className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
