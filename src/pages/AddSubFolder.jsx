import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddSubFolder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    link: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const newFolder = {
      id: Date.now(),
      name: formData.title,
      description: formData.description,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      link: formData.link,
    };

    try {
      const existing = JSON.parse(localStorage.getItem('folders')) || [];
      localStorage.setItem('folders', JSON.stringify([...existing, newFolder]));

      setSuccessMsg('✅ Sub Folder added successfully!');
      setFormData({ title: '', description: '', tags: '', link: '' });

      setTimeout(() => {
        navigate('/singleResource');
      }, 1000);
    } catch (err) {
      console.error('Error:', err);
      setErrorMsg('❌ Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1e2e] shadow-2xl rounded-2xl p-8 text-black dark:text-white transition-all duration-300">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-blue-700 dark:text-blue-400">
          Add Sub Folder
        </h1>

        {errorMsg && <p className="text-red-500 text-sm mb-4">{errorMsg}</p>}
        {successMsg && <p className="text-green-500 text-sm mb-4">{successMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Frontend Resources"
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Short Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe this folder in 70–80 words"
              required
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., react, design, tools"
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Link (optional)</label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://yourlink.com"
              className="w-full border dark:border-gray-700 dark:bg-[#2a2a3c] dark:text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:from-blue-700 hover:to-indigo-700 transition duration-300"
            >
              {loading ? 'Saving...' : 'Save Sub Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubFolder;
