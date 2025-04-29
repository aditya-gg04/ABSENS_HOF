"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MapPin, Calendar, X, Maximize2, ArrowLeft, Search, User } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
    <div className="container mx-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl">
      <Button onClick={() => router.push("/my-reports")} className="mb-4 sm:mb-6">
        <span className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Reported Cases
        </span>
      </Button>
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6 md:px-8">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl break-words">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
            <span className="truncate">{report.name || "Reported Case"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 md:px-8">
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm sm:text-base text-muted-foreground mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-grow break-words">{report.location}</span>
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-grow">
                    Reported on: {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Description</h4>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line">{report.description}</p>
              </div>
            </div>
            <div>
              {report.photos && report.photos.length > 0 ? (
                <div className="grid gap-2 xs:gap-3 sm:gap-4 grid-cols-2">
                  {report.photos.map((photo: string, index: number) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => setSelectedImage(photo)}
                    >
                      <Image
                        src={photo || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 25vw, 300px"
                        className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="text-white h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">No photos available</p>
                </div>
              )}
            </div>
          </div>
          {/* Search for Matches Button */}
          <div className="mt-8 sm:mt-10">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button
                onClick={() => handleSearchMatches(report)}
                disabled={isSearching}
                className="w-full sm:w-auto"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <Loader size="sm" />
                    <span>Searching...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Search for Matches</span>
                  </span>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Search for potential matches in missing persons database
              </p>
            </div>
          </div>
          {isSearching && (
            <div className="mt-6 flex justify-center">
              <div className="p-8 text-center">
                <Loader size="lg" />
                <p className="mt-4 text-muted-foreground">Searching for matches...</p>
              </div>
            </div>
          )}
          {!isSearching && (
            <div className="mt-8">
              {matchingResult ? (
                <MatchingResult result={matchingResult} />
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">No matches found.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try searching again or check back later for new missing person reports.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-4xl p-0 overflow-hidden bg-transparent border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <DialogClose className="absolute top-2 right-2 z-10 rounded-full p-2 bg-black/50 text-white hover:bg-black/70">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </DialogClose>
            {selectedImage && (
              <div className="relative w-full max-h-[85vh] flex items-center justify-center p-2 sm:p-4">
                <Image
                  src={selectedImage}
                  alt="Enlarged photo"
                  width={1200}
                  height={800}
                  sizes="(max-width: 640px) 95vw, (max-width: 768px) 90vw, (max-width: 1024px) 85vw, 1200px"
                  className="object-contain max-h-[85vh] rounded-lg shadow-xl"
                  priority
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const MatchingResult = ({ result }: { result: any | null }) => {
  const [selectedMatchImage, setSelectedMatchImage] = useState<string | null>(null);

  if (!result) {
    return <p className="text-center text-gray-500">No matching result found.</p>;
  }

  return (
    <div className="mt-6 sm:mt-8">
      <h3 className="text-lg sm:text-xl font-semibold mb-4">Matching Result</h3>
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-base sm:text-lg mb-2">{result.name}</h4>
                <div className="space-y-2">
                  <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow">Age: {result.age}, Gender: {result.gender}</span>
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow break-words">Last seen: {result.lastSeenLocation}</span>
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow">
                      Missing since: {new Date(result.missingDate).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2 text-sm sm:text-base">Description</h4>
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line">{result.description}</p>
              </div>
            </div>
            <div>
              {result.photos && result.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {result.photos.map((photo: string, photoIndex: number) => (
                    <div
                      key={photoIndex}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => setSelectedMatchImage(photo)}
                    >
                      <Image
                        src={photo || "/placeholder.svg"}
                        alt={`Missing person photo ${photoIndex + 1}`}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 25vw, 200px"
                        className="rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="text-white h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-500">No photos available</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Modal for Matching Results */}
      <Dialog open={!!selectedMatchImage} onOpenChange={(open) => !open && setSelectedMatchImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-4xl p-0 overflow-hidden bg-transparent border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <DialogClose className="absolute top-2 right-2 z-10 rounded-full p-2 bg-black/50 text-white hover:bg-black/70">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </DialogClose>
            {selectedMatchImage && (
              <div className="relative w-full max-h-[85vh] flex items-center justify-center p-2 sm:p-4">
                <Image
                  src={selectedMatchImage}
                  alt="Enlarged photo"
                  width={1200}
                  height={800}
                  sizes="(max-width: 640px) 95vw, (max-width: 768px) 90vw, (max-width: 1024px) 85vw, 1200px"
                  className="object-contain max-h-[85vh] rounded-lg shadow-xl"
                  priority
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
