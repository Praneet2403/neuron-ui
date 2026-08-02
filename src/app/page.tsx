import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ScrollStackSection from "@/components/ScrollStackSection";
import CoreCapabilities from "@/components/CoreCapabilities";
import BuiltForTeams from "@/components/BuiltForTeams";
import Testimonials from "@/components/Testimonials";
import CalSchedule from "@/components/CalSchedule";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <div id="hero">
        <Hero />
      </div>
      <div id="projects">
        <ScrollStackSection />
      </div>
      <div id="services">
        <CoreCapabilities />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <div id="teams">
        <BuiltForTeams />
      </div>
      <div id="contact">
        <CalSchedule />
      </div>
      <Footer />
    </main>
  );
}
