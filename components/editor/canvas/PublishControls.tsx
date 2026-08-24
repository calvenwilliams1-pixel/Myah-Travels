"use client";

import React, { useState } from "react";

type PublishStatus = "draft" | "published" | "scheduled";

interface PublishControlsProps {
  status: PublishStatus;
  scheduledAt?: string;
  onStatusChange: (status: PublishStatus, scheduledAt?: string) => void;
}

export default function PublishControls({ status, scheduledAt, onStatusChange }: PublishControlsProps) {
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const handleSchedule = () => {
    if (!scheduleDate || !scheduleTime) return;

    // Build local date, then convert to UTC ISO for storage
    const localDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    
    if (localDateTime <= new Date()) {
      return; // Silently ignore past dates (min attribute handles UI)
    }

    // Store as UTC ISO string
    const utcIsoString = localDateTime.toISOString();
    onStatusChange("scheduled", utcIsoString);
    setShowSchedulePicker(false);
    setScheduleDate("");
    setScheduleTime("");
  };

  const formatScheduledDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const statusLabels: Record<PublishStatus, string> = {
    draft: "Draft",
    published: "Published",
    scheduled: "Scheduled",
  };

  const statusIcons: Record<PublishStatus, string> = {
    draft: "📝",
    published: "✅",
    scheduled: "📅",
  };

  const statusColors: Record<PublishStatus, string> = {
    draft: "bg-gray-100 text-gray-700",
    published: "bg-emerald-100 text-emerald-800",
    scheduled: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        <span aria-hidden="true">{statusIcons[status]}</span> {statusLabels[status]}
      </span>

      {status === "scheduled" && scheduledAt && (
        <span className="text-xs text-gray-500">
          for {formatScheduledDate(scheduledAt)}
        </span>
      )}

      {status === "draft" && (
        <>
          <button
            onClick={() => onStatusChange("published", undefined)}
            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs hover:bg-emerald-800"
          >
            Publish Now
          </button>
          <button
            onClick={() => {
              setScheduleDate("");
              setScheduleTime("");
              setShowSchedulePicker(!showSchedulePicker);
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
          >
            {showSchedulePicker ? "Cancel" : "Schedule"}
          </button>
        </>
      )}

      {status === "scheduled" && (
        <>
          <button
            onClick={() => onStatusChange("published", undefined)}
            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs hover:bg-emerald-800"
          >
            Publish Now
          </button>
          <button
            onClick={() => onStatusChange("draft", undefined)}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
          >
            Cancel Schedule
          </button>
        </>
      )}

      {status === "published" && (
        <button
          onClick={() => onStatusChange("draft", undefined)}
          className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
        >
          Unpublish
        </button>
      )}

      {showSchedulePicker && (
        <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <label className="text-xs text-gray-600">
            Date
            <input
              type="date"
              value={scheduleDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-1 block px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </label>
          <label className="text-xs text-gray-600">
            Time
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="mt-1 block px-2 py-1 border border-gray-300 rounded text-xs"
            />
          </label>
          <button
            onClick={handleSchedule}
            disabled={!scheduleDate || !scheduleTime}
            className="px-3 py-2 bg-blue-700 text-white rounded text-xs disabled:opacity-40"
          >
            Set Schedule
          </button>
        </div>
      )}
    </div>
  );
}
