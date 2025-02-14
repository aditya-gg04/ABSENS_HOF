"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Calendar, User } from "lucide-react";
import Image from "next/image";

interface MissingPerson {
  _id: string;
  name: string;
  age: number;
  gender: string;
  lastSeenLocation: string;
  missingDate: string;
  description: string;
  photos: string[];
}

export default function MissingPersonDetailPage() {
  const router = useRouter();
  const { id } = useParams(); // Get the missing person ID from the URL
  const [person, setPerson] = useState<MissingPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (id) {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        router.push("/login");
        return;
      }
      const fetchPerson = async () => {
        try {
          const response = await fetch(`${API_URL}/missing-persons/${id}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setPerson(data.data);
          } else {
            console.error("Failed to fetch missing person");
          }
        } catch (error) {
          console.error("Error fetching missing person:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchPerson();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="container py-10">
        <p>Loading...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="container py-10">
        <p>No missing person data found.</p>
        <Button onClick={() => router.push("/my-missing")}>
          Back to My Missing Persons
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 px-20">
      <Button onClick={() => router.push("/my-missing")} className="mb-6">
        Back to My Missing Persons
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6 text-red-500" />
            {person.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <User className="h-4 w-4" />
                Age: {person.age}, Gender: {person.gender}
              </p>
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Last seen: {person.lastSeenLocation}
              </p>
              <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Missing since: {new Date(person.missingDate).toLocaleDateString()}
              </p>
              <p className="text-sm mb-4">{person.description}</p>
            </div>
            <div>
              {person.photos && person.photos.length > 0 ? (
                <div className="grid gap-2 grid-cols-2">
                  {person.photos.map((photo: string, index: number) => (
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
