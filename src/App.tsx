import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import SetupPage from "./pages/SetupPage";
import StudyPage from "./pages/StudyPage";
import LearnSetupPage from "./pages/LearnSetupPage";
import LearnPage from "./pages/LearnPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study/:datasetId" element={<SetupPage />} />
          <Route path="/study/:datasetId/session" element={<StudyPage />} />
          <Route path="/learn/:datasetId" element={<LearnSetupPage />} />
          <Route path="/learn/:datasetId/session" element={<LearnPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
