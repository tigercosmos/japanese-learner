import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SetupPage from "./pages/SetupPage";
import StudyPage from "./pages/StudyPage";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study/:datasetId" element={<SetupPage />} />
          <Route path="/study/:datasetId/session" element={<StudyPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
