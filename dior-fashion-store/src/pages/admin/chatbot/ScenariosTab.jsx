import React, { useState, useEffect } from 'react';
import { getScenarios, updateScenario, insertScenario, deleteScenario } from '../../../lib/api/chatbot';
import BotTrainer from './BotTrainer';

// Component UI cho quick replies
function QuickRepliesInput({ value, onChange }) {
  const [input, setInput] = useState('');
  function addReply() {
    if (input.trim()) {
      onChange([...(value || []), input.trim()]);
      setInput('');
    }
  }
  function removeReply(idx) {
    const arr = [...(value||[])];
    arr.splice(idx, 1);
    onChange(arr);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {(value || []).map((q, idx) =>
        <span key={idx} className="bg-gray-200 px-3 py-1 rounded-full text-xs flex items-center">
          {q}
          <button type="button" onClick={() => removeReply(idx)} className="ml-1 font-bold">×</button>
        </span>
      )}
      <input value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addReply()}
        placeholder="Thêm quick reply"
        className="border px-2 rounded text-xs"
      />
      <button type="button" onClick={addReply} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Add</button>
    </div>
  );
}

export default function ScenariosTab() {
  const [scenarios, setScenarios] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newScenario, setNewScenario] = useState({
    trigger_keywords: '',
    name: '',
    response_template: '',
    is_active: true,
    response_type: 'template',
    quick_replies: [],
    priority: 1,
    intent: '',
    llm_system_prompt: ''
  });

  useEffect(() => { loadScenarios(); }, []);
  async function loadScenarios() {
    try {
      const data = await getScenarios();
      setScenarios(data || []);
    } catch (err) {
      alert('Failed to fetch scenarios');
    }
  }

  function startEdit(sc) {
    setEditingId(sc.id);
    setEditForm({
      ...sc,
      quick_replies: Array.isArray(sc.quick_replies)
        ? sc.quick_replies
        : (sc.quick_replies ? sc.quick_replies.split('|').map(s=>s.trim()) : []),
      // CHỐT: luôn fallback chuỗi rỗng tránh null warning
      response_template: sc.response_template ?? '',
      llm_system_prompt: sc.llm_system_prompt ?? ''
    });
  }

  async function saveEdit() {
    try {
      await updateScenario(editingId, {
        ...editForm,
        quick_replies: editForm.quick_replies,
      });
      setEditingId(null);
      await loadScenarios();
    } catch (err) {
      alert('Error updating scenario');
    }
  }
  async function handleDelete(id) {
    if (window.confirm('Are you sure?')) {
      await deleteScenario(id);
      await loadScenarios();
    }
  }
  async function handleAdd() {
    try {
      await insertScenario({
        ...newScenario,
        quick_replies: newScenario.quick_replies,
      });
      setNewScenario({
        name: '',
        trigger_keywords: '',
        response_template: '',
        is_active: true,
        response_type: 'template',
        quick_replies: [],
        priority: 1,
        intent: '',
        llm_system_prompt: ''
      });
      await loadScenarios();
    } catch (err) {
      alert('Error adding scenario');
    }
  }

  return (
    <div className="p-8">
      <h2 className="text-xl mb-4">Scenarios</h2>
      {/* Add new scenario */}
      <div className="mb-6 p-3 border rounded-lg bg-white flex flex-col gap-2">
        <input value={newScenario.name ?? ''}
               onChange={e=>setNewScenario(n=>({...n,name:e.target.value}))}
               placeholder="Tên scenario" className="border p-1" />
        <input value={newScenario.trigger_keywords ?? ''}
               onChange={e=>setNewScenario(n=>({...n,trigger_keywords:e.target.value}))}
               placeholder="Trigger keywords (phân cách dấu ,)" className="border p-1" />
        <input value={newScenario.intent ?? ''}
               onChange={e=>setNewScenario(n=>({...n,intent:e.target.value}))}
               placeholder="Intent (optional)" className="border p-1" />
        <textarea value={newScenario.response_template ?? ''}
                  onChange={e=>setNewScenario(n=>({...n,response_template:e.target.value}))}
                  placeholder="Response template" className="border p-1" />
        <textarea value={newScenario.llm_system_prompt ?? ''}
                  onChange={e=>setNewScenario(n=>({...n,llm_system_prompt:e.target.value}))}
                  placeholder="LLM prompt (optional)" className="border p-1" />
        <QuickRepliesInput value={newScenario.quick_replies}
          onChange={v=>setNewScenario(n=>({...n,quick_replies:v}))} />
        <select value={newScenario.response_type ?? 'template'}
          onChange={e=>setNewScenario(n=>({...n,response_type:e.target.value}))}
          className="border p-1">
          <option value="template">Template</option>
          <option value="llm">LLM</option>
          <option value="function">Function</option>
        </select>
        <input type="number" value={newScenario.priority ?? 1}
               onChange={e=>setNewScenario(n=>({...n,priority:+e.target.value}))}
               placeholder="Priority" className="border p-1" />
        <label>
          <input type="checkbox" checked={newScenario.is_active}
                 onChange={e=>setNewScenario(n=>({...n,is_active:e.target.checked}))} />
          Active
        </label>
        <button onClick={handleAdd} className="bg-green-600 text-white rounded px-3 py-1">
          Thêm Scenario mới
        </button>
      </div>
      {/* List scenarios */}
      <table className="w-full border">
        <thead>
        <tr className="bg-gray-100 text-left text-xs">
          <th>Tên</th>
          <th>Trigger Keywords</th>
          <th>Intent</th>
          <th>Response</th>
          <th>Quick Replies</th>
          <th>Type</th>
          <th>Active</th>
          <th>Hành động</th>
        </tr>
        </thead>
        <tbody>
        {scenarios.map(sc =>
          <tr key={sc.id}>
            <td>
              {editingId===sc.id
                ? <input value={editForm.name ?? ''} onChange={e=>setEditForm(prev=>({...prev,name:e.target.value}))} className="border p-1 text-xs" />
                : sc.name}
            </td>
            <td>
              {editingId===sc.id
                ? <input value={editForm.trigger_keywords ?? ''} onChange={e=>setEditForm(prev=>({...prev,trigger_keywords:e.target.value}))} className="border p-1 text-xs" />
                : sc.trigger_keywords}
            </td>
            <td>
              {editingId===sc.id
                ? <input value={editForm.intent ?? ''} onChange={e=>setEditForm(prev=>({...prev,intent:e.target.value}))} className="border p-1 text-xs" />
                : sc.intent}
            </td>
            <td>
              {editingId===sc.id
                ? <textarea value={editForm.response_template ?? ''} onChange={e=>setEditForm(prev=>({...prev,response_template:e.target.value}))} className="border p-1 text-xs" />
                : sc.response_template}
              {editingId===sc.id
                ? <textarea value={editForm.llm_system_prompt ?? ''} onChange={e=>setEditForm(prev=>({...prev,llm_system_prompt:e.target.value}))} className="border p-1 text-xs mt-1" placeholder="LLM Prompt (optional)" />
                : (sc.llm_system_prompt && <div className="text-xs text-gray-500 mb-1">{sc.llm_system_prompt}</div>)
              }
            </td>
            <td>
              {editingId===sc.id
                ? <QuickRepliesInput value={editForm.quick_replies} onChange={arr=>setEditForm(prev=>({...prev,quick_replies:arr}))} />
                : (sc.quick_replies||[]).map((qr,i)=><span key={i} className="bg-gray-200 px-2 py-1 rounded text-xs mr-1">{qr}</span>)
              }
            </td>
            <td>
              {editingId===sc.id
                ? <select value={editForm.response_type ?? 'template'} onChange={e=>setEditForm(prev=>({...prev,response_type:e.target.value}))} className="border text-xs">
                    <option value="template">Template</option>
                    <option value="llm">LLM</option>
                    <option value="function">Function</option>
                  </select>
                : sc.response_type}
            </td>
            <td>
              {editingId===sc.id
                ? <input type="checkbox" checked={!!editForm.is_active}
                    onChange={e=>setEditForm(prev=>({...prev,is_active:e.target.checked}))} />
                : (sc.is_active ? '✔️' : '')}
            </td>
            <td>
              {editingId===sc.id
                ? <>
                    <button onClick={saveEdit} className="px-2 text-green-700">Save</button>
                    <button onClick={()=>setEditingId(null)} className="px-2 text-gray-500">Cancel</button>
                  </>
                : <>
                    <button onClick={()=>startEdit(sc)} className="px-2 text-blue-700">Edit</button>
                    <button onClick={()=>handleDelete(sc.id)} className="px-2 text-red-700">Delete</button>
                  </>
              }
            </td>
          </tr>
        )}
        </tbody>
      </table>
      <BotTrainer />
    </div>
  );
}
