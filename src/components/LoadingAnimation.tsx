import React, { useState, useEffect } from 'react';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = "Loading face analyzer..."
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate the dots
    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => {
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full py-6">
      <div className="spinner mb-3"></div>
      <p className="text-white text-sm">
        {message}{dots}
      </p>
    </div>
  );
};

export default LoadingAnimation;
