import { HeroSection } from "@/components/hero-section"
import { FeatureSection } from "@/components/feature-section"
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
      </main>
      <Footer />
    </div>
  )
}

