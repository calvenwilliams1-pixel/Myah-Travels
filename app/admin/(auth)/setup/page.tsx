import React from "react";
import { Card } from "@/components/ui/Card";

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">Welcome</h1>
        <p className="text-gray-600">
          Setup wizard coming in the next commit.
        </p>
      </Card>
    </div>
  );
}
