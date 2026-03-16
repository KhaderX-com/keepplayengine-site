"use client";

import { useFcmToken } from "@/hooks/use-fcm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, ShieldCheck, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NotificationSettings() {
    const { token, notificationPermission, requestPermission, refreshToken, error, isRegistering } = useFcmToken();

    const isPermissionGranted = notificationPermission === "granted";
    const isDeviceRegistered = isPermissionGranted && !!token;

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Push Notifications
                </CardTitle>
                <CardDescription>
                    Enable notifications to receive alerts about critical events like withdrawal requests.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="space-y-1">
                        <h4 className="font-medium text-sm">Status</h4>
                        <p className="text-sm text-gray-500">
                            {isDeviceRegistered
                                ? "Notifications are enabled on this device"
                                : isPermissionGranted
                                ? "Permission granted, but this device is not registered yet"
                                : notificationPermission === 'denied'
                                ? "Notifications are blocked"
                                : "Notifications are not enabled"}
                        </p>
                    </div>
                    {isDeviceRegistered ? (
                        <Button variant="outline" disabled className="gap-2 text-green-600 border-green-200 bg-green-50">
                            <ShieldCheck className="h-4 w-4" />
                            Enabled
                        </Button>
                    ) : isPermissionGranted ? (
                        <Button
                            onClick={() => refreshToken()}
                            variant="outline"
                            disabled={isRegistering}
                        >
                            {isRegistering ? "Registering..." : "Register Device"}
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => requestPermission()}
                            variant={notificationPermission === 'denied' ? "destructive" : "default"}
                            disabled={notificationPermission === 'denied' || isRegistering}
                        >
                            {notificationPermission === 'denied'
                                ? "Blocked in Browser"
                                : isRegistering
                                ? "Registering..."
                                : "Enable Notifications"}
                        </Button>
                    )}
                </div>

                {notificationPermission === 'denied' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Permission Denied</AlertTitle>
                        <AlertDescription>
                            You have blocked notifications for this site. To enable them, please reset permissions in your browser settings (click the lock icon in the address bar).
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Device Registration Failed</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {token && (
                    <div className="text-xs text-gray-400 break-all p-2 bg-gray-100 rounded border">
                        Device Token Active
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
