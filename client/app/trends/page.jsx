import { Navbar } from "@/components/navbar"
import { TrendsAnalysis } from "@/components/trends-analysis"

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Trend Analysis</h1>
          <p className="text-muted-foreground text-lg">
            Analyze network performance trends by provider, location, and time
          </p>
        </div>
        <TrendsAnalysis />
      </main>
    </div>
  )
}
