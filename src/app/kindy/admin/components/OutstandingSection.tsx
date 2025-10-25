"use client";

import { useState, useEffect, useMemo } from "react";
import { kindyAdminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface StudentOutstanding {
  id: string;
  name: string;
  totalInvoice: number;
  totalPayment: number;
  outstanding: number;
  invoiceCount: number;
  paymentCount: number;
  no: number;
  unpaidInvoiceCount?: number;
  unpaidInvoice?: { name: string; outstanding: number }[];
}

export default function OutstandingSection() {
  const [outstandingData, setOutstandingData] = useState<StudentOutstanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"no" | "name" | "outstanding" | "totalInvoice">("outstanding");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"all" | "outstanding" | "overpaid">("all");

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const response = await kindyAdminApi.getAllOutstanding();
      setOutstandingData(response.data || []);
    } catch (error) {
      console.error("Failed to fetch outstanding:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutstanding();
  }, []);

  // Filter and sort outstanding data
  const filteredAndSortedOutstanding = useMemo(() => {
    let filtered = outstandingData;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = outstandingData.filter((student) =>
        student.name.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType === "outstanding") {
      filtered = filtered.filter(s => s.outstanding > 0);
    } else if (filterType === "overpaid") {
      filtered = filtered.filter(s => s.outstanding < 0);
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
        case "outstanding":
          comparison = a.outstanding - b.outstanding;
          break;
        case "totalInvoice":
          comparison = a.totalInvoice - b.totalInvoice;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [outstandingData, searchQuery, sortBy, sortOrder, filterType]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Calculate statistics
  const totalOutstanding = outstandingData.reduce((sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0), 0);
  const totalOverpaid = Math.abs(outstandingData.reduce((sum, s) => sum + (s.outstanding < 0 ? s.outstanding : 0), 0));
  const studentsWithOutstanding = outstandingData.filter(s => s.outstanding > 0).length;
  const studentsOverpaid = outstandingData.filter(s => s.outstanding < 0).length;
  const totalInvoice = outstandingData.reduce((sum, s) => sum + s.totalInvoice, 0);
  const totalPayment = outstandingData.reduce((sum, s) => sum + s.totalPayment, 0);

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
          <h2 className="text-lg font-semibold">Student Outstanding</h2>
        </div>
        <p className="text-sm text-base-content/60 mb-4">
          View student payment outstanding balances sorted by most outstanding
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
          <div className="card bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Total Outstanding</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(totalOutstanding)}
              </div>
              <div className="text-xs text-base-content/50 mt-1">
                {studentsWithOutstanding} student{studentsWithOutstanding !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Overpaid</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(totalOverpaid)}
              </div>
              <div className="text-xs text-base-content/50 mt-1">
                {studentsOverpaid} student{studentsOverpaid !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Total Invoice</div>
              <div className="text-lg font-bold">
                {formatCurrency(totalInvoice)}
              </div>
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body p-4">
              <div className="text-xs text-base-content/60">Total Payment</div>
              <div className="text-lg font-bold">
                {formatCurrency(totalPayment)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${filterType === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterType("all")}
          >
            All ({outstandingData.length})
          </button>
          <button
            className={`btn btn-sm ${filterType === "outstanding" ? "btn-error" : "btn-ghost"}`}
            onClick={() => setFilterType("outstanding")}
          >
            Outstanding ({studentsWithOutstanding})
          </button>
          <button
            className={`btn btn-sm ${filterType === "overpaid" ? "btn-info" : "btn-ghost"}`}
            onClick={() => setFilterType("overpaid")}
          >
            Overpaid ({studentsOverpaid})
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-sm text-base-content/70 font-medium">Sort by:</span>
          <div className="btn-group">
            <button
              className={`btn btn-xs ${sortBy === "outstanding" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("outstanding")}
            >
              Outstanding {sortBy === "outstanding" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "totalInvoice" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("totalInvoice")}
            >
              Invoice {sortBy === "totalInvoice" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
            <button
              className={`btn btn-xs ${sortBy === "name" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggleSort("name")}
            >
              Name {sortBy === "name" && (sortOrder === "desc" ? "↓" : "↑")}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredAndSortedOutstanding.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? `No students found matching "${searchQuery}"` : "No outstanding data available"}
          </div>
        ) : (
          filteredAndSortedOutstanding.map((student) => (
            <div
              key={student.id}
              className={`card bg-base-100 shadow-sm border transition-colors ${
                student.outstanding > 0 
                  ? "border-red-500/30 hover:border-red-500/50" 
                  : student.outstanding < 0
                  ? "border-blue-500/30 hover:border-blue-500/50"
                  : "border-base-300 hover:border-base-300"
              }`}
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base truncate">{student.name}</h3>
                      {student.outstanding > 0 && (
                        <span className="badge badge-error badge-sm flex-shrink-0 whitespace-nowrap">Unpaid</span>
                      )}
                      {student.outstanding < 0 && (
                        <span className="badge badge-info badge-sm flex-shrink-0 whitespace-nowrap">Overpaid</span>
                      )}
                      {student.outstanding === 0 && (
                        <span className="badge badge-success badge-sm flex-shrink-0 whitespace-nowrap">Settled</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Total Invoice */}
                      <div className="text-sm">
                        <span className="text-base-content/60">Invoice:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(student.totalInvoice)}
                        </span>
                        <span className="ml-1 text-sm font-bold text-base-content">
                          ({student.invoiceCount})
                        </span>
                      </div>

                      {/* Total Payment */}
                      <div className="text-sm">
                        <span className="text-base-content/60">Payment:</span>
                        <span className="ml-2 font-semibold">
                          {formatCurrency(student.totalPayment)}
                        </span>
                        <span className="ml-1 text-sm font-bold text-base-content">
                          ({student.paymentCount})
                        </span>
                      </div>

                      {/* Outstanding Amount */}
                      <div className="text-sm">
                        <span className="text-base-content/60">Outstanding:</span>
                        <span className={`ml-2 font-bold text-base ${
                          student.outstanding > 0 
                            ? "text-red-600" 
                            : student.outstanding < 0
                            ? "text-blue-600"
                            : "text-success"
                        }`}>
                          {student.outstanding > 0 ? "" : student.outstanding < 0 ? "+" : ""}
                          {formatCurrency(Math.abs(student.outstanding))}
                        </span>
                      </div>

                      {/* Unpaid invoices list */}
                      {student.unpaidInvoiceCount && student.unpaidInvoice && student.unpaidInvoice.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-base-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-base-content/70">Unpaid Invoices:</span>
                            <span className="badge badge-error badge-sm font-bold">{student.unpaidInvoiceCount}</span>
                          </div>
                          <div className="space-y-1.5 pl-2">
                            {student.unpaidInvoice.map((inv, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm gap-3">
                                <div className="truncate text-base-content/80 flex-1">{inv.name}</div>
                                <div className="font-semibold text-red-600 whitespace-nowrap">{formatCurrency(inv.outstanding)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
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
      {filteredAndSortedOutstanding.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Showing {filteredAndSortedOutstanding.length} of {outstandingData.length} student{outstandingData.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
