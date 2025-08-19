import React, { useState } from 'react';
import { X, FileText, Layout, File } from 'lucide-react';

const FileSelectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const fileOptions = [
    {
      id: 'functional',
      name: 'Functional Document',
      description: 'Detailed functional requirements and specifications',
      icon: FileText,
      filename: 'FunctionalDoc.txt'
    },
    {
      id: 'mockups',
      name: 'Mockups',
      description: 'UI/UX mockups and design specifications',
      icon: Layout,
      filename: 'Mockups.txt'
    },
    {
      id: 'markdown',
      name: 'Markdown File',
      description: 'Formatted markdown documentation',
      icon: File,
      filename: 'Markdown.md'
    }
  ];

  const handleFileToggle = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleConfirm = () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to generate.');
      return;
    }
    onConfirm(selectedFiles);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Select Files to Generate
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Choose which files you want to generate from your meeting summary:
        </p>

        <div className="space-y-4 mb-8">
          {fileOptions.map((file) => {
            const Icon = file.icon;
            const isSelected = selectedFiles.includes(file.id);
            
            return (
              <div
                key={file.id}
                onClick={() => handleFileToggle(file.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg text-gray-800">
                        {file.name}
                      </h4>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{file.description}</p>
                    <p className="text-sm text-gray-500 mt-1">File: {file.filename}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:scale-[1.02] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Selected Files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSelectionModal;