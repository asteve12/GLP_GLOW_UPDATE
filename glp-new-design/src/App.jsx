import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsSection from './components/StatsSection';
import ProductShowcase from './components/ProductShowcase';

import ProductDetails from './components/ProductDetails';
import QualifyNow from './components/QualifyNow';
import Assessment from './components/Assessment';
import ProgressQuestionnaire from './components/ProgressQuestionnaire';
import LoginPage from './components/LoginPage';
import { useEffect, useState } from 'react';
import Loader from './components/Loader';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import SignUpPage from './components/SignUpPage';

import ReviewSlider from './components/ReviewSlider';
import WellnessSection from './components/WellnessSection';
import MadeInAmerica from './components/MadeInAmerica';
import DoctorSlider from './components/DoctorSlider';
import Footer from './components/Footer';
import LegalPage from './components/LegalPage';
import SatisfactionSurvey from './components/SatisfactionSurvey';
import NewLandingPage from './components/NewLandingPage';
import { Toaster } from 'react-hot-toast';

const ScrollToHash = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);
  return null;
};

const HomePage = () => (
  <NewLandingPage />
);

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => setIsLoaded(true);

    // Check if already loaded
    if (document.readyState === 'complete') {
      setIsLoaded(true);
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <Router>
      <Toaster position="top-right" />
      {isLoading && <Loader loaded={isLoaded} onComplete={() => setIsLoading(false)} />}
      <div className="font-sans text-text-main bg-bg-primary min-h-screen">
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/qualify" element={<QualifyNow />} />
          <Route path="/assessment/:categoryId" element={<Assessment />} />
          <Route path="/progress/:category" element={<ProgressQuestionnaire />} />
          <Route path="/satisfaction-survey" element={<SatisfactionSurvey />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          <Route path="/terms-conditions" element={
            <LegalPage title="Terms & Conditions" content={
              <div className="space-y-12 pb-20">
                <section>
                  <p className="text-black/90 text-xl">Last Updated: February 25, 2026</p>
                  <p className="mt-4">These Terms and Conditions ("Terms") constitute a legally binding agreement between you and <sub>u</sub>GLOW<sup>MD</sup> regarding your access to and use of our telemedicine platform. By creating an account or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-1 px-0 bg-black"></div>
                    <h3 className="text-black text-3xl font-black uppercase tracking-tighter">1. Telemedicine Services & Eligibility</h3>
                  </div>
                  <div className="space-y-4 font-normal text-black/60">
                    <p><sub>u</sub>GLOW<sup>MD</sup> provides a platform for patients to connect with independent healthcare providers ("Providers"). <sub>u</sub>GLOW<sup>MD</sup> does not practice medicine and does not interfere with the clinical judgment of Providers.</p>
                    <p><strong className="text-black">Emergency Situations:</strong> THE SERVICES ARE NOT FOR EMERGENCIES. IF YOU BELIEVE YOU ARE EXPERIENCING A MEDICAL EMERGENCY, CALL 911 IMMEDIATELY OR GO TO THE NEAREST EMERGENCY ROOM.</p>
                    <p><strong className="text-black">Interstate Practice:</strong> Services are only available to residents in states where our Providers are licensed to practice. You agree to provide accurate location data at all times.</p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-1 px-0 bg-black"></div>
                    <h3 className="text-black text-3xl font-black uppercase tracking-tighter">2. Risk Prevention & Clinical protocols</h3>
                  </div>
                  <div className="space-y-4 font-normal text-black/60 text-base">
                    <p>To protect both patients and Providers, you agree to follow all clinical protocols, including but not limited to:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Providing 100% accurate, complete, and truthful information regarding your medical history, current medications, and vitals (including BMI and weight).</li>
                      <li>Completing all required blood tests, follow-up assessments, and "check-ins" as mandated by your Provider.</li>
                      <li>Immediately reporting any adverse side effects or changes in your health status to your Provider via the secure portal.</li>
                    </ul>
                    <p>Failure to provide accurate data or follow protocols constitutes a material breach of these Terms and absolves the Provider and Platform of liability for resulting adverse outcomes.</p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-1 px-0 bg-black"></div>
                    <h3 className="text-black text-3xl font-black uppercase tracking-tighter">3. No Guarantee of Prescription</h3>
                  </div>
                  <div className="space-y-4 font-normal text-black/60">
                    <p>The decision to prescribe medication is at the <strong className="text-black">sole and absolute discretion</strong> of the licensed Provider. Payment for an assessment does not guarantee a prescription. If a Provider determines that you are not a clinical candidate for treatment, you may be issued a refund in accordance with our Refund Policy.</p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-1 px-0 bg-black"></div>
                    <h3 className="text-black text-3xl font-black uppercase tracking-tighter">4. Limitation of Liability & Indemnity</h3>
                  </div>
                  <div className="space-y-4 font-normal text-black/60">
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, <sub>u</sub>GLOW<sup>MD</sup>, its affiliates, and Providers shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform or prescribed medications.</p>
                    <p>You agree to indemnify and hold harmless the Platform and its Providers from any claims, losses, or legal fees resulting from your intentional provision of false medical data or failure to follow prescribed protocols.</p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-1 px-0 bg-black"></div>
                    <h3 className="text-black text-3xl font-black uppercase tracking-tighter">5. Dispute Resolution & Arbitration</h3>
                  </div>
                  <div className="space-y-4 font-normal text-black/60">
                    <p>Any dispute arising from these terms or your care shall be resolved via <strong className="text-black">binding individual arbitration</strong>. You waive your right to participate in a class-action lawsuit or a jury trial.</p>
                  </div>
                </section>

                <section className="pt-8 border-t border-black/10">
                  <p className="text-[10px] uppercase tracking-widest text-black/30">
                    Compliance Verification: federal medical board standards (fmbs) • ryan haight act compliant • hipaa certified infrastructure
                  </p>
                </section>
              </div>
            } />
          } />

          <Route path="/privacy-policy" element={
            <LegalPage title="Privacy Policy" content={
              <div className="space-y-6">
                <p>We take your privacy seriously. This policy explains how we collect, use, and protect your personal and health information.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">1. Information Collection</h3>
                <p>We collect information you provide, including contact details, medical history, and payment information, to provide our services.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">2. Use of Information</h3>
                <p>Your information is used to facilitate medical consultations, process orders, and improve our services.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">3. PHI Security</h3>
                <p>We utilize industry-standard encryption and security measures to protect your Personal Health Information in compliance with HIPAA.</p>
              </div>
            } />
          } />

          <Route path="/telehealth-consent" element={
            <LegalPage title="Telehealth Consent" content={
              <div className="space-y-6">
                <p>Telehealth involves the use of electronic communications to enable health care providers at a different location from the patient to share individual patient medical information for the purpose of improving patient care.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">1. Nature of Telehealth</h3>
                <p>You understand that telehealth involves the transmission of medical data through digital means and may not be the same as an in-person visit.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">2. Risks and Benefits</h3>
                <p>Benefits include easier access to care. Risks include technical failures and potential limitations in the physical examination.</p>
              </div>
            } />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
