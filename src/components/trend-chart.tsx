"use client";

import { useEffect, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ChartPoint } from "@/domain/report";

export function TrendChart({ data }: { data: ChartPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);

      if (width > 0 && height > 0) {
        setSize({ width, height });
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full min-h-0 w-full min-w-0" ref={containerRef}>
      {size.width > 0 && size.height > 0 ? (
        <LineChart data={data} height={size.height} margin={{ left: 0, right: 12 }} width={size.width}>
        <CartesianGrid stroke="#dbe8d5" strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} />
        <YAxis tickLine={false} width={42} />
        <Tooltip />
        <Line
          dataKey="value"
          dot={{ r: 3 }}
          name="Modeled price"
          stroke="#1f5a3c"
          strokeWidth={3}
          type="monotone"
        />
        <Line
          dataKey="sentiment"
          dot={false}
          name="Sentiment"
          stroke="#2ea3f2"
          strokeWidth={2}
          type="monotone"
          yAxisId={0}
        />
        </LineChart>
      ) : (
        <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
          Loading chart
        </div>
      )}
    </div>
  );
}
