"use client";

import type { Rsvp } from "@/lib/types";

function toCsv(rsvps: Rsvp[]): string {
  const header = ["No.", "Timestamp", "Name", "Phone", "Pax"];
  const rows = rsvps.map((r, i) => [
    String(i + 1),
    new Date(r.created_at).toISOString(),
    r.guest_name,
    r.guest_phone,
    String(r.pax_count),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DashboardClient({
  childName,
  rsvps,
}: {
  childName: string | null;
  rsvps: Rsvp[];
}) {
  const totalPax = rsvps.reduce((sum, r) => sum + r.pax_count, 0);

  return (
    <div className="font-body min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {childName ? `${childName}'s Party — RSVPs` : "RSVPs"}
            </h1>
            <p className="text-sm text-gray-500">
              {rsvps.length} {rsvps.length === 1 ? "response" : "responses"} · {totalPax} total
              guests
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(`${childName ?? "rsvps"}-rsvps.csv`, toCsv(rsvps))}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow hover:bg-gray-700"
          >
            Download CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-bold">No.</th>
                <th className="px-4 py-3 font-bold">Timestamp</th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Phone</th>
                <th className="px-4 py-3 font-bold">Pax</th>
              </tr>
            </thead>
            <tbody>
              {rsvps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No RSVPs yet.
                  </td>
                </tr>
              ) : (
                rsvps.map((r, i) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.guest_name}</td>
                    <td className="px-4 py-3 text-gray-700">{r.guest_phone}</td>
                    <td className="px-4 py-3 text-gray-700">{r.pax_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
