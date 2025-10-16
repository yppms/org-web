"use client";

import { useState, useMemo, useEffect } from "react";
import { kindyAdminApi } from "@/lib/api";

interface WhatsAppTask {
  id: string;
  name: string;
  phone: string;
  key: string;
  wa_link: string;
  no: number;
}

export default function StampSection() {
  const [tasks, setTasks] = useState<WhatsAppTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set());
  const [showSent, setShowSent] = useState(false);

  // Fetch WhatsApp tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await kindyAdminApi.getWhatsAppTasks();
        setTasks(response.data || []);
      } catch (error) {
        console.error("Failed to fetch WhatsApp tasks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Load sent messages from localStorage on component mount
  useEffect(() => {
    const storedSentMessages = localStorage.getItem('kindy-admin-sent-whatsapp');
    if (storedSentMessages) {
      try {
        const parsed = JSON.parse(storedSentMessages);
        setSentMessages(new Set(parsed));
      } catch (error) {
        console.error('Error parsing sent messages from localStorage:', error);
      }
    }
  }, []);

  // Save sent messages to localStorage
  const saveSentMessages = (newSentMessages: Set<string>) => {
    localStorage.setItem('kindy-admin-sent-whatsapp', JSON.stringify(Array.from(newSentMessages)));
    setSentMessages(newSentMessages);
  };

  // Filter tasks based on search term and sent status
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(term) ||
        task.phone.includes(term) ||
        task.id.toLowerCase().includes(term)
      );
    }
    
    // Filter by sent status (hide sent if showSent is false)
    if (!showSent) {
      filtered = filtered.filter(task => !sentMessages.has(task.id));
    }
    
    return filtered;
  }, [tasks, searchTerm, sentMessages, showSent]);

  const handleOpenWhatsApp = (waLink: string, taskId: string) => {
    // Mark as sent
    const newSentMessages = new Set(sentMessages);
    newSentMessages.add(taskId);
    saveSentMessages(newSentMessages);
    
    // Open WhatsApp
    window.open(waLink, '_blank');
  };

  const isSent = (taskId: string) => {
    return sentMessages.has(taskId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">WhatsApp Message Tasks</h2>
        <p className="text-sm text-base-content/60 mt-1">
          Send magic link credentials to student parents
        </p>
      </div>
      
      {/* Search Bar and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="form-control flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            className="input input-bordered input-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="form-control flex-shrink-0">
          <label className="label cursor-pointer gap-2 justify-start sm:justify-center">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={showSent}
              onChange={(e) => setShowSent(e.target.checked)}
            />
            <span className="label-text text-sm whitespace-nowrap">Show sent</span>
          </label>
        </div>
      </div>

      {/* Student Cards */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-base-content/60 text-lg">
            {searchTerm ? 'No students found matching your search.' : 
             !showSent ? 'All messages have been sent! Toggle "Show sent" to see them.' :
             'No WhatsApp tasks available.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{task.name}</h3>
                    <p className="text-sm text-base-content/60">#{task.id}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSent(task.id) && (
                      <span className="badge badge-success badge-sm text-white">Sent</span>
                    )}
                    <button
                      onClick={() => handleOpenWhatsApp(task.wa_link, task.id)}
                      className="btn btn-sm btn-primary gap-1"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
