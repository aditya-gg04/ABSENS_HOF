"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { AlertTriangle, MapPin, Calendar, Eye, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface ReportedCase {
  _id: string
  name: string
  location: string
  createdAt: string
  description: string
  photos?: string[]
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<ReportedCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const user = useSelector((state: any) => state.auth.user)
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${API_URL}/sightings/user`, {
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
  }, [user, router, API_URL])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Loader size="lg" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading your reported cases...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">My Reported Cases</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/report")}
          className="mt-4 sm:mt-0"
        >
          Report New Case
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
          <p className="text-muted-foreground mb-6">You haven&apos;t reported any cases yet.</p>
          <Button onClick={() => router.push("/report")}>
            Report a Sighting
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className="group relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/report/${report._id}`)}
            >
              {/* Image Container - Larger and more prominent */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                {report.photos && report.photos.length > 0 ? (
                  <>
                    <Image
                      src={report.photos[0] || "/placeholder.svg"}
                      alt={`Photo of ${report.name || "reported case"}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      priority
                      onError={(e) => {
                        // When image fails to load, replace with placeholder
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // Prevent infinite loop
                        target.src = "/placeholder.svg";
                      }}
                    />
                    {report.photos.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        +{report.photos.length - 1}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm">No photos</p>
                    </div>
                  </div>
                )}

                {/* Overlay with essential info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-yellow-300 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-lg truncate">{report.name || "Unknown Person"}</h3>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/90 text-xs">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Details Button - Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/report/${report._id}`);
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    View Details
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
