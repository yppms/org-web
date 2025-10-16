"use client";

import { useState, useEffect } from "react";
import { kindyAdminApi } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  phone: string | null;
  openas: string;
}

export default function OpenAsSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await kindyAdminApi.getAllStudents();
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.phone && student.phone.includes(searchQuery))
  );

  const handleOpenAs = (openas: string) => {
    // Open the student portal in a new tab
    window.open(openas, "_blank", "noopener,noreferrer");
  };

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
        <h2 className="text-lg font-semibold mb-3">Open As Student</h2>
        <p className="text-sm text-base-content/60 mb-4">
          Open student dashboard as any student to view their portal
        </p>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="input input-bordered input-sm w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            {searchQuery ? "No students found" : "No students available"}
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="card bg-base-100 shadow-sm border border-base-300 hover:border-primary/50 transition-colors"
            >
              <div className="card-body p-4">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">
                      {student.name}
                    </h3>
                    {student.phone && (
                      <p className="text-sm text-base-content/60 mt-1">
                        📱 {student.phone}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenAs(student.openas)}
                    className="btn btn-sm btn-primary gap-2 flex-shrink-0"
                    title={`Open as ${student.name}`}
                  >
                    <span>🔑</span>
                    <span>Open Portal</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Student Count */}
      {filteredStudents.length > 0 && (
        <div className="mt-4 text-center text-sm text-base-content/60">
          Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
