import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Artykuly from './Artykuly';
import ArticleView from './ArticleView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artykuly" element={<Artykuly />} />
        <Route path="/artykuly/:id" element={<ArticleView />} />
      </Routes>
    </Router>
  );
}

export default App;
