// components/ComingSoon.tsx

import React from "react";

interface ComingSoonProps {
  featureName: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ featureName }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-4xl font-bold mb-4">{featureName}</h1>
      <p className="text-xl">This feature will be coming soon!</p>
    </div>
  );
};

export default ComingSoon;
