import React from 'react';

const BookLoader = ({ text }) => {
  // SVG path for the book page
  const pagePath = "M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z";

  return (
    <div className="relative w-[200px] h-[140px] ">
      {/* Shadow elements */}
      <div 
        className="absolute bottom-2 w-[120px] top-[80%] shadow-lg"
        style={{
          left: '4px',
          transform: 'rotate(-6deg)',
          boxShadow: '0 16px 12px rgba(39, 94, 254, 0.28)'
        }}
      />
      <div 
        className="absolute bottom-2 w-[120px] top-[80%] shadow-lg"
        style={{
          right: '4px',
          transform: 'rotate(6deg)',
          boxShadow: '0 16px 12px rgba(39, 94, 254, 0.28)'
        }}
      />
      
      {/* Main book container */}
      <div 
        className="w-full h-full rounded-[13px] relative z-10 shadow-lg"
        style={{
          perspective: '600px',
          background: 'linear-gradient(135deg, #23C4F8, #275EFE)',
          boxShadow: '0 4px 6px rgba(39, 94, 254, 0.28)'
        }}
      >
        {/* Pages container */}
        <ul className="m-0 p-0 list-none relative">
          {[...Array(6)].map((_, index) => {
            const isFirst = index === 0;
            const isLast = index === 5;
            const isFlipping = index > 0 && index < 5;
            
            return (
              <li
                key={index}
                className="absolute top-[10px] left-[10px]"
                style={{
                  transformOrigin: '100% 50%',
                  color: isFlipping ? 'rgba(255, 255, 255, 0.52)' : 'rgba(255, 255, 255, 0.36)',
                  opacity: isFirst || isLast ? 1 : 0,
                  transform: isFirst ? 'rotateY(0deg)' : 'rotateY(180deg)',
                  animation: isFlipping ? `page-flip-${index} 3s ease infinite` : 'none'
                }}
              >
                <svg 
                  viewBox="0 0 90 120" 
                  fill="currentColor"
                  className="w-[90px] h-[120px] block"
                >
                  <path d={pagePath} />
                </svg>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Loading text */}
      <span 
        className="block left-0 right-0 top-full mt-5 text-center"
        style={{ color: '#6C7486' }}
      >
        {text}
      </span>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes page-flip-1 {
          0% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          20% {
            opacity: 0;
          }
          35%, 100% {
            transform: rotateY(0deg);
          }
        }
        
        @keyframes page-flip-2 {
          15% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          35% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
          65%, 100% {
            transform: rotateY(0deg);
          }
        }
        
        @keyframes page-flip-3 {
          30% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          65% {
            opacity: 0;
          }
          80%, 100% {
            transform: rotateY(0deg);
          }
        }
        
        @keyframes page-flip-4 {
          45% {
            transform: rotateY(180deg);
            opacity: 0;
          }
          65% {
            opacity: 1;
          }
          80% {
            opacity: 0;
          }
          95%, 100% {
            transform: rotateY(0deg);
          }
        }
      `}</style>
    </div>
  );
};

export default BookLoader;