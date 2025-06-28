import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Filter, Grid3X3, List, Plus, Star,
  Eye, Edit, Trash2, Calendar, BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { CopilotPanel } from './CopilotPanel';

const categories = ['All', 'Documentation', 'Tools', 'Libraries', 'Articles'];

export const Resources = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await fetch('https://qi3ulho30g.execute-api.us-east-1.amazonaws.com/prod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });

        const result = await res.json();
        const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

        const resourcesArray = (parsed?.resources || []).map((item) => ({
          id: item.resourceId,
          title: item.title || 'Untitled',
          url: item.link || '#',
          description: item.description || '',
          tags: item.tags || [],
          category: item.category || 'Uncategorized',
          dateAdded: item.date || new Date().toISOString().split('T')[0],
          email: item.email,
        }));

        setResources(resourcesArray);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) fetchResources();
  }, [user?.email]);

  useEffect(() => {
    if (location.state) {
      if (location.state.newResource) {
        setResources((prev) => [location.state.newResource, ...prev]);
      } else if (location.state.updatedResource) {
        const updated = location.state.updatedResource;
        setResources((prev) =>
          prev.map((res) => (res.id === updated.id ? updated : res))
        );
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resource.description && resource.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchQuery, selectedCategory]);

  const handleEdit = (id) => {
    const res = resources.find((r) => r.id === id);
    if (res) {
      navigate(`/resources/${id}`, { state: { resource: res } }); // ✅ Redirects to edit page
    }
  };

  const handleView = (resource) => {
    navigate(`/preview/${resource.id}`, { state: { resource } });
  };

  const handleDelete = async (id) => {
    const toDelete = resources.find((r) => r.id === id);
    if (!toDelete) return;

    try {
      const res = await fetch('https://tjn5komlkl.execute-api.us-east-1.amazonaws.com/prod', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: toDelete.email,
          resourceId: toDelete.id,
        }),
      });

      const result = await res.json();
      const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert(parsed.message || 'Failed to delete resource.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting.');
    }
  };

  return (
    <div className="relative p-6 space-y-6 overflow-hidden">
      <CopilotPanel isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and organize your saved resources</p>
        </div>
        <div className="flex gap-3">
          {/* <Button onClick={() => setCopilotOpen(true)}>
            <Star className="w-4 h-4 mr-2" />
            AI Copilot
          </Button> */}
          <Button onClick={() => navigate('/resources/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </motion.div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search resources..."
          className="flex-grow border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
          <List className="w-4 h-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading resources...</div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first resource'}
          </p>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredResources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeInOut' }}
              whileHover={{
                scale: 1.05,
                rotateX: 4,
                rotateY: -3,
                zIndex: 10,
                boxShadow: '0 15px 30px rgba(0,0,0,0.25), 0 0 25px rgba(139, 92, 246, 0.3)',
                transition: {
                  type: 'spring',
                  stiffness: 250,
                  damping: 18,
                },
              }}
              whileTap={{ scale: 0.97 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 min-h-[260px] flex flex-col justify-between transform-gpu perspective-[1000px] transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-sm text-indigo-500">
                    <BookOpen className="w-5 h-5" />
                    <span>{resource.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(resource)}
                      className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(resource.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{resource.title}</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-3">{resource.description}</p>

                <div className="flex flex-wrap gap-1 mb-2">
                  {resource.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-indigo-100 dark:bg-indigo-700 dark:text-white text-indigo-700 px-2 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(resource.dateAdded).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
