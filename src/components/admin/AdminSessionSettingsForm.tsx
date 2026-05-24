"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminSessionSettingsFormProps = {
    initialDurationHours: number;
};

export default function AdminSessionSettingsForm({
    initialDurationHours,
}: AdminSessionSettingsFormProps) {
    const [durationHours, setDurationHours] = useState(initialDurationHours);
    const [savedDurationHours, setSavedDurationHours] = useState(initialDurationHours);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function saveSettings() {
        setIsSaving(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch("/api/admin/settings/session", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionDurationHours: durationHours }),
            });
            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.error ?? "Failed to update session settings");
            }

            setDurationHours(json.sessionDurationHours);
            setSavedDurationHours(json.sessionDurationHours);
            setMessage("Session duration updated. New logins will use this value.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update session settings");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-2 max-w-xs">
                <Label htmlFor="sessionDurationHours">Session duration hours</Label>
                <Input
                    id="sessionDurationHours"
                    type="number"
                    min={1}
                    max={24}
                    step={1}
                    value={durationHours}
                    onChange={(event) => setDurationHours(Number(event.target.value))}
                    className="bg-white"
                />
            </div>

            <Button
                type="button"
                onClick={saveSettings}
                disabled={isSaving || durationHours === savedDurationHours}
            >
                {isSaving ? "Saving..." : "Save session settings"}
            </Button>

            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
