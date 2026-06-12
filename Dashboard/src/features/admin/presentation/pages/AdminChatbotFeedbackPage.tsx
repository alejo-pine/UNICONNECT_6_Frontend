import { useEffect, useState } from 'react';
import { chatbotHttpService } from '../../../chatbot/infrastructure/chatbotHttpService';

export function AdminChatbotFeedbackPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
    const intervalId = setInterval(() => {
      fetchReport(false);
    }, 5000); // Refrescar cada 5 segundos para que sea reactivo al usuario
    return () => clearInterval(intervalId);
  }, []);

  const fetchReport = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await chatbotHttpService.getFeedbackReport(1, 100);
    if (res.success && res.data) {
      setData(res.data);
    }
    if (showLoading) setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['Pregunta Original', 'Pregunta Normalizada', 'Frecuencia (No útil)', 'Último Reporte'];
    const csvContent = [
      headers.join(';'),
      ...data.map((item) => {
        const originalEscaped = String(item.originalQuestion).replace(/"/g, '""');
        const normalizedEscaped = String(item.normalizedQuestion).replace(/"/g, '""');
        return `"${originalEscaped}";"${normalizedEscaped}";${item.frequency};"${new Date(item.lastReportedAt).toLocaleString()}"`;
      })
    ].join('\n');

    // \uFEFF añade el BOM (Byte Order Mark) para que Excel reconozca los acentos correctamente.
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbot_feedback_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-3xl">feedback</span>
            Feedback del Chatbot
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Reporte de preguntas que han sido marcadas como "No útiles" por los estudiantes, agrupadas por similitud.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="bg-[#00284D] hover:bg-[#001f3d] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Pregunta</th>
                <th className="px-6 py-4 text-center">Frecuencia</th>
                <th className="px-6 py-4 text-right">Último Reporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No hay reportes de feedback negativo. ¡Excelente!
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.originalQuestion}</div>
                      <div className="text-xs text-slate-400 mt-1 truncate max-w-xs">{item.normalizedQuestion}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] bg-red-50 text-red-600 font-bold px-2 py-1 rounded-lg text-xs">
                        {item.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 text-xs">
                      {new Date(item.lastReportedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
