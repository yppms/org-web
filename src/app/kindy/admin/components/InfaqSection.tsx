"use client";

import { useState, useEffect, useMemo } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

interface StudentInfaq {
  id: string;
  name: string;
  class: string | null;
  totalInfaq: number;
  contributionCount: number;
  lastContribution: string | null;
  no: number;
}

export default function InfaqSection() {
  const [infaqData, setInfaqData] = useState<StudentInfaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"no" | "name" | "totalInfaq" | "lastContribution">("lastContribution");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const fetchInfaq = async () => {
    setLoading(true);
    try {
      const response = await kindyAdminApi.getAllInfaq();
      setInfaqData(response.data || []);
    } catch (error) {
      console.error("Failed to fetch infaq:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfaq();
  }, []);

  const classes = useMemo(() => {
    const set = new Set<string>();
    infaqData.forEach((s) => { if (s.class) set.add(s.class); });
    return Array.from(set).sort();
  }, [infaqData]);

  const classStats = useMemo(() => {
    return classes.map((cls) => {
      const students = infaqData.filter((s) => s.class === cls);
      return {
        name: cls,
        total: students.reduce((sum, s) => sum + s.totalInfaq, 0),
        count: students.length,
        active: students.filter((s) => s.totalInfaq > 0).length,
      };
    });
  }, [infaqData, classes]);

  const filteredAndSortedInfaq = useMemo(() => {
    let filtered = infaqData;

    if (selectedClass) {
      filtered = filtered.filter((s) => s.class === selectedClass);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(query));
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === "totalInfaq" || sortBy === "lastContribution") {
        if (a.totalInfaq === 0 && b.totalInfaq > 0) return 1;
        if (a.totalInfaq > 0 && b.totalInfaq === 0) return -1;
        if (a.totalInfaq === 0 && b.totalInfaq === 0) return 0;
      }

      let comparison = 0;
      switch (sortBy) {
        case "no":
          comparison = a.no - b.no;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "totalInfaq":
          comparison = a.totalInfaq - b.totalInfaq;
          break;
        case "lastContribution":
          if (!a.lastContribution && !b.lastContribution) comparison = 0;
          else if (!a.lastContribution) comparison = 1;
          else if (!b.lastContribution) comparison = -1;
          else comparison = new Date(a.lastContribution).getTime() - new Date(b.lastContribution).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [infaqData, searchQuery, sortBy, sortOrder, selectedClass]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const totalInfaq = infaqData.reduce((sum, s) => sum + s.totalInfaq, 0);
  const studentsWithInfaq = infaqData.filter((s) => s.totalInfaq > 0).length;

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
          <h2 className="text-lg font-semibold">Student Infaq</h2>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          View all student charity contributions and donation history
        </p>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Total Infaq</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(totalInfaq)}
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Contributors</div>
              <div className="text-xl font-bold text-orange-600">
                {studentsWithInfaq} / {infaqData.length}
              </div>
            </div>
          </div>
        </div>

        {/* Per-Class Stats */}
        {classStats.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">Per Class</div>
            <div className="grid grid-cols-2 gap-2">
              {classStats.map((cs) => (
                <button
                  key={cs.name}
                  onClick={() => setSelectedClass(selectedClass === cs.name ? null : cs.name)}
                  className={`card text-left transition-all ${
                    selectedClass === cs.name
                      ? "bg-purple-500/20 border-2 border-purple-500/60"
                      : "bg-base-100 border border-base-300 hover:border-purple-500/40"
                  }`}
                >
                  <div className="card-body p-3">
                    <div className="text-xs font-semibold text-base-content/70 mb-1">{cs.name}</div>
                    <div className="text-sm font-bold text-purple-600">{formatCurrency(cs.total)}</div>
                    <div className="text-xs text-base-content/50">{cs.active}/{cs.count} active</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Class Filter Tabs */}
        {classes.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              className={`btn btn-xs ${selectedClass === null ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSelectedClass(null)}
            >
              All
            </button>
            {classes.map((cls) => (
              <button
                key={cls}
                className={`btn btn-xs ${selectedClass === cls ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
              >
                {cls}
              </button>
            ))}
          </div>
        )}

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by student name..."
          className="input input-bordered input-sm w-full mb-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-sm text-base-content/70 font-medium">Sort by:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === "totalInfaq" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("totalInfaq")}
            >
              Amount {sortBy === "totalInfaq" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "name" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("name")}
            >
              Name {sortBy === "name" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "lastContribution" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("lastContribution")}
            >
              Last Contrib {sortBy === "lastContribution" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredAndSortedInfaq.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? `No students found matching "${searchQuery}"` : "No infaq data available"}
          </div>
        ) : (
          filteredAndSortedInfaq.map((student) => (
            <div
              key={student.id}
              className={`card bg-base-100 shadow-sm border transition-colors ${
                student.totalInfaq > 0 ? "border-base-300 hover:border-purple-500/50" : "border-base-300/50"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-base">{student.name}</h3>
                      {student.class && (
                        <span className="badge badge-sm badge-ghost">{student.class}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Total:</span>
                        <span className={`font-bold ${student.totalInfaq > 0 ? "text-purple-600" : "text-base-content/40"}`}>
                          {formatCurrency(student.totalInfaq)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-base-content/60">Contributions:</span>
                        <span className="badge badge-sm badge-outline">
                          {student.contributionCount}
                        </span>
                      </div>
                      {student.lastContribution && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-base-content/60">Last:</span>
                          <span className="text-xs text-base-content/70">
                            {formatDate(student.lastContribution)}
                          </span>
                        </div>
                      )}
                      {student.totalInfaq === 0 && (
                        <span className="text-xs text-base-content/40 italic">No contributions yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredAndSortedInfaq.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Showing {filteredAndSortedInfaq.length} of {infaqData.length} student{infaqData.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
