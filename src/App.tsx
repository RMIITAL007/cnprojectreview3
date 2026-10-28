import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TopologyPage from './pages/TopologyPage';
import SynFloodPage from './pages/SynFloodPage';
import ArpSpoofPage from './pages/ArpSpoofPage';
import MacFloodPage from './pages/MacFloodPage';
import TrafficAnalysisPage from './pages/TrafficAnalysisPage';
import ConfigLabPage from './pages/ConfigLabPage';
import ResultsPage from './pages/ResultsPage';
import DocumentationPage from './pages/DocumentationPage';

export default function App() {
  return (
    <div className="min-h-screen bg-navy-950 text-gray-100 flex flex-col font-sans antialiased selection:bg-cyber-blue selection:text-navy-950">
      <Navbar />
      <main className="flex-1 pb-12">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topology" element={<TopologyPage />} />
          <Route path="/syn-flood" element={<SynFloodPage />} />
          <Route path="/arp-spoof" element={<ArpSpoofPage />} />
          <Route path="/mac-flood" element={<MacFloodPage />} />
          <Route path="/traffic" element={<TrafficAnalysisPage />} />
          <Route path="/config" element={<ConfigLabPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/docs" element={<DocumentationPage />} />
        </Routes>
      </main>

      <footer className="border-t border-white/5 bg-navy-900/60 py-6 text-center text-xs text-gray-500">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyber-blue" />
            <span className="font-semibold text-gray-300">Enterprise LAN Layer 2/3 Attack & Mitigation Laboratory</span>
          </div>
          <div>Computer Networks Project Review 3 &bull; NS2, Cisco Packet Tracer & Wireshark Simulation</div>
          <div className="font-mono text-[11px] text-gray-500">Academic Laboratory Demonstrator</div>
        </div>
      </footer>
    </div>
  );
}
