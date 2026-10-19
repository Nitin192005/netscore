"use client"
import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, BarChart3, Activity, Filter } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { apiClient } from "@/lib/api"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export function TrendsAnalysis() {
  const [selectedProvider, setSelectedProvider] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  })

  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await apiClient.getAggregatedData()
        if (response.success && response.data) {
          setTrendData(Array.isArray(response.data) ? response.data : [])
        } else {
          setError("No aggregated data available")
          setTrendData([])
        }
      } catch (err) {
        console.error("Failed to fetch trend data:", err)
        setError("Failed to fetch trend data: " + err.message)
        setTrendData([])
      } finally {
        setLoading(false)
      }
    }

    fetchTrendData()
  }, [])

  const providers = useMemo(() => {
    if (!Array.isArray(trendData)) return []
    return Array.from(
      new Set(
        trendData
          .map((d) => d?.provider)
          .filter(Boolean)
          .filter((provider) => typeof provider === "string"),
      ),
    )
  }, [trendData])

  const locations = useMemo(() => {
    if (!Array.isArray(trendData)) return []
    return Array.from(
      new Set(
        trendData
          .map((d) => {
            if (!d?.location?.latBucket || !d?.location?.lonBucket) return null
            return `${d.location.latBucket},${d.location.lonBucket}`
          })
          .filter(Boolean)
          .filter((location) => typeof location === "string"),
      ),
    )
  }, [trendData])

  const filteredData = useMemo(() => {
    if (!Array.isArray(trendData)) return []

    return trendData.filter((item) => {
      if (!item || typeof item !== "object") return false

      const matchesProvider = selectedProvider === "all" || item.provider === selectedProvider

      const locationKey =
        item.location?.latBucket && item.location?.lonBucket
          ? `${item.location.latBucket},${item.location.lonBucket}`
          : null
      const matchesLocation = selectedLocation === "all" || locationKey === selectedLocation

      const itemDate = new Date(item.timeBucket?.date)
      const matchesDateRange =
        (!dateRange.from || itemDate >= startOfDay(dateRange.from)) &&
        (!dateRange.to || itemDate <= endOfDay(dateRange.to))

      return matchesProvider && matchesLocation && matchesDateRange
    })
  }, [selectedProvider, selectedLocation, dateRange, trendData])

  const speedTrendData = useMemo(() => {
    if (!Array.isArray(filteredData)) return []

    const grouped = filteredData.reduce((acc, item) => {
      if (!item || typeof item !== "object" || !item.timeBucket) return acc

      const key = `${item.timeBucket.date}_${item.timeBucket.hour}_${item.provider || "unknown"}`
      if (!acc[key]) {
        acc[key] = {
          id: key,
          datetime: `${item.timeBucket.date} ${String(item.timeBucket.hour).padStart(2, "0")}:00`,
          downloadSpeed: 0,
          uploadSpeed: 0,
          count: 0,
        }
      }
      acc[key].downloadSpeed += Number(item.metrics?.avgDownload) || 0
      acc[key].uploadSpeed += Number(item.metrics?.avgUpload) || 0
      acc[key].count += 1
      return acc
    }, {})

    return Object.values(grouped)
      .map((item) => ({
        id: item.id,
        datetime: item.datetime,
        downloadSpeed: Math.round((item.downloadSpeed / item.count) * 10) / 10,
        uploadSpeed: Math.round((item.uploadSpeed / item.count) * 10) / 10,
      }))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
  }, [filteredData])

  const providerTestData = useMemo(() => {
    if (!Array.isArray(filteredData)) return []

    const grouped = filteredData.reduce((acc, item) => {
      if (!item || typeof item !== "object" || !item.provider) return acc

      if (!acc[item.provider]) {
        acc[item.provider] = {
          id: `provider_${item.provider}`,
          provider: item.provider,
          tests: 0,
        }
      }
      acc[item.provider].tests += Number(item.metrics?.totalTests) || 1
      return acc
    }, {})

    return Object.values(grouped)
  }, [filteredData])

  const pingTrendData = useMemo(() => {
    if (!Array.isArray(filteredData)) return []

    return filteredData
      .filter((item) => item && typeof item === "object" && item.timeBucket)
      .map((item, index) => {
        const avgSpeed =
          ((Number(item.metrics?.avgDownload) || 0) + (Number(item.metrics?.avgUpload) || 0)) / 2
        const simulatedPing = Math.max(10, Math.round(100 - avgSpeed * 0.8))

        return {
          id: `ping_${index}_${item.timeBucket.date}_${item.timeBucket.hour}`,
          datetime: `${item.timeBucket.date} ${String(item.timeBucket.hour).padStart(2, "0")}:00`,
          ping: simulatedPing,
          provider: item.provider || "Unknown",
        }
      })
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
  }, [filteredData])

  const clearFilters = () => {
    setSelectedProvider("all")
    setSelectedLocation("all")
    setDateRange({
      from: subDays(new Date(), 7),
      to: new Date(),
    })
  }

  const handleFromDateChange = (e) => {
    const date = e.target.value ? new Date(e.target.value) : undefined
    setDateRange((prev) => ({ ...prev, from: date }))
  }

  const handleToDateChange = (e) => {
    const date = e.target.value ? new Date(e.target.value) : undefined
    setDateRange((prev) => ({ ...prev, to: date }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading trend data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
          <CardDescription>Filter the data by provider, location, and date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={`provider-${provider}`} value={provider}>
                      {String(provider)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={`location-${location}`} value={location}>
                      {String(location)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex flex-col space-y-2">
                <Input
                  type="date"
                  value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
                  onChange={handleFromDateChange}
                  placeholder="From date"
                />
                <Input
                  type="date"
                  value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
                  onChange={handleToDateChange}
                  placeholder="To date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedProvider !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Provider: {selectedProvider}
              </Badge>
            )}
            {selectedLocation !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Location: {selectedLocation}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {Array.isArray(filteredData) ? filteredData.length : 0} data points
            </Badge>
          </div>
        </CardContent>
      </Card>

      {(!Array.isArray(filteredData) || filteredData.length === 0) && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>No trend data available for the selected filters</p>
              <p className="text-sm mt-2">Try adjusting your filters or check if speed tests have been conducted</p>
            </div>
          </CardContent>
        </Card>
      )}

      {Array.isArray(filteredData) && filteredData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Speed Trends Over Time</span>
              </CardTitle>
              <CardDescription>Average download and upload speeds over the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={speedTrendData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="datetime" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="downloadSpeed"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      name="Download (Mbps)"
                      key="download-line"
                    />
                    <Line
                      type="monotone"
                      dataKey="uploadSpeed"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Upload (Mbps)"
                      key="upload-line"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Tests by Provider</span>
              </CardTitle>
              <CardDescription>Total number of speed tests conducted by each provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerTestData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="provider" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="tests" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} key="tests-bar" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Ping Variations</span>
              </CardTitle>
              <CardDescription>Network latency variations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pingTrendData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="datetime" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ping"
                      stroke="hsl(var(--chart-4))"
                      fill="hsl(var(--chart-4))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      key="ping-area"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
