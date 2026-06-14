"use client";

import { useState, useEffect, useMemo } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface StudentEvent {
  name: string;
  is_join: boolean;
  add: number;
  invoices: { name: string; amount: number }[];
  payment: number;
  left: number;
}

type FilterType = "all" | "join" | "unpaid";

export default function AkhirussanahSection() {
  const [data, setData] = useState<StudentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await kindyAdminApi.getAkhirussanah26();
        setData(res.data || []);
      } catch (err) {
        console.error("Failed to fetch akhirussanah-26 data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    let result = data;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (filterType === "join") result = result.filter((s) => s.is_join);
    if (filterType === "unpaid") result = result.filter((s) => s.left > 0);
    return result;
  }, [data, searchQuery, filterType]);

  const totalJoining = data.filter((s) => s.is_join).length;
  const totalUnpaid = data.filter((s) => s.left > 0).length;
  const totalCollected = data.reduce((sum, s) => sum + s.payment, 0);
  const totalLeft = data.reduce((sum, s) => sum + (s.left > 0 ? s.left : 0), 0);
  const totalSeats = data.reduce((sum, s) => sum + (s.is_join ? 1 + s.add : 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">Akhirussanah 2026</h2>
        <p className="text-sm text-base-content/60 mb-4">Event attendance and payment status</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Joining</div>
              <div className="text-xl font-bold text-green-600">{totalJoining}</div>
              <div className="text-xs text-base-content/50 mt-1">{totalSeats} total seats</div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Unpaid</div>
              <div className="text-xl font-bold text-red-600">{totalUnpaid}</div>
              <div className="text-xs text-base-content/50 mt-1">{formatCurrency(totalLeft)} left</div>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Collected</div>
              <div className="text-lg font-bold">{formatCurrency(totalCollected)}</div>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Total Students</div>
              <div className="text-lg font-bold">{data.length}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by student name..."
          className="input input-bordered input-sm w-full mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${filterType === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterType("all")}
          >
            All ({data.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === "join" ? "btn-success" : "btn-ghost"}`}
            onClick={() => setFilterType("join")}
          >
            Joining ({totalJoining})
          </button>
          <button
            className={`btn btn-sm ${filterType === "unpaid" ? "btn-error" : "btn-ghost"}`}
            onClick={() => setFilterType("unpaid")}
          >
            Unpaid ({totalUnpaid})
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? `No students found matching "${searchQuery}"` : "No data available"}
          </div>
        ) : (
          filtered.map((student) => (
            <div
              key={student.name}
              className={`card bg-base-100 shadow-sm border transition-colors ${
                !student.is_join
                  ? "border-base-300 opacity-60"
                  : student.left > 0
                  ? "border-red-500/30 hover:border-red-500/50"
                  : "border-green-500/30 hover:border-green-500/50"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-base truncate">{student.name}</h3>
                      {student.is_join ? (
                        <span className="badge badge-success badge-sm flex-shrink-0">Join</span>
                      ) : (
                        <span className="badge badge-ghost badge-sm flex-shrink-0">Not Join</span>
                      )}
                      {student.add > 0 && (
                        <span className="badge badge-info badge-sm flex-shrink-0">
                          +{student.add} seat{student.add > 1 ? "s" : ""}
                        </span>
                      )}
                      {student.is_join && student.left <= 0 && (
                        <span className="badge badge-success badge-sm flex-shrink-0">Paid</span>
                      )}
                      {student.is_join && student.left > 0 && (
                        <span className="badge badge-error badge-sm flex-shrink-0">Unpaid</span>
                      )}
                    </div>

                    {student.is_join && (
                      <div className="space-y-1.5">
                        <div className="text-sm">
                          <span className="text-base-content/60">Paid:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {formatCurrency(student.payment)}
                          </span>
                        </div>
                        {student.left > 0 && (
                          <div className="text-sm">
                            <span className="text-base-content/60">Left:</span>
                            <span className="ml-2 font-bold text-red-600">
                              {formatCurrency(student.left)}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-base-200 space-y-1">
                          {student.invoices.map((inv) => (
                            <div key={inv.name} className="flex justify-between text-xs text-base-content/60">
                              <span>{inv.name}</span>
                              <span>{formatCurrency(inv.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Showing {filtered.length} of {data.length} students
        </div>
      )}
    </div>
  );
}
