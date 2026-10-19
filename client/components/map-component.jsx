"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2, X, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function MapComponent() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const leafletRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [aggregatedData, setAggregatedData] = useState([])
  const [selectedMarker, setSelectedMarker] = useState(null)
  const { toast } = useToast()

  const getSpeedColor = (avgDownload) => {
    if (avgDownload >= 40) return "#22c55e" // Green for high speeds
    if (avgDownload >= 30) return "#eab308" // Yellow for medium speeds
    if (avgDownload >= 20) return "#f97316" // Orange for low speeds
    return "#ef4444" // Red for very low speeds
  }

  const loadAggregatedData = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getAggregatedData()

      if (response.success && response.data) {
        setAggregatedData(response.data)
      } else {
        throw new Error(response.error || "Failed to load data")
      }
    } catch (error) {
      console.error("Failed to load aggregated data:", error)
      toast({
        title: "Failed to Load Data",
        description: error instanceof Error ? error.message : "Please try refreshing the page.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeMap = async () => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      // Ensure the container element is properly mounted and has dimensions
      const container = mapRef.current
      if (!container || container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn("Map container not ready, retrying...")
        setTimeout(initializeMap, 100)
        return
      }

      // Dynamically import Leaflet to avoid SSR issues
      const L = (await import("leaflet")).default
      leafletRef.current = L

      // Fix for default markers in Leaflet with Next.js
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      // Double-check container is still valid before creating map
      if (!container.parentNode) {
        console.warn("Map container not in DOM")
        return
      }

      // Initialize map centered on India
      const map = L.map(container, {
        preferCanvas: false,
        attributionControl: true,
        zoomControl: true,
      }).setView([20.5937, 78.9629], 5)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map

      // Load and display data
      await loadAggregatedData()
    } catch (error) {
      console.error("Failed to initialize map:", error)
      toast({
        title: "Map Initialization Failed",
        description: "Please refresh the page to try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!mapInstanceRef.current || !aggregatedData.length || !leafletRef.current) return

    const L = leafletRef.current

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Add markers for each aggregated data point
    aggregatedData.forEach((data) => {
      try {
        // Validate coordinates before creating marker
        const lat = Number.parseFloat(data.location?.latBucket)
        const lng = Number.parseFloat(data.location?.lonBucket)

        // Check if coordinates are valid numbers and within valid ranges
        if (
          isNaN(lat) ||
          isNaN(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180 ||
          !data.metrics?.avgDownload ||
          !data.metrics?.totalTests
        ) {
          console.warn("Invalid data point skipped:", data)
          return
        }

        const color = getSpeedColor(data.metrics.avgDownload)

        // Create custom colored marker
        const customIcon = L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background-color: ${color};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: white;
          ">${data.metrics.totalTests}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        const marker = L.marker([lat, lng], {
          icon: customIcon,
        }).addTo(mapInstanceRef.current)

        // Add click event to show details
        marker.on("click", () => {
          setSelectedMarker(data)
        })
      } catch (error) {
        console.error("Error creating marker for data point:", data, error)
      }
    })
  }, [aggregatedData])

  useEffect(() => {
    const timer = setTimeout(() => {
      initializeMap()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <Card className="h-[600px] relative overflow-hidden">
        <CardHeader className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Interactive Network Performance Map</span>
              </CardTitle>
              <CardDescription>Click on markers to view detailed performance data for each location</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadAggregatedData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                High Speed
              </Badge>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
                Medium Speed
              </Badge>
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                Low Speed
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full pt-24">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Loading network performance data...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </CardContent>
      </Card>

      {selectedMarker && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: getSpeedColor(selectedMarker.metrics.avgDownload) }}
                />
                <CardTitle className="text-lg">
                  {selectedMarker.location?.latBucket != null && selectedMarker.location?.lonBucket != null
                    ? `${selectedMarker.location.latBucket}, ${selectedMarker.location.lonBucket}`
                    : "Unknown location"}
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMarker(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Provider: {selectedMarker.provider}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Download</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedMarker.metrics.avgDownload.toFixed(1)} Mbps
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Upload</p>
                <p className="text-2xl font-bold text-blue-600">{selectedMarker.metrics.avgUpload.toFixed(1)} Mbps</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold text-primary">{selectedMarker.metrics.totalTests}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">{new Date(selectedMarker.lastUpdated).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Download Range</p>
                  <p className="font-medium">
                    {selectedMarker.metrics.minDownload.toFixed(1)} - {selectedMarker.metrics.maxDownload.toFixed(1)}{" "}
                    Mbps
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Upload Range</p>
                  <p className="font-medium">
                    {selectedMarker.metrics.minUpload.toFixed(1)} - {selectedMarker.metrics.maxUpload.toFixed(1)} Mbps
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
    </div>
  )
}
