/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Local-only simulation layer for the classroom (Dashboard.tsx) and pair-programming
// (CollaborationRoom.tsx) features. These are explicitly deferred/out of scope for the
// DevFrogs productionization pass (see learn/deeper/README.md) — a real-time multi-user
// backend for classrooms and live pairing is a materially bigger, separate lift.
//
// This file used to be firebase.ts and pretended to wrap Firebase; it never actually did
// (IS_CLOUD_CONNECTED was hardcoded false, db/auth were always null, and nothing besides
// this file imported the firebase package). Real app authentication is now handled by
// @devfrogs/auth-ui's useCentralAuth in App.tsx — this module is ONLY the localStorage-backed
// simulation for classrooms/pairing, renamed to make that scope explicit.
//
// All simulation reads/writes sync in localStorage or custom event listeners for
// instant same-tab/cross-tab collaboration simulation.
class SimulatedDatabase {
  private listeners: { [key: string]: Function[] } = {};

  constructor() {
    // Listen for cross-tab or current-tab sync events
    window.addEventListener("local-database-update", (e: any) => {
      const { collection, id } = e.detail;
      const path = `${collection}/${id}`;
      if (this.listeners[path]) {
        const data = this.getItem(collection, id);
        this.listeners[path].forEach((cb) => cb(data));
      }
      if (this.listeners[collection]) {
        const all = this.getAll(collection);
        this.listeners[collection].forEach((cb) => cb(all));
      }
    });
  }

  private getKey(collection: string, id: string) {
    return `ram_sim_${collection}_${id}`;
  }

  getItem(collection: string, id: string) {
    const raw = localStorage.getItem(this.getKey(collection, id));
    return raw ? JSON.parse(raw) : null;
  }

  setItem(collection: string, id: string, data: any) {
    localStorage.setItem(this.getKey(collection, id), JSON.stringify({ ...data, id }));
    // Notify lists
    const indexKey = `ram_sim_index_${collection}`;
    const rawIndex = localStorage.getItem(indexKey);
    const indexSet = new Set(rawIndex ? JSON.parse(rawIndex) : []);
    indexSet.add(id);
    localStorage.setItem(indexKey, JSON.stringify(Array.from(indexSet)));

    // Emit event
    window.dispatchEvent(
      new CustomEvent("local-database-update", {
        detail: { collection, id },
      })
    );
  }

  deleteItem(collection: string, id: string) {
    localStorage.removeItem(this.getKey(collection, id));
    const indexKey = `ram_sim_index_${collection}`;
    const rawIndex = localStorage.getItem(indexKey);
    if (rawIndex) {
      const list = JSON.parse(rawIndex).filter((item: string) => item !== id);
      localStorage.setItem(indexKey, JSON.stringify(list));
    }
    window.dispatchEvent(
      new CustomEvent("local-database-update", {
        detail: { collection, id },
      })
    );
  }

  getAll(collection: string) {
    const indexKey = `ram_sim_index_${collection}`;
    const rawIndex = localStorage.getItem(indexKey);
    if (!rawIndex) return [];
    const list: string[] = JSON.parse(rawIndex);
    return list
      .map((id) => this.getItem(collection, id))
      .filter((item) => item !== null);
  }

  subscribe(collection: string, id: string, cb: (data: any) => void) {
    const path = `${collection}/${id}`;
    if (!this.listeners[path]) this.listeners[path] = [];
    this.listeners[path].push(cb);
    // Trigger initial
    cb(this.getItem(collection, id));
    return () => {
      this.listeners[path] = this.listeners[path].filter((l) => l !== cb);
    };
  }

  subscribeList(collection: string, cb: (data: any[]) => void) {
    if (!this.listeners[collection]) this.listeners[collection] = [];
    this.listeners[collection].push(cb);
    // Trigger initial
    cb(this.getAll(collection));
    return () => {
      this.listeners[collection] = this.listeners[collection].filter((l) => l !== cb);
    };
  }
}

// Simulated per-room/per-classroom display identity used ONLY by the deferred
// pairing/classroom features. This is NOT app authentication — real sign-in is
// central SSO via @devfrogs/auth-ui (see App.tsx).
class SimulatedAuth {
  private userListeners: Function[] = [];
  private currentUser: any = null;

  constructor() {
    const saved = localStorage.getItem("ram_sim_auth_user");
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = null;
      }
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  subscribe(cb: (user: any) => void) {
    this.userListeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.userListeners = this.userListeners.filter((l) => l !== cb);
    };
  }

  signInSimulated(name: string, role: "student" | "teacher") {
    this.currentUser = {
      uid: "user_" + Math.random().toString(36).substring(2, 9),
      name,
      email: `${name.toLowerCase().replace(/\s+/g, "")}@edu.com`,
      role,
      completedLessons: [],
    };
    localStorage.setItem("ram_sim_auth_user", JSON.stringify(this.currentUser));
    this.userListeners.forEach((l) => l(this.currentUser));
    return this.currentUser;
  }

  signOutSimulated() {
    this.currentUser = null;
    localStorage.removeItem("ram_sim_auth_user");
    this.userListeners.forEach((l) => l(null));
  }

  updateUserCompletedLessons(lessonId: string) {
    if (this.currentUser) {
      const lessons = this.currentUser.completedLessons || [];
      if (!lessons.includes(lessonId)) {
        this.currentUser.completedLessons = [...lessons, lessonId];
        localStorage.setItem("ram_sim_auth_user", JSON.stringify(this.currentUser));
        this.userListeners.forEach((l) => l(this.currentUser));
      }
    }
  }
}

export const localDb = new SimulatedDatabase();
export const localAuth = new SimulatedAuth();

// Seed initial sample database records if empty
function seedDatabase() {
  const rooms = localDb.getAll("rooms");
  if (rooms.length === 0) {
    localDb.setItem("rooms", "ROOM-101", {
      id: "ROOM-101",
      roomName: "CS-101 Stack & Heap Basics",
      creatorName: "Prof. Alan Turing",
      code: `x = 42\ny = [10, 20]\nz = y\ny.append(30)\n`,
      activeCollaborators: [
        { uid: "collab_1", name: "Alice (AI Collaborator)", cursorLine: 2 },
        { uid: "collab_2", name: "Bob (Student)", cursorLine: 0 },
      ],
      currentLineIndex: 0,
      isRunning: false,
    });
  }

  const classrooms = localDb.getAll("classrooms");
  if (classrooms.length === 0) {
    localDb.setItem("classrooms", "CLASS-V7", {
      id: "CLASS-V7",
      name: "Intro to Python Internals (CS1)",
      code: "PY-MEM",
      teacherId: "teacher_alan",
      teacherEmail: "alan_turing@edu.com",
      students: [
        { uid: "student_1", email: "alice@edu.com", name: "Alice Cooper", completedLessons: ["vals_vs_refs", "stack_scope"] },
        { uid: "student_2", email: "bob@edu.com", name: "Bob Miller", completedLessons: ["vals_vs_refs"] },
        { uid: "student_3", email: "greg@edu.com", name: "Greg Hansen", completedLessons: [] },
      ],
      sharedExercises: [
        {
          id: "ex_1",
          title: "Pointer Aliasing Discovery",
          code: "a = [5, 6, 7]\nb = a\nb[0] = 99\n# What is a[0] now?",
          task: "Observe how editing index 0 of array 'b' updates 'a' simultaneously. Confirm that 'a' points to the same memory cell as 'b' inside the RAM Heap.",
        },
      ],
    });
  }
}

seedDatabase();
