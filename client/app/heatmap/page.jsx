import { Navbar } from "@/components/navbar"
import { MapComponent } from "@/components/map-component"

export default function HeatMapPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Network Performance Heat Map</h1>
          <p className="text-muted-foreground text-lg">Visualize network performance data across different locations</p>
        </div>
        <MapComponent />
      </main>
    </div>
  )
}
