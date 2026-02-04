import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsSection from './components/StatsSection';
import ProductShowcase from './components/ProductShowcase';
import ProductPage from './components/ProductPage';
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
  <>
    <Navbar />
    <Hero />
    <StatsSection>
      <ProductShowcase />
    </StatsSection>
    <ReviewSlider />
    <WellnessSection />
    <MadeInAmerica />
    <DoctorSlider />
    <Footer />
  </>
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
      {isLoading && <Loader loaded={isLoaded} onComplete={() => setIsLoading(false)} />}
      <div className="font-sans text-text-main bg-bg-primary min-h-screen">
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:categoryId" element={<ProductPage />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/qualify" element={<QualifyNow />} />
          <Route path="/assessment/:categoryId" element={<Assessment />} />
          <Route path="/progress/:category" element={<ProgressQuestionnaire />} />

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
              <div className="space-y-6">
                <p>Welcome to GLP-GLOW. By accessing or using our platform, you agree to be bound by these Terms and Conditions.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">1. Medical Disclaimer</h3>
                <p>The content on this site is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">2. User Eligibility</h3>
                <p>You must be at least 18 years of age and a resident of a state where our services are available to use this platform.</p>
                <h3 className="text-white text-2xl font-bold mt-8 italic">3. Prescriptions</h3>
                <p>Prescriptions are only provided after a medical consultation with a licensed provider and are subject to the provider's professional discretion.</p>
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
