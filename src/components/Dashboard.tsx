/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GraduationCap, Award, CheckCircle, CheckSquare, PlusCircle, BookOpen, AlertCircle, FileSpreadsheet } from "lucide-react";
import { localDb, localAuth } from "../firebase";
import { Classroom } from "../types";

export default function Dashboard({ onLoadCode }: { onLoadCode: (code: string) => void }) {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "assignments">("students");
  const [newTitle, setNewTitle] = useState("");
  const [newCodeBlock, setNewCodeBlock] = useState("");
  const [newTaskText, setNewTaskText] = useState("");

  const classroomId = "CLASS-V7";

  useEffect(() => {
    const unsub = localDb.subscribe("classrooms", classroomId, (data) => {
      if (data) {
        setClassroom(data);
      }
    });
    return unsub;
  }, []);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCodeBlock.trim() || !classroom) return;

    const newExercise = {
      id: "ex_" + Math.floor(Math.random() * 10000),
      title: newTitle.trim(),
      code: newCodeBlock.trim(),
      task: newTaskText.trim() || "Analyze the memory mutations inside the simulator.",
    };

    const updated = {
      ...classroom,
      sharedExercises: [...(classroom.sharedExercises || []), newExercise],
    };

    localDb.setItem("classrooms", classroomId, updated);
    setNewTitle("");
    setNewCodeBlock("");
    setNewTaskText("");
  };

  const handleExportCSV = () => {
    if (!classroom) return;
    let csvContent = "data:text/csv;charset=utf-8,Student Name,Student Email,Completed UnitsCount,Completed Lessons\n";
    classroom.students?.forEach((st) => {
      csvContent += `"${st.name}","${st.email}",${st.completedLessons?.length || 0},"${st.completedLessons?.join("; ") || ""}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.setAttribute("download", `classroom_report_${classroom.name.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!classroom) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400 text-center py-20">
        <AlertCircle className="w-9 h-9 text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading Classroom Management Directory...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col h-full" id="classroom-panel">
      
      {/* HEADER ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5" id="classroom-header">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 w-10 h-10 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-white">{classroom.name}</h3>
            <p className="text-[11px] text-slate-400">Class Key Code: <strong className="font-mono text-indigo-300">{classroom.code}</strong> | Teacher: {classroom.teacherEmail}</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 p-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 text-indigo-300 text-[11px] rounded-xl font-sans transition duration-150"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Export Student Report (.csv)</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Curated Lessons</p>
            <p className="text-base font-bold text-white">4 Available</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Active Group Size</p>
            <p className="text-base font-bold text-white">{classroom.students?.length || 0} Registered</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 border border-slate-800/80 rounded-xl flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Completed Units (Total)</p>
            <p className="text-base font-bold text-white">
              {classroom.students?.reduce((acc, current) => acc + (current.completedLessons?.length || 0), 0) || 0} Completions
            </p>
          </div>
        </div>
      </div>

      {/* TAB CHANGER AREA */}
      <div className="flex border-b border-slate-800 mb-5 gap-4">
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-2.5 text-xs font-semibold font-sans uppercase tracking-wider ${
            activeTab === "students" ? "text-indigo-400 border-b-2 border-indigo-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Student Progress Grid
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`pb-2.5 text-xs font-semibold font-sans uppercase tracking-wider ${
            activeTab === "assignments" ? "text-indigo-400 border-b-2 border-indigo-400 font-bold" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Shared Teacher Assignments ({classroom.sharedExercises?.length || 0})
        </button>
      </div>

      {/* VIEW GRID DATA */}
      <div className="flex-grow">
        {activeTab === "students" ? (
          <div className="space-y-3.5" id="classroom-students-tab">
            <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 ml-1">
              Class Roster & Module Achievements
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bg-slate-950 border border-slate-800/60 rounded-xl">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono tracking-wide uppercase">
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Units Mastered</th>
                    <th className="p-3.5">Status Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {classroom.students?.map((student) => (
                    <tr key={student.uid} className="hover:bg-slate-950/80 transition">
                      <td className="p-3.5 font-sans font-medium text-white">{student.name}</td>
                      <td className="p-3.5 font-mono text-slate-400">{student.email}</td>
                      <td className="p-3.5 font-mono text-indigo-300 font-semibold">{student.completedLessons?.length || 0} / 4</td>
                      <td className="p-3.5">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ASSIGNMENTS / CHALLENGE INJECTS */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5" id="classroom-assignments-tab">
            
            {/* INJECTED ASSIGNMENTS LIST */}
            <div className="md:col-span-7 space-y-3.5">
              <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500 ml-1">
                Active Assignments
              </p>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {classroom.sharedExercises?.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="text-white font-bold text-xs font-sans">{ex.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{ex.task}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded font-mono text-[10px] text-slate-400 line-clamp-2 max-h-16 overflow-hidden">
                      {ex.code}
                    </div>
                    <button
                      onClick={() => onLoadCode(ex.code)}
                      className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-400 font-sans font-semibold rounded-lg text-[10px] border border-indigo-500/15 text-center mt-1 transition"
                    >
                      Load into RAM Simulator
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ASSIGNMENT CREATION FORM */}
            <form onSubmit={handleCreateAssignment} className="md:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5 h-fit shadow-lg">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-indigo-500/15 mb-2 text-indigo-400 font-bold text-xs uppercase font-mono tracking-wider">
                <PlusCircle className="w-4 h-4" />
                <span>Create Lab Challenge</span>
              </div>
              <div className="space-y-2 text-slate-300">
                <input
                  type="text"
                  placeholder="Challenge Name (e.g., Array Copying)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  required
                />
                <textarea
                  placeholder="Python laboratory code definition..."
                  rows={4}
                  value={newCodeBlock}
                  onChange={(e) => setNewCodeBlock(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Instructions for students..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-sans text-xs font-semibold rounded-xl transition"
              >
                Publish Challenge to Room
              </button>
            </form>

          </div>
        )}
      </div>

    </div>
  );
}
