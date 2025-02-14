"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, Calendar } from "lucide-react";
import Image from "next/image";

interface ReportedCase {
  _id: string;
  name: string;
  location: string;
  createdAt: string;
  description: string;
  photos?: string[];
}

export default function ReportDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // Retrieve the report ID from the URL
  const [report, setReport] = useState<ReportedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (localStorage.getItem("user") === null) {
      router.push("/login");
      return;
    }
    if (id) {
      const fetchReport = async () => {
        try {
          const response = await fetch(`${API_URL}/sightings/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setReport(data.data);
          } else {
            console.error("Failed to fetch report");
          }
        } catch (error) {
          console.error("Error fetching report:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchReport();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Loader size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-10">
        <p>No report data found.</p>
        <Button onClick={() => router.push("/my-reports")}>Back to My Reported Cases</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-20 py-10">
      <Button onClick={() => router.push("/my-reports")} className="mb-6">
        Back to My Reported Cases
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            {report.name || "Reported Case"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {report.location}
              </p>
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(report.createdAt).toLocaleDateString()}
              </p>
              <p className="text-sm mb-4">{report.description}</p>
            </div>
            <div>
              {report.photos && report.photos.length > 0 ? (
                <div className="grid gap-2 grid-cols-2">
                  {report.photos.map((photo: string, index: number) => (
                    <Image
                      key={index}
                      src={photo || "/placeholder.svg"}
                      alt={`Photo ${index + 1}`}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover"
                      priority
                    />
                  ))}
                </div>
              ) : (
                <p>No photos available</p>
              )}
            </div>
          </div>
          {/* Search for Matches Button */}
          <div className="mt-6">
            <Button onClick={() => { /* Add your search matching logic here */ }}>
              Search for Matches
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
