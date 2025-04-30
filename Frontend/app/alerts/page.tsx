"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, MapPin, Calendar, Loader2, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { RootState } from "@/lib/store";
import { fetchNotifications, markNotificationsAsRead } from "@/services/notification.service";
import { setNotifications, markNotificationsAsRead as markAsRead } from "@/lib/slices/dataSlice";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/lib/slices/dataSlice";

export default function AlertsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { notifications } = useSelector((state: RootState) => state.data);
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const { notifications: notifs, pagination } = await fetchNotifications(currentPage, 10);
        dispatch(setNotifications(notifs));
        setTotalPages(pagination.pages);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [isLoggedIn, currentPage, dispatch, router]);

  const handleMarkAsRead = async (notificationIds: string[]) => {
    try {
      await markNotificationsAsRead(notificationIds);
      dispatch(markAsRead(notificationIds));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead([notification._id]);
    }

    // Navigate to the appropriate page
    if (notification.relatedModel === "MissingPerson") {
      router.push(`/missing/${notification.relatedId}`);
    } else if (notification.relatedModel === "SightingReport") {
      router.push(`/report/${notification.relatedId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MISSING_PERSON":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "SIGHTING_REPORT":
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case "MATCH_FOUND":
        return <Check className="h-5 w-5 text-green-500" />;
      case "STATUS_UPDATE":
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "MISSING_PERSON":
        return "Missing Person";
      case "SIGHTING_REPORT":
        return "Sighting Report";
      case "MATCH_FOUND":
        return "Match Found";
      case "STATUS_UPDATE":
        return "Status Update";
      default:
        return "Notification";
    }
  };

  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter(notification => notification.type === activeTab);

  return (
    <div className="container py-10 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with the latest alerts and potential matches
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            Subscribe to Alerts
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="MISSING_PERSON">Missing Persons</TabsTrigger>
            <TabsTrigger value="SIGHTING_REPORT">Sightings</TabsTrigger>
            <TabsTrigger value="MATCH_FOUND">Matches</TabsTrigger>
            <TabsTrigger value="STATUS_UPDATE">Updates</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <Skeleton className="h-24 w-24 rounded-lg" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                <p className="text-muted-foreground mb-6">
                  You don&apos;t have any notifications yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification._id}
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      !notification.isRead ? "border-l-4 border-l-primary" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          {getNotificationIcon(notification.type)}
                          {notification.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {notification.isGlobal && (
                            <Badge variant="outline" className="text-xs">Global</Badge>
                          )}
                          <CardDescription>
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        {notification.image ? (
                          <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={notification.image}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="text-sm">{notification.message}</p>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <span className="flex items-center px-3">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
