import { Navbar } from "@/components/navbar"
import { SpeedTestCard } from "@/components/speed-test-card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Network Speed Test</h1>
            <p className="text-muted-foreground text-lg">
              Test your internet connection speed and help build a comprehensive network performance map
            </p>
          </div>
          <SpeedTestCard />
        </div>
      </main>
    </div>
  )
}
