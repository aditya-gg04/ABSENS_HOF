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
  // Change matchingResults from an array to a single object
  const [matchingResult, setMatchingResult] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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
  }, [id, router, API_URL]);

  const handleSearchMatches = async (person: ReportedCase): Promise<void> => {
    setIsSearching(true);
    setMatchingResult(null); // Reset matching result
    try {
      const formData: FormData = new FormData();
      formData.append("user_id", person._id);
      person.photos?.forEach((photoUrl: string) => {
        formData.append("image_urls", photoUrl);
      });

      const FIND_MISSING_API_URL = process.env.NEXT_PUBLIC_IMAGE_RECOGNITION_URL;
      const response: Response = await fetch(
        `${FIND_MISSING_API_URL}/search-report-missing`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send image URLs to API");
      }

      const responseData: any = await response.json();
      // console.log("API response:", responseData);

      if (responseData.success === false) {
        // No matches found
        return;
      }

      // Extract the match ID (assuming responseData.match is an array)
      const matchId = responseData.match[0]?.id;
      if (!matchId) {
        setMatchingResult(null);
        return;
      }

      // Fetch matching result using the received ID
      const matchingResponse = await fetch(`${API_URL}/missing-persons/${matchId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!matchingResponse.ok) {
        throw new Error("Failed to fetch matching results");
      }

      const matchingData = await matchingResponse.json();
      // console.log("Matching data:", matchingData.data);
      // Store the matching result as a single object
      setMatchingResult(matchingData.data || null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error in handleSearchMatches:", error.message);
      } else {
        console.error("Unknown error in handleSearchMatches");
      }
    } finally {
      setIsSearching(false);
    }
  };

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
        <Button onClick={() => router.push("/my-reports")}>
          Back to My Reported Cases
        </Button>
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
            <Button
              onClick={() => handleSearchMatches(report)}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader size="sm" />
                  Searching...
                </>
              ) : (
                "Search for Matches"
              )}
            </Button>
          </div>
          {!isSearching && (
            <div className="mt-6">
              {matchingResult ? (
                <MatchingResult result={matchingResult} />
              ) : (
                <p className="text-center text-gray-500">No matches found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const MatchingResult = ({ result }: { result: any | null }) => {
  if (!result) {
    return <p className="text-center text-gray-500">No matching result found.</p>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold">Matching Result</h3>
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold">{result.name}</h4>
          <p className="text-sm text-muted-foreground">Age: {result.age}</p>
          <p className="text-sm text-muted-foreground">Gender: {result.gender}</p>
          <p className="text-sm text-muted-foreground">
            Last seen: {result.lastSeenLocation}
          </p>
          <p className="text-sm text-muted-foreground">
            Missing since: {new Date(result.missingDate).toLocaleDateString()}
          </p>
          <p className="mt-2">{result.description}</p>
          {result.photos && result.photos.length > 0 && (
            <div className="mt-2 flex space-x-2">
              {result.photos.map((photo: string, photoIndex: number) => (
                <Image
                  key={photoIndex}
                  src={photo || "/placeholder.svg"}
                  alt={`Missing person photo ${photoIndex + 1}`}
                  width={100}
                  height={100}
                  className="rounded-md object-cover"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
