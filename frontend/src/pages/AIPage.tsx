import React from "react";
import { Brain } from "lucide-react";

export const AIPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Brain className="w-16 h-16 text-omni-purple mb-4 animate-pulse" />
      <h1 className="text-2xl font-bold text-omni-text mb-2">AI Assistant</h1>
      <p className="text-omni-textDim text-center max-w-sm">
        This module will integrate the local/offline AI chat agent.
      </p>
    </div>
  );
};