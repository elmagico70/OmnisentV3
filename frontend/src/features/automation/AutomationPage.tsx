import React from "react";
import { Workflow } from "lucide-react";

export const AutomationPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Workflow className="w-16 h-16 text-omni-yellow mb-4 animate-pulse" />
      <h1 className="text-2xl font-bold text-omni-text mb-2">Automation Hub</h1>
      <p className="text-omni-textDim text-center max-w-sm">
        Automate workflows, background tasks, and system routines.
      </p>
    </div>
  );
};