"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Calendar } from "lucide-react";
import { setSelectedMissingPerson } from "@/lib/slices/dataSlice"; // Redux action

interface MissingPerson {
  _id: string;
  name: string;
  age: number;
  lastSeenLocation: string;
  missingDate: string;
  description: string;
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
    return <Loader size="lg" />;
  }

  return (
    <div className="container px-20 py-10">
      <h1 className="text-3xl font-bold mb-6">My Missing Persons Reports</h1>
      {missingPersons.length === 0 ? (
        <p>You haven&apos;t reported any missing persons yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {missingPersons.map((person) => (
            <Card key={person._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-red-500" />
                  {person.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Age: {person.age}</p>
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {person.lastSeenLocation}
                </p>
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(person.missingDate).toLocaleDateString()}
                </p>
                <p className="text-sm mb-4">{person.description.slice(0, 100)}...</p>
                <Button onClick={() => handleViewDetails(person)}>View Details</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
