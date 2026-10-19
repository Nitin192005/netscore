  "use client"

  import { useState } from "react"
  import { Button } from "@/components/ui/button"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  import { Badge } from "@/components/ui/badge"
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
  import { useToast } from "@/hooks/use-toast"
  import { Loader2, Wifi, Upload, Download, Clock, ChevronDown, MapPin, Globe } from "lucide-react"
  import { apiClient } from "@/lib/api"
  import { speedTest } from "@/lib/speedTest"

  export function SpeedTestCard() {
    const [isRunning, setIsRunning] = useState(false)
    const [result, setResult] = useState(null)
    const [savedResult, setSavedResult] = useState(null)
    const [isResultOpen, setIsResultOpen] = useState(false)
    const { toast } = useToast()

    const tryGeolocation = (enableHighAccuracy, timeout) =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null)
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: enableHighAccuracy ? "gps" : "network",
            })
          },
          () => resolve(null),
          { timeout, maximumAge: 0, enableHighAccuracy },
        )
      })

    const getCurrentLocation = async (ip) => {
      const gps = await tryGeolocation(true, 12000)
      if (gps) return gps

      const network = await tryGeolocation(false, 5000)
      if (network) return network

      const ipGeo = await apiClient.getIpGeo(ip)
      if (ipGeo?.latitude != null && ipGeo?.longitude != null) {
        return {
          latitude: ipGeo.latitude,
          longitude: ipGeo.longitude,
          location: ipGeo.location,
          source: "ip",
        }
      }

      return null
    }

    // Uses `speedTest.start()` to perform a best-effort client-side measurement.

    const runSpeedTest = async () => {
      setIsRunning(true)
      setSavedResult(null)
      setResult(null)

      try {
        toast({
          title: "Starting Speed Test",
          description: "Getting your location and testing connection...",
        })

        const ip = await apiClient.getPublicIP()
        const location = await getCurrentLocation(ip)

        if (location?.source === "ip") {
          toast({
            title: "Using approximate location",
            description: "Allow location access for GPS, or your ISP region is used instead.",
          })
        } else if (!location) {
          toast({
            title: "Location unavailable",
            description: "Speed test will save without map coordinates.",
          })
        }

        const locationName =
          location?.location ||
          (location
            ? await apiClient.reverseGeocode(location.latitude, location.longitude)
            : "Unknown")

        const measured = await speedTest.start()

        const testResult = {
          downloadSpeed: measured.download,
          uploadSpeed: measured.upload,
          ping: measured.ping,
          ip,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          location: locationName,
          locationSource: location?.source ?? null,
          simulated: measured.simulated,
        }
        setResult(testResult)

        const apiResponse = await apiClient.sendSpeedTestData({
          downloadSpeed: testResult.downloadSpeed,
          uploadSpeed: testResult.uploadSpeed,
          ping: testResult.ping,
          ip: testResult.ip,
          latitude: testResult.latitude,
          longitude: testResult.longitude,
        })

        if (apiResponse.success) {
          const saved = apiResponse.data
          setResult((prev) => ({
            ...prev,
            provider: saved?.provider,
          }))
          setSavedResult(apiResponse)
          setIsResultOpen(true)

          toast({
            title: "Speed Test Complete",
            description: "Your results have been saved successfully!",
          })
        } else {
          throw new Error(apiResponse.error || "Failed to save results")
        }
      } catch (error) {
        console.error("Speed test failed:", error)
        toast({
          title: "Speed Test Failed",
          description: error instanceof Error ? error.message : "Please try again. Check your internet connection.",
          variant: "destructive",
        })
      } finally {
        setIsRunning(false)
      }
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Wifi className="h-6 w-6" />
              <span>Internet Speed Test</span>
            </CardTitle>
            <CardDescription>
              Test your internet connection speed and help build a comprehensive network performance map
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Button onClick={runSpeedTest} disabled={isRunning} size="lg" className="w-full max-w-xs">
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  "Run Speed Test"
                )}
              </Button>
            </div>

            {result && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CardContent className="flex items-center space-x-3 p-4">
                      <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {result.downloadSpeed.toFixed(1)}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">Mbps Down</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <CardContent className="flex items-center space-x-3 p-4">
                      <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {result.uploadSpeed.toFixed(1)}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Mbps Up</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                    <CardContent className="flex items-center space-x-3 p-4">
                      <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{result.ping}</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">ms Ping</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-sm">
                      IP: {result.ip}
                    </Badge>
                    {result.provider && result.provider !== result.ip && (
                      <Badge variant="outline" className="text-sm">
                        Provider: {result.provider}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-sm">
                      Location:{" "}
                      {result.location ||
                        (result.latitude != null
                          ? `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`
                          : "Unknown")}
                      {result.locationSource === "ip" || result.locationSource === "network"
                        ? " (approximate)"
                        : ""}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {savedResult && (
          <Collapsible open={isResultOpen} onOpenChange={setIsResultOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Saved Result</span>
                      </CardTitle>
                      <CardDescription>Your test result has been saved to the database</CardDescription>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isResultOpen ? "rotate-180" : ""}`} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-sm overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(savedResult, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    )
  }
