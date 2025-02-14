"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, MapPin, Calendar } from "lucide-react"

interface ReportedCase {
  _id: string
  name: string
  location: string
  createdAt: string
  description: string
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<ReportedCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const user = useSelector((state: any) => state.auth.user)

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch("http://localhost:5000/api/v1/sightings/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        })

        if (response.ok) {
          const data = await response.json();
          setReports(data.data);
          // console.log("data.data",data.data)

        } else {
          console.error("Failed to fetch reports")
        }
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [user, router])

  if (isLoading) {
    return <Loader size="lg" />
  }

  return (
    <div className="container mx-auto px-20 py-10">
      <h1 className="text-3xl font-bold mb-6">My Reported Cases</h1>
      {reports.length === 0 ? (
        <p>You haven&apos;t reported any cases yet.</p>
      ) : (
        <div className="grid gap-6 grid-cols-3">
          {reports.map((report) => (
            <Card key={report._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  {report.name || "Unknown Person"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {report.location}
                </p>
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm mb-4">
                  {report.description.slice(0, 100)}...
                </p>
                <Button onClick={() => router.push(`/report/${report._id}`)}>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
