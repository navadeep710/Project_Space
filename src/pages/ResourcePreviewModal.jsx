import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const ResourcePreviewPage = ({ resource }) => {
  const navigate = useNavigate();

  if (!resource) return <div className="p-10 text-center text-gray-500">Resource not found.</div>;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(resource.title || 'Untitled', 10, 20);

    doc.setFontSize(12);
    doc.text(`Category: ${resource.category}`, 10, 30);
    doc.text(`Date Added: ${new Date(resource.dateAdded).toLocaleDateString()}`, 10, 40);

    doc.setFontSize(14);
    doc.text("Description:", 10, 50);
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(resource.description || '', 180), 10, 60);

    doc.save(`${resource.title || 'resource'}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-800 to-black text-white px-6 py-12"
    >
      <div className="max-w-5xl mx-auto space-y-10">
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-400 hover:underline text-sm"
        >
          ← Back to Resources
        </button>

        <h1 className="text-4xl font-extrabold">{resource.title}</h1>
        <p className="text-gray-300 text-lg">{resource.description}</p>

        <div className="flex flex-wrap gap-2">
          {resource.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          <p><strong>Category:</strong> {resource.category}</p>
          <p><strong>Date Added:</strong> {new Date(resource.dateAdded).toLocaleDateString()}</p>
        </div>

        <div className="mt-6">
          {resource.url.endsWith('.pdf') ? (
            <iframe
              src={resource.url}
              title="PDF Preview"
              className="w-full h-[600px] border border-gray-700 rounded-lg"
            />
          ) : (
            <img
              src={resource.url}
              alt="Preview"
              className="w-full max-h-[600px] object-contain border border-gray-700 rounded-lg"
            />
          )}
        </div>

        <div className="mt-10">
          <button
            onClick={handleDownloadPDF}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold px-6 py-3 rounded-xl"
          >
            Download as PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourcePreviewPage;
