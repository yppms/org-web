"use client";

import { useState, useEffect, useMemo } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StudentSaving {
  id: string;
  name: string;
  totalSaving: number;
  transactionCount: number;
  lastTransaction: string | null;
  no: number;
}

export default function SavingSection() {
  const [savings, setSavings] = useState<StudentSaving[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"no" | "name" | "totalSaving" | "lastTransaction">("lastTransaction");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const response = await kindyAdminApi.getAllSavings();
      setSavings(response.data || []);
    } catch (error) {
      console.error("Failed to fetch savings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  // Filter and sort savings
  const filteredAndSortedSavings = useMemo(() => {
    let filtered = savings;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = savings.filter((student) =>
        student.name.toLowerCase().includes(query)
      );
    }

    // Filter out students without transactions when sorting by amount or last transaction
    if (sortBy === "totalSaving" || sortBy === "lastTransaction") {
      filtered = filtered.filter((student) => student.totalSaving > 0);
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "no":
          comparison = a.no - b.no;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "totalSaving":
          comparison = a.totalSaving - b.totalSaving;
          break;
        case "lastTransaction":
          if (!a.lastTransaction && !b.lastTransaction) comparison = 0;
          else if (!a.lastTransaction) comparison = 1;
          else if (!b.lastTransaction) comparison = -1;
          else comparison = new Date(a.lastTransaction).getTime() - new Date(b.lastTransaction).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [savings, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Calculate total statistics
  const totalSavings = savings.reduce((sum, s) => sum + s.totalSaving, 0);
  const studentsWithSavings = savings.filter(s => s.totalSaving > 0).length;

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
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Student Savings</h2>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          View all student saving balances and transaction history
        </p>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by student name..."
          className="input input-bordered input-sm w-full mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Total Savings</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(totalSavings)}
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Active Savers</div>
              <div className="text-xl font-bold text-blue-600">
                {studentsWithSavings} / {savings.length}
              </div>
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-sm text-base-content/70 font-medium">Sort by:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === "totalSaving" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("totalSaving")}
            >
              Amount {sortBy === "totalSaving" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "name" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("name")}
            >
              Name {sortBy === "name" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "lastTransaction" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("lastTransaction")}
            >
              Last Txn {sortBy === "lastTransaction" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredAndSortedSavings.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? `No students found matching "${searchQuery}"` : "No saving data available"}
          </div>
        ) : (
          filteredAndSortedSavings.map((student) => (
            <div
              key={student.id}
              className={`card bg-base-100 shadow-sm border transition-colors ${
                student.totalSaving > 0 ? "border-base-300 hover:border-green-500/50" : "border-base-300/50"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-2">{student.name}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      {/* Total Saving */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Balance:</span>
                        <span className={`font-bold ${student.totalSaving > 0 ? "text-green-600" : "text-base-content/40"}`}>
                          {formatCurrency(student.totalSaving)}
                        </span>
                      </div>

                      {/* Transaction Count */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Transactions:</span>
                        <span className="badge badge-sm badge-outline">
                          {student.transactionCount}
                        </span>
                      </div>

                      {/* Last Transaction */}
                      {student.lastTransaction && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-base-content/60">Last:</span>
                          <span className="text-xs text-base-content/70">
                            {formatDate(student.lastTransaction)}
                          </span>
                        </div>
                      )}

                      {student.totalSaving === 0 && (
                        <span className="text-xs text-base-content/40 italic">No savings yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Result Count */}
      {filteredAndSortedSavings.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Showing {filteredAndSortedSavings.length} of {savings.length} student{savings.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
