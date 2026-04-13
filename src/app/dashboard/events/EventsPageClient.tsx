"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Flame, 
  History, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  CalendarDays, 
  Clock, 
  UserCircle2, 
  Share2,
  Bell,
  ArrowRight
} from "lucide-react";
import { AnniversaryItem } from "@/app/actions/events";
import { addEvent, deleteEvent } from "@/app/actions/family";
import { FamilyTimeline } from "@/components/dashboard/FamilyTimeline";
import { AddEventModal } from "@/components/modals/AddEventModal";
import { EventDetailModal } from "@/components/modals/EventDetailModal";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { FamilyEvent } from "@/types/family";

import { EVENT_TYPE_OPTIONS } from "@/components/dashboard/DashboardConstants";

interface EventsPageClientProps {
  initialAnniversaries: AnniversaryItem[];
  initialEvents: any[];
}

export default function EventsPageClient({ initialAnniversaries, initialEvents }: EventsPageClientProps) {
  const [activeTab, setActiveTab] = useState<"anniversaries" | "events">("anniversaries");
  const [searchTerm, setSearchTerm] = useState("");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<FamilyEvent | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredAnniversaries = initialAnniversaries.filter(item => 
    item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || event.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleEventAdd = async (newEvent: any) => {
    setEvents([newEvent, ...events]);
    await addEvent({
      ...newEvent,
      date: newEvent.isoDate || newEvent.date,
      icon: newEvent.iconName
    });
  };

  const handleEventUpdate = (updatedEvent: FamilyEvent) => {
    setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    if (selectedEvent?.id === updatedEvent.id) {
      setSelectedEvent(updatedEvent);
    }
  };

  const handleEventDelete = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent(eventToDelete);
      setEvents(events.filter(e => e.id !== eventToDelete));
      if (selectedEvent?.id === eventToDelete) {
        setSelectedEvent(null);
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
    setEventToDelete(null);
  };

  const handleEditClick = (event: FamilyEvent) => {
    setEventToEdit(event);
    setIsEventModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/30 pb-20">
      {/* Header Hero Section */}
      <div className="relative h-40 md:h-48 overflow-hidden bg-[#240a0a]">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-[#240a0a]"></div>
        
        {/* Parallax-like shapes */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-amber-600 rounded-full blur-[100px]"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-rose-900 rounded-full blur-[100px]"
        />

        <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 md:space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              <Calendar className="w-3 h-3" />
              Di Sản Đời Đời
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-tight">
              Sự Kiện & Ngày Giỗ
            </h1>
            <p className="text-amber-100/60 max-w-2xl text-xs md:text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
              Nơi lưu giữ và tri ân những cột mốc lịch sử, những linh hồn đã khuất của dòng họ. 
              Mọi ngày giỗ được tính toán chính xác theo lịch Tiên Thường và Chính Kỵ.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20 space-y-8">
        {/* Tabs & Search Action Bar */}
        <div className="bg-white p-4 rounded-[24px] border border-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab("anniversaries")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "anniversaries" 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              <Flame className={`w-4 h-4 ${activeTab === "anniversaries" ? "text-rose-500" : ""}`} />
              Lịch Tưởng Niệm
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "events" 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-foreground/40 hover:text-foreground/60"
              }`}
            >
              <History className={`w-4 h-4 ${activeTab === "events" ? "text-primary" : ""}`} />
              Sự Kiện Dòng Họ
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
              <input 
                type="text" 
                placeholder="Tìm tên, sự kiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
              />
            </div>
            <button 
              onClick={() => setIsEventModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-secondary text-sm font-bold hover:shadow-lg transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm sự kiện
            </button>
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === "anniversaries" ? (
            <motion.div
              key="anniversaries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredAnniversaries.map((item, idx) => (
                <AnniversaryCard key={item.memberId} item={item} index={idx} />
              ))}
              
              {filteredAnniversaries.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-foreground/20">
                    <Calendar className="w-10 h-10" />
                  </div>
                  <p className="text-foreground/40 font-medium font-serif italic text-lg">Không tìm thấy thông tin phù hợp</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[32px] border border-border shadow-sm p-8"
            >
              {/* Category Filter Chips - One Line Auto-Scaling */}
              <div className="flex items-center gap-1.5 mb-8 w-full overflow-hidden">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`flex-1 min-w-0 px-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border truncate ${
                    selectedType === "all"
                      ? "bg-primary text-secondary border-primary shadow-lg scale-105 z-10"
                      : "bg-gray-50/50 text-foreground/40 border-border hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  Tất cả
                </button>
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedType(opt.value)}
                    title={opt.label}
                    className={`flex-1 min-w-0 px-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border truncate ${
                      selectedType === opt.value
                        ? "bg-primary text-secondary border-primary shadow-lg scale-105 z-10"
                        : "bg-gray-50/50 text-foreground/40 border-border hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <FamilyTimeline 
                events={filteredEvents as any} 
                onEventClick={(e) => setSelectedEvent(e as FamilyEvent)}
                onDeleteClick={(id) => setEventToDelete(id)}
                onEditClick={(e) => handleEditClick(e as FamilyEvent)}
              />
              
              {filteredEvents.length === 0 && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-foreground/20">
                    <History className="w-10 h-10" />
                  </div>
                  <p className="text-foreground/40 font-medium font-serif italic text-lg">Không tìm thấy sự kiện nào khớp với tìm kiếm</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }} 
        onAdd={handleEventAdd} 
        onUpdate={handleEventUpdate}
        eventToEdit={eventToEdit}
      />

      <EventDetailModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        onUpdate={handleEventUpdate}
      />

      <ConfirmModal 
        isOpen={!!eventToDelete}
        title="Xóa sự kiện"
        message="Bạn có chắc chắn muốn xóa sự kiện này khỏi sử ký dòng tộc? Hành động này không thể hoàn tác."
        onConfirm={handleEventDelete}
        onClose={() => setEventToDelete(null)}
      />
    </div>
  );
}

function AnniversaryCard({ item, index }: { item: AnniversaryItem; index: number }) {
  const isSpecial = item.isToday || item.isTomorrow;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative bg-white rounded-[24px] border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden ${
        isSpecial ? 'border-amber-500/30' : 'border-border'
      }`}
    >
      {/* Decorative background for special events */}
      {isSpecial && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] pointer-events-none" />
      )}

      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-105 ${
              isSpecial ? 'border-amber-500/40 ring-4 ring-amber-500/10' : 'border-border bg-gray-50'
            }`}>
              {item.avatar ? (
                <img src={item.avatar} alt={item.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-8 h-8 text-foreground/20" />
              )}
            </div>
            {item.isToday && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white ring-4 ring-white">
                <Flame className="w-3 h-3 animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                {item.fullName}
              </h4>
              <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                isSpecial ? 'bg-amber-500 text-white' : 'bg-gray-100 text-foreground/40'
              }`}>
                Đời {item.generation}
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground/40 text-xs">
              <span className="font-medium">{item.formattedLunar}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-2xl border border-border/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground/60">
              <CalendarDays className="w-4 h-4 text-primary/60" />
              Dương lịch
            </div>
            <span className="font-bold text-foreground">{item.formattedSolar}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground/60">
              <Clock className="w-4 h-4 text-primary/60" />
              Thời gian đếm ngược
            </div>
            <div className={`font-bold px-2 py-0.5 rounded-full ${
              item.isToday ? 'text-rose-500 bg-rose-500/10' : 
              item.isTomorrow ? 'text-amber-600 bg-amber-500/10' : 
              'text-primary bg-primary/5'
            }`}>
              {item.isToday ? 'Hôm Nay' : item.isTomorrow ? 'Ngày Mai' : `Còn ${item.daysLeft} ngày`}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button className="flex-1 py-2.5 rounded-xl border border-border text-[11px] font-bold text-foreground/60 hover:bg-gray-50 hover:text-primary transition-all flex items-center justify-center gap-2 group/btn">
            <Share2 className="w-3.5 h-3.5 transition-transform group-hover/btn:scale-110" />
            Gửi thiệp mời
          </button>
          <button className="w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
