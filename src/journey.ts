/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkspaceTab = "debugger" | "pvm" | "memory" | "data" | "oop" | "algo" | "cpu" | "os";

export type MemorySubTab = "references" | "callstack" | "recursion" | "garbage";

export type StageTarget =
  | { kind: "debugger"; code: string }
  | { kind: "lab"; workspaceTab: WorkspaceTab; memorySubTab?: MemorySubTab };

export interface JourneyStage {
  id: string;
  title: string;
  blurb: string;
  estMinutes: number;
  target: StageTarget;
  task: {
    instructions: string;
    autoCompleteOnSimEnd: boolean;
  };
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "journey_hello_world",
    title: "Hello, World!",
    blurb: "Write and run your very first Python program.",
    estMinutes: 5,
    target: {
      kind: "debugger",
      code: `# Your first program\nname = "Ada"\nprint("Hello, World!")\nprint(name)\n`,
    },
    task: {
      instructions: "Press Run and watch your first program execute line by line. See how the variable lands on the Stack and your text appears in the output console.",
      autoCompleteOnSimEnd: true,
    },
  },
  {
    id: "vals_vs_refs",
    title: "Variables & Memory",
    blurb: "Where do values actually live in RAM? Stack vs Heap.",
    estMinutes: 10,
    target: {
      kind: "debugger",
      code: `x = 42\ny = [10, 20]\nz = 42\n`,
    },
    task: {
      instructions: "Step through the code. Notice that x and z hold numbers directly on the Stack, while y holds a pointer to a list living in the Heap.",
      autoCompleteOnSimEnd: true,
    },
  },
  {
    id: "pointer_alias",
    title: "Lists & Pointers",
    blurb: "The classic aliasing bug: two names, one list.",
    estMinutes: 10,
    target: {
      kind: "debugger",
      code: `a = [1, 2]\nb = a\nb.append(3)\nprint(a)\n`,
    },
    task: {
      instructions: "Run the code and watch the ref count climb to 2. There is only ONE list in the Heap — both a and b point to it, so changing b changes a too.",
      autoCompleteOnSimEnd: true,
    },
  },
  {
    id: "stack_scope",
    title: "Functions & the Call Stack",
    blurb: "How function calls push and pop stack frames.",
    estMinutes: 10,
    target: {
      kind: "lab",
      workspaceTab: "memory",
      memorySubTab: "callstack",
    },
    task: {
      instructions: "Step through the call stack animation. Watch frames get pushed when functions are called and popped when they return — then mark this stage complete.",
      autoCompleteOnSimEnd: false,
    },
  },
  {
    id: "garbage_collect",
    title: "Garbage Collection",
    blurb: "What happens to memory nobody points at anymore.",
    estMinutes: 8,
    target: {
      kind: "debugger",
      code: `my_data = [9, 8]\nmy_data = None\n`,
    },
    task: {
      instructions: "Run the code. When my_data is set to None, the list's reference count drops to 0 and Python automatically frees the memory.",
      autoCompleteOnSimEnd: true,
    },
  },
  {
    id: "journey_data_structures",
    title: "Data Structures",
    blurb: "Lists, stacks, queues, and hash tables — hands-on.",
    estMinutes: 15,
    target: {
      kind: "lab",
      workspaceTab: "data",
    },
    task: {
      instructions: "Try each structure: append and pop on the list, push/pop the stack, enqueue the queue, and add a key to the hash table. Then mark this stage complete.",
      autoCompleteOnSimEnd: false,
    },
  },
  {
    id: "journey_algorithms",
    title: "Algorithms",
    blurb: "Bubble sort, binary search, and graph traversal.",
    estMinutes: 15,
    target: {
      kind: "lab",
      workspaceTab: "algo",
    },
    task: {
      instructions: "Step a bubble sort to the end, run a binary search, and try BFS vs DFS on the graph. Then mark this stage complete — you've gone from Hello World to algorithms!",
      autoCompleteOnSimEnd: false,
    },
  },
];

const PROGRESS_KEY = "ram_sim_journey_progress";

export function getLocalJourneyProgress(): string[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addLocalJourneyProgress(id: string): string[] {
  const current = getLocalJourneyProgress();
  if (!current.includes(id)) current.push(id);
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(current));
  } catch {}
  return current;
}
