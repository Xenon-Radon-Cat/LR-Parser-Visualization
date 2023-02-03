import logo from './logo.svg';
import './App.css';
import { Lexical } from './pages/lexicalAnalysis';
import { LLgramma } from './pages/LLgrammaAnalysis';
import { LRgramma } from './pages/LRgrammaAnalysis';
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/Lexical" element={<Lexical/>} />
          <Route path="/LLgramma" element={<LLgramma/>}/>
          <Route path="/LRgramma" element={<LRgramma/>}/>
          <Route path="/LLgramma" element={<LLgramma/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
