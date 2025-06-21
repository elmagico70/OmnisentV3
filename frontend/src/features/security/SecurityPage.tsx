import React from "react";
import { Shield } from "lucide-react";

export const SecurityPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Shield className="w-16 h-16 text-omni-red mb-4 animate-pulse" />
      <h1 className="text-2xl font-bold text-omni-text mb-2">Security Center</h1>
      <p className="text-omni-textDim text-center max-w-sm">
        Manage system threats, scans, and monitoring logs.
      </p>
    </div>
  );
};