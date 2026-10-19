export class ApiClient {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"
  }

  async sendSpeedTestData(data) {
    try {
      const response = await fetch(`${this.baseUrl}/sendData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send data")
      }

      return result
    } catch (error) {
      console.error("API Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async getAggregatedData() {
    try {
      const response = await fetch(`${this.baseUrl}/aggregated`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data")
      }

      return result
    } catch (error) {
      console.error("API Error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  async getPublicIP() {
    const fallback = "192.168.1.10"
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 4000)
      const response = await fetch("https://api.ipify.org?format=json", {
        signal: controller.signal,
      })
      clearTimeout(timer)
      const data = await response.json()
      return data.ip || fallback
    } catch {
      return fallback
    }
  }

  async getIpGeo(ip) {
    try {
      const response = await fetch(
        `${this.baseUrl}/ip-geo?ip=${encodeURIComponent(ip)}`,
      )
      const result = await response.json()
      if (!response.ok || !result.success) return null
      return result.data
    } catch {
      return null
    }
  }

  // Proxied through our API so browser never hits Nominatim (DNS/CORS noise)
  async reverseGeocode(lat, lon) {
    const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      )
      const result = await response.json()
      return result?.data?.location || fallback
    } catch {
      return fallback
    }
  }
}

export const apiClient = new ApiClient()
