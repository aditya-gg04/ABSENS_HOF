"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Search, MapPin, Calendar, ArrowRight, Eye, User, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { setSelectedMissingPerson } from "@/lib/slices/dataSlice"; // Redux action

interface MissingPerson {
  _id: string;
  name: string;
  age: number;
  lastSeenLocation: string;
  missingDate: string;
  description: string;
  photos?: string[];
}

export default function MyMissingPersonsPage() {
  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch();
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  useEffect(() => {
    const fetchMissingPersons = async () => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/missing-persons/user`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMissingPersons(data.data);
        } else {
          console.error("Failed to fetch missing persons");
        }
      } catch (error) {
        console.error("Error fetching missing persons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissingPersons();
  }, [user, router, API_URL]);

  const handleViewDetails = (person: MissingPerson) => {
    // Dispatch the selected person to Redux
    dispatch(setSelectedMissingPerson(person));
    // Navigate to the detail page (e.g., /missing/[id])
    router.push(`/missing/${person._id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="mx-auto flex justify-center">
            <Loader size="lg" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading your missing person reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8 lg:px-12 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">My Missing Persons Reports</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/find")}
          className="mt-4 sm:mt-0"
        >
          Report New Missing Person
        </Button>
      </div>

      {missingPersons.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Search className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Missing Person Reports</h3>
          <p className="text-muted-foreground mb-6">You haven&apos;t reported any missing persons yet.</p>
          <Button onClick={() => router.push("/find")}>
            Report Missing Person
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {missingPersons.map((person) => (
            <Card
              key={person._id}
              className="overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              onClick={() => handleViewDetails(person)}
            >
              {person.photos && person.photos.length > 0 ? (
                <div className="relative w-full h-48 overflow-hidden">
                  <Image
                    src={person.photos[0]}
                    alt={`Photo of ${person.name}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    priority
                  />
                  {person.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      +{person.photos.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs">No photos</p>
                  </div>
                </div>
              )}

              <CardHeader className="p-4 sm:p-6 pb-0 sm:pb-0">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Search className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="truncate">{person.name}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-3 sm:pt-3 flex-grow">
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>Age: {person.age}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{person.lastSeenLocation}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{new Date(person.missingDate).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="h-[60px] overflow-hidden mb-2">
                  <p className="text-sm text-gray-700">
                    {person.description.length > 100
                      ? `${person.description.slice(0, 100)}...`
                      : person.description}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="w-full flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(person);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
