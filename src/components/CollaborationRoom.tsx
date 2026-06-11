/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Users, LogIn, Plus, Send, Radio, UserCheck, ShieldAlert, Sparkles } from "lucide-react";
import { localDb, localAuth } from "../firebase";
import { CollaborationState } from "../types";

interface CollaborationRoomProps {
  currentCode: string;
  onCodeSynced: (code: string) => void;
  currentLine: number;
  onLineSynced: (line: number) => void;
}

export default function CollaborationRoom({
  currentCode,
  onCodeSynced,
  currentLine,
  onLineSynced,
}: CollaborationRoomProps) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"Driver" | "Navigator">("Navigator");
  const [roomId, setRoomId] = useState<string>("");
  const [roomNameInput, setRoomNameInput] = useState<string>("");
  const [activeRoom, setActiveRoom] = useState<CollaborationState | null>(null);

  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; text: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [userNameInput, setUserNameInput] = useState<string>("");

  useEffect(() => {
    const unsub = localAuth.subscribe((u) => {
      setUser(u);
    });
    return unsub;
  }, []);

  // Monitor collaboration updates
  useEffect(() => {
    if (!roomId) return;
    const unsub = localDb.subscribe("rooms", roomId, (data) => {
      if (data) {
        setActiveRoom(data);
        if (data.code && data.code !== currentCode) {
          onCodeSynced(data.code);
        }
        if (data.currentLineIndex !== undefined && data.currentLineIndex !== currentLine) {
          onLineSynced(data.currentLineIndex);
        }
      }
    });

    const unsubChat = localDb.subscribe("room_chats", roomId, (data) => {
      if (data && data.messages) {
        setChatMessages(data.messages);
      } else {
        setChatMessages([]);
      }
    });

    return () => {
      unsub();
      unsubChat();
    };
  }, [roomId]);

  // Sync edits to database
  useEffect(() => {
    if (!roomId || !activeRoom) return;
    if (role === "Driver" && currentCode !== activeRoom.code) {
      localDb.setItem("rooms", roomId, {
        ...activeRoom,
        code: currentCode,
      });
    }
  }, [currentCode]);

  useEffect(() => {
    if (!roomId || !activeRoom) return;
    if (currentLine !== activeRoom.currentLineIndex) {
      localDb.setItem("rooms", roomId, {
        ...activeRoom,
        currentLineIndex: currentLine,
      });
    }
  }, [currentLine]);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNameInput.trim()) return;
    const isTeacher = userNameInput.toLowerCase().includes("teacher") || userNameInput.toLowerCase().includes("prof");
    localAuth.signInSimulated(userNameInput.trim(), isTeacher ? "teacher" : "student");
  };

  const createRoom = () => {
    if (!user) return;
    const newId = "ROOM-" + Math.floor(1000 + Math.random() * 9000);
    const mockRoom: CollaborationState = {
      roomId: newId,
      roomName: roomNameInput.trim() || `Pair Program # ${newId}`,
      creatorId: user.uid,
      creatorName: user.name,
      code: currentCode || "x = [10, 20]\ny = x\ny.append(30)\n",
      activeCollaborators: [{ uid: user.uid, name: `${user.name} (${role})`, cursorLine: 0 }],
      currentLineIndex: 0,
      isRunning: false,
    };
    localDb.setItem("rooms", newId, mockRoom);
    localDb.setItem("room_chats", newId, {
      id: newId,
      messages: [
        {
          id: "sys_1",
          sender: "System Assistant",
          text: `Welcome to collaborative room ${newId}! Discuss low level pointers and step execution.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    });
    setRoomId(newId);
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    const targetRoom = localDb.getItem("rooms", roomId.toUpperCase().trim());
    if (targetRoom) {
      const formattedId = roomId.toUpperCase().trim();
      const updatedCollaborators = [
        ...(targetRoom.activeCollaborators || []),
        { uid: user?.uid || "unregistered", name: `${user?.name || "Anonymous"} (${role})` },
      ];
      localDb.setItem("rooms", formattedId, {
        ...targetRoom,
        activeCollaborators: updatedCollaborators,
      });
      setRoomId(formattedId);
    } else {
      alert("Room ID not found inside local cloud mock directory.");
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      sender: user?.name || "Anonymous Student",
      text: newMessage.trim(),
      time: timeStr,
    };
    const currentChat = localDb.getItem("room_chats", roomId);
    const msgs = currentChat ? [...(currentChat.messages || []), newMsg] : [newMsg];
    localDb.setItem("room_chats", roomId, { id: roomId, messages: msgs });
    setNewMessage("");
  };

  const leaveRoom = () => {
    if (activeRoom && roomId) {
      const cleanCollabs = (activeRoom.activeCollaborators || []).filter((c) => c.uid !== user?.uid);
      localDb.setItem("rooms", roomId, {
        ...activeRoom,
        activeCollaborators: cleanCollabs,
      });
    }
    setActiveRoom(null);
    setRoomId("");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col h-full" id="collaboration-room-card">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-500/10 w-9 h-9 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-white">Live Code Sharing Rooms</h3>
            <p className="text-[11px] text-slate-400">Collaborate with peers to trace Stack arrays jointly</p>
          </div>
        </div>

        {activeRoom && (
          <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-xl text-xs font-mono font-bold animate-pulse">
            <Radio className="w-3.5 h-3.5" />
            <span>ROOM: {roomId}</span>
          </div>
        )}
      </div>

      {/* USER REGISTRATION / SIGN IN */}
      {!user ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
          <ShieldAlert className="w-9 h-9 text-indigo-400 mb-3" />
          <h4 className="text-sm font-sans font-semibold text-white mb-1.5">Enter Laboratory Identity</h4>
          <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-4">
            Type your student name to unlock multi-user sharing capabilities.
          </p>
          <form onSubmit={handleSignIn} className="flex gap-2 w-full max-w-[320px]">
            <input
              type="text"
              placeholder="e.g., Ada Lovelace"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-sans text-slate-100 flex-grow outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-xl text-white font-sans text-xs font-semibold transition"
            >
              Sign In
            </button>
          </form>
        </div>
      ) : !activeRoom ? (
        /* ROOM MANAGER DASHBOARD - CREATE OR JOIN ROOMS */
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* CREATE ROOM PANEL */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-300">
                Host New Pairing Session
              </h4>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Session Topic (e.g. Variables Laboratory)"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs font-sans outline-none text-slate-300"
              />
              
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 font-sans uppercase">Your Pairing Role:</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setRole("Driver")}
                    className={`flex-grow p-2 text-center rounded-lg text-xs font-semibold transition ${
                      role === "Driver" ? "bg-indigo-500/10 border border-indigo-400 text-indigo-300" : "bg-slate-900 text-slate-400 border border-transparent"
                    }`}
                  >
                    Driver (Can Code)
                  </button>
                  <button
                    onClick={() => setRole("Navigator")}
                    className={`flex-grow p-2 text-center rounded-lg text-xs font-semibold transition ${
                      role === "Navigator" ? "bg-indigo-500/10 border border-indigo-400 text-indigo-300" : "bg-slate-900 text-slate-400 border border-transparent"
                    }`}
                  >
                    Navigator (Can View)
                  </button>
                </div>
              </div>

              <button
                onClick={createRoom}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-sans text-xs font-medium py-2 rounded-xl transition"
              >
                Host Live Room
              </button>
            </div>
          </div>

          {/* JOIN ROOM PANEL */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <LogIn className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-300">
                Join Active Lab Session
              </h4>
            </div>
            <form onSubmit={joinRoom} className="space-y-3.5">
              <input
                type="text"
                placeholder="Enter Room Code (e.g. ROOM-101)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-xl p-2.5 text-xs font-mono outline-none text-slate-300 uppercase"
              />

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-sans uppercase">Your Pairing Role:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("Driver")}
                    className={`flex-grow p-2 text-center rounded-lg text-xs font-semibold transition ${
                      role === "Driver" ? "bg-indigo-500/10 border border-indigo-400 text-indigo-300" : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Driver (Can Code)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("Navigator")}
                    className={`flex-grow p-2 text-center rounded-lg text-xs font-semibold transition ${
                      role === "Navigator" ? "bg-indigo-500/10 border border-indigo-400 text-indigo-300" : "bg-slate-900 text-slate-400"
                    }`}
                  >
                    Navigator (Can View)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-sans text-xs font-medium py-2 rounded-xl transition"
              >
                Connect to Client
              </button>
            </form>
          </div>

        </div>
      ) : (
        /* ROOM COLLABORATION EXPERIENCE CONNECTED */
        <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
          
          {/* ROSTER / COLLABORATION SIDEBAR PANEL */}
          <div className="md:col-span-4 flex flex-col bg-slate-950/80 border border-slate-850 rounded-xl p-4 overflow-y-auto">
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-indigo-500/10 mb-3 text-indigo-400 leading-normal">
              <UserCheck className="w-4 h-4" />
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold">Active Partners</span>
            </div>

            <div className="space-y-2 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between p-2 bg-indigo-500/10 rounded-lg text-indigo-200 border border-indigo-500/15">
                <span className="font-mono text-xs">{user.name}</span>
                <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">{role}</span>
              </div>
              {(activeRoom.activeCollaborators || [])
                .filter((col) => col.uid !== user.uid)
                .map((col, ids) => (
                  <div key={ids} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-slate-300 border border-slate-800">
                    <span className="font-mono text-xs">{col.name}</span>
                    <span className="text-[9px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded border border-slate-850">NAVIGATING</span>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-900 mt-3">
              <button
                onClick={leaveRoom}
                className="w-full py-1.5 bg-slate-900 hover:bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-sans font-medium rounded-xl transition"
              >
                Disconnect Room
              </button>
            </div>
          </div>

          {/* PAIR CHAT PANEL */}
          <div className="md:col-span-8 flex flex-col bg-slate-950 p-4 border border-slate-850 rounded-xl h-[300px] md:h-auto overflow-hidden">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-2 text-slate-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Partner Chat Channel</span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2.5 mb-3 pr-1 text-slate-300">
              {chatMessages.length === 0 ? (
                <p className="text-slate-600 italic text-[10px] text-center py-12">Discuss Stack allocation syntax here...</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-semibold text-[10px] text-slate-400">{msg.sender}</span>
                      <span className="text-[8px] text-slate-600 font-mono">{msg.time}</span>
                    </div>
                    <p className="bg-slate-900 p-2 rounded-lg text-xs font-sans tracking-tight border border-slate-800/40 text-slate-200">
                      {msg.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Discuss pointer mutations..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs outline-none text-slate-100 placeholder-slate-600 focus:border-indigo-400"
              />
              <button
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 p-2 rounded-xl text-white transition flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* FOOTER */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/20 px-4 py-2.5 rounded-xl text-[11px] text-slate-500">
        In <strong>Pair Programming</strong>, the <strong>Driver</strong> updates the Python code & triggers actions, while the <strong>Navigator</strong> reviews references and assists with logic.
      </div>

    </div>
  );
}
