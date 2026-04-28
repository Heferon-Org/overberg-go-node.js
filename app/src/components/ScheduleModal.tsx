"use client";

import { useState } from "react";

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
  title?: string;
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00",
];

function getNextDays(count: number) {
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayNames[d.getDay()],
      date: d.getDate(),
      month: monthNames[d.getMonth()],
      full: d.toISOString().split("T")[0],
    });
  }
  return days;
}

export function ScheduleModal({ open, onClose, onConfirm, title = "Schedule Delivery" }: ScheduleModalProps) {
  const days = getNextDays(7);
  const [selectedDay, setSelectedDay] = useState(days[0].full);
  const [selectedTime, setSelectedTime] = useState("");

  if (!open) return null;

  const selectedDayLabel = days.find((d) => d.full === selectedDay);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white border-t border-bd rounded-t-3xl w-full max-w-lg p-6 pb-10 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5" />
        <h2 className="font-heading font-black text-lg mb-4">{title}</h2>

        {/* Date picker */}
        <div className="font-heading font-bold text-xs text-t2 mb-2">Select date</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
          {days.map((d) => (
            <button
              key={d.full}
              onClick={() => setSelectedDay(d.full)}
              className={`shrink-0 w-[68px] py-3 rounded-xl text-center border transition-all ${
                selectedDay === d.full
                  ? "bg-primary/10 border-primary/30"
                  : "bg-dark3 border-bd"
              }`}
            >
              <div className={`text-[10px] font-heading font-semibold ${selectedDay === d.full ? "text-primary" : "text-t3"}`}>
                {d.label}
              </div>
              <div className="font-heading font-black text-lg">{d.date}</div>
              <div className="text-[10px] text-t2">{d.month}</div>
            </button>
          ))}
        </div>

        {/* Time picker */}
        <div className="font-heading font-bold text-xs text-t2 mb-2">Select time</div>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {timeSlots.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTime(t)}
              className={`py-2.5 rounded-xl font-heading font-semibold text-xs border transition-all ${
                selectedTime === t
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-dark3 border-bd text-t2"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!selectedTime) return;
            onConfirm(
              `${selectedDayLabel?.label} ${selectedDayLabel?.date} ${selectedDayLabel?.month}`,
              selectedTime
            );
          }}
          disabled={!selectedTime}
          className={`w-full font-heading font-extrabold text-base rounded-2xl py-4 transition-all ${
            selectedTime
              ? "bg-primary text-white active:bg-primary-dark active:scale-[0.98]"
              : "bg-dark3 text-t3"
          }`}
        >
          {selectedTime
            ? `Confirm · ${selectedDayLabel?.label} at ${selectedTime}`
            : "Select a time slot"}
        </button>
      </div>
    </div>
  );
}
