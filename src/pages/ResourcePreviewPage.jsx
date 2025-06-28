import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';

const ResourcePreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resource = location.state?.resource;

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300 bg-white dark:bg-black">
        Resource not found.
      </div>
    );
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    doc.setFontSize(18);
    doc.text(resource.title || 'Untitled', 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Category: ${resource.category}`, 10, y);
    y += 10;

    doc.text(`Date Added: ${new Date(resource.dateAdded).toLocaleDateString()}`, 10, y);
    y += 10;

    doc.setFontSize(14);
    doc.text("Description:", 10, y);
    y += 8;

    doc.setFontSize(12);
    const lines = doc.splitTextToSize(resource.description || '', 180);

    lines.forEach((line) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 10, y);
      y += 7;
    });

    doc.save(`${resource.title || 'resource'}.pdf`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-[#eef1ff] via-white to-[#e0e7ff] dark:from-gray-900 dark:to-black text-gray-900 dark:text-white px-6 py-14 md:px-20"
    >
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-6 cursor-pointer hover:underline"
        >
          <ArrowLeft size={20} />
          <span className="text-md font-medium">Back to Resources</span>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-md shadow-2xl rounded-3xl p-10 space-y-8 border border-gray-200 dark:border-gray-700"
        >
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 dark:text-indigo-300">
            {resource.title}
          </h1>

          {/* Description with code formatting */}
          <pre className="bg-gray-100 dark:bg-gray-800 text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-100">
            <code>{resource.description}</code>
          </pre>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {resource.tags.map((tag, index) => (
              <span
                key={index}
                className="text-sm bg-indigo-100 dark:bg-indigo-600 text-indigo-800 dark:text-white px-4 py-1 rounded-full shadow-sm"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 dark:border-gray-700 pt-4 space-y-1 text-sm">
            <p>
              <strong className="text-gray-700 dark:text-gray-400">Category:</strong> {resource.category}
            </p>
            <p>
              <strong className="text-gray-700 dark:text-gray-400">Date Added:</strong>{' '}
              {new Date(resource.dateAdded).toLocaleDateString()}
            </p>
          </div>

          {/* Download Button */}
          <div className="pt-6 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              onClick={handleDownloadPDF}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition duration-300 shadow-lg"
            >
              Download as PDF
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResourcePreviewPage;
