import React from "react";

export default function TestThemePage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Theme Test</h1>
      
      <div className="bg-primary p-4 text-white rounded-lg">
        bg-primary - should be theme primary colour
      </div>
      
      <div className="bg-primary/20 p-4 rounded-lg">
        bg-primary/20 - should be 20% opacity primary
      </div>
      
      <div className="bg-primary/50 p-4 rounded-lg">
        bg-primary/50 - should be 50% opacity primary
      </div>
      
      <div className="border-2 border-primary p-4 rounded-lg">
        border-primary - should be theme primary border
      </div>
      
      <div className="text-primary font-semibold">
        text-primary - should be theme primary text
      </div>
      
      <div className="bg-secondary p-4 text-white rounded-lg">
        bg-secondary - should be theme secondary colour
      </div>
      
      <div className="bg-accent p-4 text-white rounded-lg">
        bg-accent - should be theme accent colour
      </div>
    </div>
  );
}
