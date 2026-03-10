import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void; // Used for skipping or closing without rating
  onRate: (rating: number) => void; // Used when a rating is submitted
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onRate }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!isOpen) return null;

  const handleRate = () => {
    onRate(rating);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
        <div className="p-6">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
            <Star className="w-6 h-6 fill-current" />
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">Rate your experience</h3>
          <p className="text-sm text-zinc-400 mb-6">
            How helpful was Shandy Cleaner for your project?
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none"
              >
                <Star 
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-zinc-600'
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRate}
              disabled={rating === 0}
              className={`w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all
                ${rating > 0 
                  ? 'bg-primary hover:bg-primaryHover text-white shadow-lg shadow-primary/20' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
            >
              Submit & Download
            </button>
            
            <button 
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Skip and Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
