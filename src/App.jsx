import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Info, LayoutGrid, List, AlertCircle, BookOpen, X, Loader2, Coffee, Utensils } from 'lucide-react';

// Define the full 9 periods and break slots
const timeSlots = [
  { id: "slot1", time: "8:00 - 8:50", label: "1st" },
  { id: "slot2", time: "8:50 - 9:40", label: "2nd" },
  { id: "slot3", time: "9:40 - 10:30", label: "3rd" },
  { id: "break1", time: "10:30 - 10:50", label: "Short Break", isBreak: true },
  { id: "slot4", time: "10:50 - 11:40", label: "4th" },
  { id: "slot5", time: "11:40 - 12:30", label: "5th" },
  { id: "slot6", time: "12:30 - 1:20", label: "6th" },
  { id: "break2", time: "1:20 - 2:30", label: "Recess", isBreak: true },
  { id: "slot7", time: "2:30 - 3:20", label: "7th" },
  { id: "slot8", time: "3:20 - 4:10", label: "8th" },
  { id: "slot9", time: "4:10 - 5:00", label: "9th" }
];

const activeDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];

// Routine data extracted for Section 23/A with accurate duration spans (duration: 3 means it spans 3 periods)
const routineData = {
  Saturday: {
    "slot1": { subject: "ME 2210", teacher: "MAK", room: "FS 201", type: "theory" },
    "slot2": { subject: "ME 2207", teacher: "SMR", room: "FS 201", type: "theory" },
    "slot3": { subject: "ME 2203", teacher: "SMH", room: "FS 201", type: "theory" },
    "slot4": { subject: "ME 2208 (Lab)", teacher: "ES", room: "HE 203", type: "lab", duration: 3 },
  },
  Sunday: {
    "slot1": { subject: "ME 2203", teacher: "MWI", room: "FS 201", type: "theory" },
    "slot2": { subject: "ME 2209", teacher: "HHH", room: "FS 201", type: "theory" },
    "slot3": { subject: "ME 2207", teacher: "NI", room: "FS 201", type: "theory" },
    "slot7": { subject: "ME 2204 (Lab)", teacher: "MWI", room: "TBA", type: "lab", duration: 3 },
  },
  Monday: {
    "slot1": { subject: "EEE 2281", teacher: "SAH", room: "FS 201", type: "theory" },
    "slot2": { subject: "MATH 2221", teacher: "MKH", room: "FS 201", type: "theory" },
    "slot3": { subject: "ME 2207", teacher: "AA", room: "FS 201", type: "theory" },
    "slot4": { subject: "MATH 2222 (Lab)", teacher: "MMA", room: "HE 203", type: "lab", duration: 3 },
  },
  Tuesday: {
    "slot1": { subject: "EEE 2281", teacher: "SAH", room: "FS 201", type: "theory" },
    "slot2": { subject: "ME 2207", teacher: "SMR", room: "FS 201", type: "theory" },
    "slot3": { subject: "ME 2209", teacher: "MBH", room: "FS 201", type: "theory" },
    "slot4": { subject: "ME 2200", teacher: "NI", room: "FS 201", type: "theory" },
    "slot7": { subject: "EEE 2282 (Machine Lab)", teacher: "RI", room: "Lab (West)", type: "lab", duration: 3 },
  },
  Wednesday: {
    "slot1": { subject: "ME 2200", teacher: "NI", room: "FS 201", type: "theory" },
    "slot2": { subject: "MATH 2221", teacher: "MKH", room: "FS 201", type: "theory" },
    "slot3": { subject: "ME 2209", teacher: "NI", room: "FS 201", type: "theory" },
    "slot4": { subject: "ME 2210", teacher: "MZS", room: "FS 201", type: "theory" },
    "slot7": { subject: "EEE 2282 (Electronics Lab)", teacher: "RI", room: "Lab (West)", type: "lab", duration: 3 },
  }
};

export default function App() {
  const [viewMode, setViewMode] = useState('table'); // Defaulted to table to see the new layout

  // AI Modal State
  const [aiModal, setAiModal] = useState({ isOpen: false, title: '', content: '', isLoading: false });

  const generateAIContent = async (prompt) => {
    const apiKey = "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const retries = [1000, 2000, 4000, 8000, 16000];

    for (let i = 0; i <= retries.length; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No insights available.";
      } catch (error) {
        if (i === retries.length) return "Sorry, I couldn't fetch insights right now. Please try again later.";
        await delay(retries[i]);
      }
    }
  };

  const handleGetCourseInfo = async (subject) => {
    setAiModal({ isOpen: true, title: `✨ Insights for ${subject}`, content: '', isLoading: true });
    const prompt = `You are an expert academic advisor for a Mechanical Engineering department. A student is taking the course '${subject}'. In 2-3 short paragraphs, explain what topics this course likely covers, why it's important for a mechanical engineer, and give one actionable tip to ace the class. Keep formatting clean with spacing. Do not use Markdown formatting unless absolutely necessary.`;
    const response = await generateAIContent(prompt);
    setAiModal(prev => ({ ...prev, content: response, isLoading: false }));
  };

  const handleGetDayPlan = async (day, classes) => {
    setAiModal({ isOpen: true, title: `✨ Optimize My ${day}`, content: '', isLoading: true });
    const classSummary = classes.map(c => `${c.time}: ${c.subject}`).join('\n');
    const prompt = `You are a productivity coach. A student has the following class schedule for ${day}:\n${classSummary}\nSuggest a realistic daily schedule from 7:00 AM to 10:00 PM. Include wake up time, travel, the classes, lunch, study blocks, and relaxation. Make it practical and encouraging. Do not use Markdown formatting unless absolutely necessary. Keep the formatting clean and readable using line breaks.`;
    const response = await generateAIContent(prompt);
    setAiModal(prev => ({ ...prev, content: response, isLoading: false }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-8 h-8 text-indigo-600" />
              Section 23/A Routine
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Department of Mechanical Engineering • RUET</p>
            <p className="text-sm text-slate-400 mt-1">Effective from 11 July 2026 • Default Room: FS 201</p>
          </div>
          
          {/* View Toggle Controls */}
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto self-start md:self-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-4 h-4" />
              Day View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Table View
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        {viewMode === 'table' ? (
          <TableView />
        ) : (
          <ListView onCourseInfo={handleGetCourseInfo} onDayPlan={handleGetDayPlan} />
        )}
      </div>

      {/* AI Modal Overlay */}
      {aiModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-indigo-50/50">
              <h3 className="font-bold text-lg text-indigo-900">{aiModal.title}</h3>
              <button onClick={() => setAiModal({ ...aiModal, isOpen: false })} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 shadow-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {aiModal.isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-70">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                  <p className="font-medium text-slate-500">Consulting AI Assistant...</p>
                </div>
              ) : (
                aiModal.content
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW COMPONENTS
// ---------------------------------------------------------------------------

function TableView() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="p-3 font-semibold w-[10%] border-r border-slate-200 text-center sticky left-0 z-10 bg-slate-50">Day</th>
              {timeSlots.map(slot => (
                <th key={slot.id} className={`p-1.5 font-semibold text-center ${slot.isBreak ? 'w-[4%]' : 'w-[9.5%]'}`}>
                  <div className="text-slate-900 leading-tight">
                    {slot.isBreak ? (slot.id === 'break1' ? '☕' : '🍱') : slot.label}
                  </div>
                  {!slot.isBreak && <div className="text-slate-400 font-normal mt-0.5 text-[8px] truncate">{slot.time}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {activeDays.map(day => {
              let skipSlots = 0; // Keep track of slots to skip if a lab spans multiple periods

              return (
                <tr key={day} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50">
                  <td className="p-2 font-semibold text-slate-800 border-r border-slate-200 text-center bg-slate-50/90 sticky left-0 z-10 text-xs">
                    {day}
                  </td>
                  
                  {timeSlots.map((slot, index) => {
                    // 1. Handle Breaks (Render simple icon to save space and prevent tall rows)
                    if (slot.isBreak) {
                      return (
                        <td key={slot.id} className="p-0 bg-slate-100/50 border-l border-slate-100 text-center">
                          <div className="h-full flex flex-col items-center justify-center text-slate-300 py-2">
                            {slot.id === 'break1' ? <Coffee className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
                          </div>
                        </td>
                      );
                    }

                    // 2. Handle spans (If a previous class had a duration > 1, we skip rendering this td)
                    if (skipSlots > 0) {
                      skipSlots--;
                      return null;
                    }

                    // 3. Render Class or Empty Slot
                    const classInfo = routineData[day]?.[slot.id];
                    
                    if (classInfo) {
                      if (classInfo.duration > 1) {
                        skipSlots = classInfo.duration - 1;
                      }
                      return (
                        <td 
                          key={slot.id} 
                          colSpan={classInfo.duration || 1} 
                          className="p-1 border-l border-slate-100 align-top h-full"
                        >
                          <div className={`p-1.5 rounded border h-full flex flex-col gap-1 min-h-[55px] justify-center overflow-hidden ${
                            classInfo.type === 'lab' 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-900' 
                              : 'bg-indigo-50 border-indigo-100 text-indigo-900'
                          }`}>
                            <div className="font-bold text-[10px] leading-tight truncate">{classInfo.subject}</div>
                            <div className="flex flex-col gap-0.5 text-[8px] opacity-90">
                              <span className="flex items-center gap-1 overflow-hidden">
                                <User className="w-2.5 h-2.5 flex-shrink-0" /> 
                                <span className="truncate">{classInfo.teacher}</span>
                              </span>
                              <span className="flex items-center gap-1 overflow-hidden">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> 
                                <span className="truncate">{classInfo.room}</span>
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    } else {
                      return (
                        <td key={slot.id} className="p-1 border-l border-slate-100 align-top h-full">
                          <div className="h-full min-h-[55px] flex items-center justify-center text-slate-200 text-xs">
                            -
                          </div>
                        </td>
                      );
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ListView({ onCourseInfo, onDayPlan }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeDays.map(day => {
        const dayRoutine = routineData[day];
        if (!dayRoutine) return null;

        const dayClasses = [];
        let skipListSlots = 0;

        // Map through slots and combine times if duration > 1
        timeSlots.forEach((slot, index) => {
          if (slot.isBreak) {
            dayClasses.push({ ...slot, type: 'break' });
            return;
          }
          if (skipListSlots > 0) {
            skipListSlots--;
            return;
          }
          
          const classInfo = dayRoutine[slot.id];
          if (classInfo) {
            let displayTime = slot.time;
            let displayLabel = slot.label;

            if (classInfo.duration > 1) {
              skipListSlots = classInfo.duration - 1;
              const endSlot = timeSlots[index + classInfo.duration - 1]; 
              
              // Combine the start time of the first period with the end time of the last period
              displayTime = `${slot.time.split(' - ')[0]} - ${endSlot.time.split(' - ')[1]}`;
              displayLabel = `${slot.label} - ${endSlot.label} Period`;
            }
            
            dayClasses.push({
              ...slot,
              ...classInfo,
              time: displayTime,
              label: displayLabel
            });
          }
        });

        // Filter out unnecessary breaks (e.g., break at the end of the day or consecutive breaks)
        const cleanClasses = dayClasses.filter((item, idx, arr) => {
          if (item.type === 'break' && (idx === 0 || arr[idx-1]?.type === 'break')) return false;
          if (item.type === 'break' && idx === arr.length - 1) return false;
          return true;
        });

        return (
          <div key={day} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-5 py-4 border-b border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{day}</h2>
                <span className="text-xs font-medium px-2 py-1 bg-slate-700 text-slate-200 rounded-full">
                  {cleanClasses.filter(c => c.type !== 'break').length} Classes
                </span>
              </div>
              <button 
                onClick={() => onDayPlan(day, cleanClasses.filter(c => c.type !== 'break'))}
                className="text-xs font-semibold bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/40 hover:text-white transition-colors py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 w-full border border-indigo-500/30"
              >
                ✨ Optimize My Day
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              {cleanClasses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No classes scheduled</div>
              ) : (
                cleanClasses.map((item, idx) => {
                  if (item.type === 'break') {
                    return (
                      <div key={idx} className="flex items-center gap-3 py-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {item.label} ({item.time})
                        </div>
                        <div className="h-px bg-slate-200 flex-1"></div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 ${
                      item.type === 'lab' 
                        ? 'bg-emerald-50 border-emerald-100' 
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className={`font-bold text-base ${item.type === 'lab' ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {item.subject}
                          </h3>
                          <div className={`text-xs font-medium mt-1 inline-flex px-2 py-0.5 rounded ${
                            item.type === 'lab' ? 'bg-emerald-200/50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.label} • {item.time}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.type === 'lab' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                          }`}>
                            {item.type === 'lab' ? <BookOpen className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                          </div>
                          {!item.subject?.includes('Break') && (
                            <button 
                              onClick={() => onCourseInfo(item.subject)}
                              className={`text-[10px] font-bold px-2 py-1 rounded transition-colors whitespace-nowrap border ${
                                item.type === 'lab' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                              }`}
                            >
                              ✨ Info
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100/60">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-medium truncate">{item.teacher}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium truncate">{item.room}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
