import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://metadata.layerzero-api.com/v1/metadata/deployments", {
      headers: {
        Accept: "application/json",
      },
      // Add cache control to avoid hitting the API too frequently
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching deployments:", error)
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 500 })
  }
}
