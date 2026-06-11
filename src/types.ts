/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StackVariable {
  address: string;
  name: string;
  value: string; // The representation shown in stack (e.g. "0x9F30" for pointer, or literal value like "42")
  isPointer: boolean;
  pointsTo: string | null; // Heap Address
  scope: string; // e.g. "global", "my_func"
}

export interface HeapObject {
  address: string;
  type: 'list' | 'dict' | 'string' | 'object' | 'primitive';
  value: any; // Display representation (e.g. "[1, 2, 3]", "{\"a\": 10}", etc)
  refCount: number;
  highlighted: boolean;
  label?: string; // Additional label, like "Element inside array" or key/index annotations
}

export interface DebugState {
  code: string;
  lines: string[];
  currentLineIndex: number;
  stack: StackVariable[];
  heap: { [address: string]: HeapObject };
  stdout: string[];
  feedback?: string;
  variablesInScope: string[];
}

export interface Lesson {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  description: string;
  code: string;
  tasks: string[];
  explanation: string;
}

export interface DragBlock {
  id: string;
  type: 'variable' | 'list' | 'pointer' | 'modify_list' | 'function' | 'clear' | 'append';
  label: string;
  codeTemplate: string;
  color: string;
  inputs?: { name: string; type: string; default: string }[];
}

export interface CollaborationState {
  roomId: string;
  roomName: string;
  creatorId: string;
  creatorName: string;
  code: string;
  activeCollaborators: { uid: string; name: string; cursorLine?: number }[];
  currentLineIndex: number;
  isRunning: boolean;
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherEmail: string;
  students: { uid: string; email: string; name: string; completedLessons: string[] }[];
  sharedExercises: { id: string; title: string; code: string; task: string }[];
}
