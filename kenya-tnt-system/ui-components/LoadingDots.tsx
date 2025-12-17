import React from "react";

const LoadingDots = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="flex flex-row gap-2">
        <div className="w-4 h-4 rounded-full bg-sky-600 animate-bounce"></div>
        <div className="w-4 h-4 rounded-full bg-sky-600 animate-bounce [animation-delay:-.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-sky-600 animate-bounce [animation-delay:-.5s]"></div>
      </div>
      <p className="text-sky-600 font-medium">Loading...</p>
    </div>
  );
};

export default LoadingDots;
