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
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyForIncognito = (openas: string, studentId: string) => {
    // Copy URL to clipboard
    navigator.clipboard.writeText(openas).then(() => {
      setCopiedId(studentId);
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    }).catch(() => {
      console.error('Failed to copy to clipboard');
    });
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

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopyForIncognito(student.openas, student.id)}
                      className="btn btn-sm btn-ghost gap-1"
                      title="Copy URL to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                      <span>{copiedId === student.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
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
