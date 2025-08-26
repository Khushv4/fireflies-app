// import React, { useState } from 'react';
// import { X, FileText, Layout, File } from 'lucide-react';

// const FileSelectionModal = ({ isOpen, onClose, onConfirm }) => {
//   const [selectedFiles, setSelectedFiles] = useState([]);
  
//   const fileOptions = [
//     {
//       id: 'functional',
//       name: 'Functional Document',
//       description: 'Detailed functional requirements and specifications',
//       icon: FileText,
//       filename: 'FunctionalDoc.txt'
//     },
//     {
//       id: 'mockups',
//       name: 'Mockups',
//       description: 'UI/UX mockups and design specifications',
//       icon: Layout,
//       filename: 'Mockups.txt'
//     },
//     {
//       id: 'markdown',
//       name: 'Markdown File',
//       description: 'Formatted markdown documentation',
//       icon: File,
//       filename: 'Markdown.md'
//     }
//   ];

//   const handleFileToggle = (fileId) => {
//     setSelectedFiles(prev => 
//       prev.includes(fileId) 
//         ? prev.filter(id => id !== fileId)
//         : [...prev, fileId]
//     );
//   };

//   const handleConfirm = () => {
//     if (selectedFiles.length === 0) {
//       alert('Please select at least one file to generate.');
//       return;
//     }
//     onConfirm(selectedFiles);
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
//       <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-2xl font-bold text-gray-800">
//             Select Files to Generate
//           </h3>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <p className="text-gray-600 mb-6">
//           Choose which files you want to generate from your meeting summary:
//         </p>

//         <div className="space-y-4 mb-8">
//           {fileOptions.map((file) => {
//             const Icon = file.icon;
//             const isSelected = selectedFiles.includes(file.id);
            
//             return (
//               <div
//                 key={file.id}
//                 onClick={() => handleFileToggle(file.id)}
//                 className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
//                   isSelected 
//                     ? 'border-blue-500 bg-blue-50 shadow-md' 
//                     : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
//                 }`}
//               >
//                 <div className="flex items-start gap-4">
//                   <div className={`p-3 rounded-lg ${
//                     isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
//                   }`}>
//                     <Icon size={24} />
//                   </div>
                  
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3">
//                       <h4 className="font-semibold text-lg text-gray-800">
//                         {file.name}
//                       </h4>
//                       <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
//                         isSelected 
//                           ? 'bg-blue-500 border-blue-500' 
//                           : 'border-gray-300'
//                       }`}>
//                         {isSelected && (
//                           <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                           </svg>
//                         )}
//                       </div>
//                     </div>
//                     <p className="text-gray-600 mt-1">{file.description}</p>
//                     <p className="text-sm text-gray-500 mt-1">File: {file.filename}</p>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         <div className="flex justify-between items-center">
//           <p className="text-sm text-gray-600">
//             {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
//           </p>
          
//           <div className="flex gap-3">
//             <button
//               onClick={onClose}
//               className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleConfirm}
//               disabled={selectedFiles.length === 0}
//               className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:scale-[1.02] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Generate Selected Files
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FileSelectionModal;



// export default FileSelectionModal;
import React, { useState } from 'react';
import { X, FileText, Layout, File, ChevronRight, Check, Sparkles } from 'lucide-react';

const FileSelectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const fileOptions = [
    {
      id: 'functional',
      name: 'Functional Document',
      description: 'Detailed functional requirements and specifications',
      icon: FileText,
      filename: 'FunctionalDoc.txt',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'mockups',
      name: 'Mockups',
      description: 'UI/UX mockups and design specifications',
      icon: Layout,
      filename: 'Mockups.txt',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'markdown',
      name: 'Markdown File',
      description: 'Formatted markdown documentation',
      icon: File,
      filename: 'Markdown.md',
      color: 'from-green-500 to-emerald-500'
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-md p-4 overflow-y-auto mt-21">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/30 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl shadow-black/50 my-auto">
        {/* Header - More Compact */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Generate Files
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Select files to generate from your meeting summary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* File Options - More Compact */}
        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {fileOptions.map((file) => {
            const Icon = file.icon;
            const isSelected = selectedFiles.includes(file.id);
            
            return (
              <div
                key={file.id}
                onClick={() => handleFileToggle(file.id)}
                className={`relative p-1 rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden ${
                  isSelected 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
                    : 'hover:bg-slate-700/30'
                }`}
              >
                <div className={`flex items-center p-3 rounded-xl backdrop-blur-sm ${
                  isSelected ? 'bg-slate-800/80' : 'bg-slate-800/50'
                }`}>
                  {/* Icon with gradient */}
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isSelected 
                      ? `bg-gradient-to-r ${file.color} shadow-md` 
                      : 'bg-slate-700 group-hover:bg-slate-600'
                  }`}>
                    <Icon size={18} className={isSelected ? 'text-white' : 'text-slate-300'} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 ml-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-semibold text-sm transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {file.name}
                        </h4>
                        <p className="text-slate-400 text-xs mt-1">{file.description}</p>
                      </div>
                      
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent' 
                          : 'border-slate-600 bg-slate-700 group-hover:border-slate-500'
                      }`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-bl-xl rounded-tr-xl" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer - More Compact */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-700/30">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedFiles.length > 0 ? 'bg-green-400' : 'bg-slate-600'}`} />
            <span className="text-slate-400 text-xs">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50 transition text-sm font-medium hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFiles.length === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <span>Generate</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSelectionModal;