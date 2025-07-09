import React from 'react';
import Aurora from './Aurora';

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Aurora
        colorStops={["#FFFFFF", "#F8F8FF", "#F0F0F0"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      {/* Strona bloga Straylight */}
    </div>
  );
}

export default App;
