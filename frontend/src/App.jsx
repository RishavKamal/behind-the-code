import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import About from "./pages/About";
import Topics from "./pages/Topics";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Homepage */}
        <Route path="/" element={<Home />} />

        {/* Articles */}
        <Route path="/articles" element={<Articles />} />

        {/* Individual article */}
        <Route path="/articles/:slug" element={<Article />} />

        {/* Topics */}
        <Route path="/topics" element={<Topics />} />

        {/* About */}
        <Route path="/about" element={<About />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;