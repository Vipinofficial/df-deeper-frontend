/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Trash2, ArrowUpCircle, PlaySquare, MoveRight, Code, Sparkles, HelpCircle } from "lucide-react";
import { DragBlock } from "../types";

interface DragDropWorkspaceProps {
  onCompile: (pythonCode: string) => void;
}

const AVAILABLE_BLOCKS: DragBlock[] = [
  {
    id: "b_var",
    type: "variable",
    label: "Integer Allocation",
    codeTemplate: "{var_name} = {val}",
    color: "from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 border-blue-500/20 text-blue-300",
    inputs: [
      { name: "var_name", type: "text", default: "x" },
      { name: "val", type: "number", default: "42" },
    ],
  },
  {
    id: "b_list",
    type: "list",
    label: "List Allocation",
    codeTemplate: "{var_name} = [{vals}]",
    color: "from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/20 hover:to-emerald-600/10 border-emerald-500/20 text-emerald-300",
    inputs: [
      { name: "var_name", type: "text", default: "nums" },
      { name: "vals", type: "text", default: "10, 20" },
    ],
  },
  {
    id: "b_alias",
    type: "pointer",
    label: "Alias Reference (Pointer)",
    codeTemplate: "{new_var} = {old_var}",
    color: "from-indigo-500/10 to-indigo-600/5 hover:from-indigo-500/20 hover:to-indigo-600/10 border-indigo-500/20 text-indigo-300",
    inputs: [
      { name: "new_var", type: "text", default: "alias_ref" },
      { name: "old_var", type: "text", default: "nums" },
    ],
  },
  {
    id: "b_append",
    type: "append",
    label: "Append to List",
    codeTemplate: "{var_name}.append({val})",
    color: "from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 border-purple-500/20 text-purple-300",
    inputs: [
      { name: "var_name", type: "text", default: "nums" },
      { name: "val", type: "number", default: "30" },
    ],
  },
  {
    id: "b_modify",
    type: "modify_list",
    label: "Modify List Index",
    codeTemplate: "{var_name}[{idx}] = {val}",
    color: "from-pink-500/10 to-pink-600/5 hover:from-pink-500/20 hover:to-pink-600/10 border-pink-500/20 text-pink-300",
    inputs: [
      { name: "var_name", type: "text", default: "nums" },
      { name: "idx", type: "number", default: "0" },
      { name: "val", type: "number", default: "99" },
    ],
  },
  {
    id: "b_print",
    type: "function",
    label: "Console Print",
    codeTemplate: "print({var_name})",
    color: "from-amber-500/10 to-amber-600/5 hover:from-amber-500/20 hover:to-amber-600/10 border-amber-500/20 text-amber-300",
    inputs: [{ name: "var_name", type: "text", default: "nums" }],
  },
  {
    id: "b_none",
    type: "clear",
    label: "Set Variable to None",
    codeTemplate: "{var_name} = None",
    color: "from-slate-500/10 to-slate-600/5 hover:from-slate-500/20 hover:to-slate-600/10 border-slate-500/20 text-slate-300",
    inputs: [{ name: "var_name", type: "text", default: "nums" }],
  },
];

interface ConfiguredBlock {
  uid: string;
  templateId: string;
  values: { [key: string]: string };
}

export default function DragDropWorkspace({ onCompile }: DragDropWorkspaceProps) {
  const [timeline, setTimeline] = useState<ConfiguredBlock[]>([
    // Prep seed sequence
    { uid: "seed_1", templateId: "b_list", values: { var_name: "a", vals: "5, 10" } },
    { uid: "seed_2", templateId: "b_alias", values: { new_var: "b", old_var: "a" } },
    { uid: "seed_3", templateId: "b_append", values: { var_name: "b", val: "15" } },
    { uid: "seed_4", templateId: "b_modify", values: { var_name: "b", idx: "0", val: "99" } },
    { uid: "seed_5", templateId: "b_print", values: { var_name: "a" } },
  ]);

  const addBlockToTimeline = (template: DragBlock) => {
    const initialVals: { [key: string]: string } = {};
    template.inputs?.forEach((input) => {
      initialVals[input.name] = input.default;
    });

    setTimeline([
      ...timeline,
      {
        uid: "inst_" + Math.random().toString(36).substring(2, 9),
        templateId: template.id,
        values: initialVals,
      },
    ]);
  };

  const updateBlockValue = (blockUid: string, inputName: string, newVal: string) => {
    setTimeline(
      timeline.map((b) => {
        if (b.uid === blockUid) {
          return {
            ...b,
            values: { ...b.values, [inputName]: newVal },
          };
        }
        return b;
      })
    );
  };

  const removeBlock = (blockUid: string) => {
    setTimeline(timeline.filter((b) => b.uid !== blockUid));
  };

  const compileToPython = () => {
    const pythonLines = timeline.map((c) => {
      const template = AVAILABLE_BLOCKS.find((t) => t.id === c.templateId);
      if (!template) return "";
      let renderedLine = template.codeTemplate;
      Object.keys(c.values).forEach((key) => {
        renderedLine = renderedLine.replace(`{${key}}`, c.values[key]);
      });
      return renderedLine;
    });

    onCompile(pythonLines.join("\n"));
  };

  const clearWorkspace = () => {
    setTimeline([]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col h-full" id="workspace-drag-drop-card">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5" id="workspace-header-actions">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-500/30">
            <Plus className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-base text-white">Visual Block Builder</h3>
            <p className="text-[11px] text-slate-400">Click library blocks to stack instruction sequences</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearWorkspace}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 rounded-xl text-neutral-400 hover:text-white font-mono text-xs border border-slate-800 transition duration-150"
          >
            Clear All
          </button>
          <button
            onClick={compileToPython}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/10 transition duration-150"
            id="compile-blocks-btn"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Load Workspace Code</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-grow overflow-hidden leading-relaxed">
        
        {/* BLOCKS DRAWER LIBRARY */}
        <div className="md:col-span-5 flex flex-col h-[200px] md:h-auto overflow-hidden bg-slate-950 p-4 border border-slate-800/80 rounded-xl">
          <p className="font-sans font-semibold text-slate-400 uppercase tracking-widest text-[10px] mb-3 ml-1">
            Blocks Library (Traceable Operations)
          </p>
          <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
            {AVAILABLE_BLOCKS.map((temp) => (
              <button
                key={temp.id}
                onClick={() => addBlockToTimeline(temp)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 bg-gradient-to-tr ${temp.color}`}
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-xs font-sans text-slate-100">{temp.label}</p>
                  <p className="font-mono text-[9px] opacity-70 tracking-tight">{temp.codeTemplate}</p>
                </div>
                <div className="bg-slate-950/40 w-6 h-6 rounded-lg flex items-center justify-center border border-white/5 shrink-0 ml-2">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ACTIVE TIMELINE WORKSPACE */}
        <div className="md:col-span-7 flex flex-col h-[320px] md:h-auto overflow-hidden relative">
          <p className="font-sans font-semibold text-slate-400 uppercase tracking-widest text-[10px] mb-3 ml-1">
            Build Block Stack (Sequential execution)
          </p>

          <div className="flex-grow bg-slate-950/40 border border-dashed border-slate-800 rounded-xl overflow-y-auto p-4 space-y-3.5 pr-2" id="timeline-droppoint">
            {timeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                <HelpCircle className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500 font-sans">Sequence stack is empty.</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                  Click on blocks in the library on the left to start appending heap instructions!
                </p>
              </div>
            ) : (
              timeline.map((item, idx) => {
                const temp = AVAILABLE_BLOCKS.find((b) => b.id === item.templateId);
                if (!temp) return null;

                return (
                  <div
                    key={item.uid}
                    className="flex md:items-center justify-between p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg ring-1 ring-slate-800/10 hover:ring-slate-700/20 group transition duration-150"
                  >
                    <div className="flex items-start md:items-center gap-3 flex-wrap">
                      <div className="bg-slate-950 w-5 h-5 rounded-md flex items-center justify-center border border-slate-800 font-mono text-[10px] text-slate-500 font-semibold selection:bg-indigo-500 mt-1 md:mt-0">
                        {idx + 1}
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-indigo-400 font-sans uppercase tracking-widest">
                          {temp.label}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {temp.inputs?.map((input) => (
                            <div
                              key={input.name}
                              className="flex items-center gap-1.5 bg-slate-950 rounded-lg px-2 py-1 border border-slate-800"
                            >
                              <span className="font-mono text-[9px] text-slate-500">{input.name}:</span>
                              <input
                                type={input.type}
                                value={item.values[input.name] ?? ""}
                                onChange={(e) => updateBlockValue(item.uid, input.name, e.target.value)}
                                className="bg-transparent font-mono text-[10px] text-indigo-300 w-16 md:w-20 outline-none border-none focus:ring-0 p-0 text-center"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeBlock(item.uid)}
                      className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-slate-950 rounded-lg shrink-0 transition self-start md:self-center ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/20 flex items-center gap-2.5 rounded-xl px-4 py-2 bg-slate-950">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-[11px] text-slate-400">
          <strong>Tip</strong>: Instantiating variables pointing to the same name automatically triggers 
          <strong> Pointer Aliasing</strong>, allowing modifications inside lists to ripple across both references!
        </span>
      </div>

    </div>
  );
}
