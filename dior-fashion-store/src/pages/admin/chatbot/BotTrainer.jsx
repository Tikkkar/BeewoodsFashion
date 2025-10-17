import React, { useState } from 'react';
import { invokeChatbotProcess } from '../../../lib/api/chatbot'; // Hàm gọi edge function chatbot-process

export default function BotTrainer() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [scenarioId, setScenarioId] = useState(null); // optional, nếu muốn test từng scenario

  async function handleTestBot(e) {
    e.preventDefault();
    setLoading(true); setResponse('');
    try {
      // Nếu có param scenarioId, gửi lên cùng request (backend xử lý ưu tiên scenario này)
      const { data, error } = await invokeChatbotProcess({
        platform: 'website',
        session_id: 'admin_train', // hoặc random/gen duy nhất cho mỗi test
        message_text: question,
        scenario_id: scenarioId // truyền nếu muốn
      });
      if (error) throw error;
      setResponse(data?.response || JSON.stringify(data));
    } catch (err) {
      setResponse('Error: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 p-4 border rounded-lg bg-white max-w-xl">
      <h3 className="font-bold mb-2">Test / Training Bot</h3>
      <form onSubmit={handleTestBot}>
        <div className="flex mb-2 gap-2">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Nhập câu test cho bot..."
            disabled={loading}
          />
          <button type="submit" disabled={loading || !question.trim()}
                  className="px-5 py-2 bg-black text-white rounded hover:bg-gray-800">Test</button>
        </div>
      </form>
      {/* Nếu cho chọn scenario thì thêm dropdown để chọn */}
      {/* <select value={scenarioId} onChange={e=>setScenarioId(e.target.value)}>
        <option value="">Auto detect scenario</option>
        {scenarios.map(sc=>
            <option value={sc.id}>{sc.name}</option>
        )}
      </select> */}
      <div className="mt-3">
        <span className="font-semibold">Bot response:</span>
        <div className="bg-gray-50 border p-3 rounded mt-2 min-h-[60px]">
          {loading ? 'Đang phân tích...' : response}
        </div>
      </div>
    </div>
  );
}
