import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CodeUpload from "./pages/CodeUpload";
import Vulnerabilities from "./pages/Vulnerabilities";
import LLMVotes from "./pages/LLMVotes";
import ModelsPage from "./pages/ModelsPage";

export default function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/upload" element={<CodeUpload />} />
                        <Route path="/vulns" element={<Vulnerabilities />} />
                        <Route path="/votes" element={<LLMVotes />} />
                        <Route path="/models" element={<ModelsPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}
