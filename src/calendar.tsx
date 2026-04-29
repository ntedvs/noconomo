import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-3">
        <button onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Previous month">
          <CaretLeft weight="bold" />
        </button>
        <h2 className="m-0 text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Next month">
          <CaretRight weight="bold" />
        </button>
      </header>
      <div className="grid grid-cols-7 gap-px bg-gray-300 border border-gray-300">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-gray-100 p-2 text-center text-xs font-semibold">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          return (
            <div
              key={day.toISOString()}
              className={`bg-white min-h-24 p-1.5 ${inMonth ? "text-gray-900" : "text-gray-400"}`}
            >
              <div className={isToday(day) ? "font-bold text-blue-600" : "font-normal"}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
