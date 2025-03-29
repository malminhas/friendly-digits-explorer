
import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner = ({ message = 'Loading MNIST dataset...' }: LoadingSpinnerProps) => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="mb-4">{message}</p>
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
