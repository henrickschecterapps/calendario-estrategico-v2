import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { TriplaEvent } from '@/types/evento';
import { Download, FileText, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinanceiroAnalyticsProps {
  events: TriplaEvent[];
  getEventFinancials: (evt: TriplaEvent) => any;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FinanceiroAnalytics({ events, getEventFinancials }: FinanceiroAnalyticsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { categoryData, topEventsData, monthlyData } = useMemo(() => {
    let totalBrindes = 0;
    let totalUniformes = 0;
    let totalPassagens = 0;
    let totalHospedagem = 0;
    let totalIngressos = 0;
    let totalOutros = 0;

    const eventCosts: any[] = [];
    const monthlyMap: Record<string, { month: string; gasto: number; orcamento: number }> = {};

    events.forEach(evt => {
      const fins = getEventFinancials(evt);
      
      // Categorias
      totalBrindes += fins.custo_brindes;
      totalUniformes += fins.custo_uniformes;
      totalPassagens += fins.custo_passagens;
      totalHospedagem += fins.custo_hospedagem;
      totalIngressos += fins.custo_ingressos;
      totalOutros += fins.custo_outros;

      // Ranking
      if (fins.gasto > 0) {
        eventCosts.push({
          name: evt.evento.length > 20 ? evt.evento.substring(0, 20) + '...' : evt.evento,
          gasto: fins.gasto,
        });
      }

      // Mensal
      if (evt.data_ini) {
        const date = new Date(evt.data_ini);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthLabel, gasto: 0, orcamento: 0 };
        }
        monthlyMap[monthKey].gasto += fins.gasto;
        monthlyMap[monthKey].orcamento += fins.orcamento;
      }
    });

    const catData = [
      { name: 'Brindes', value: totalBrindes },
      { name: 'Uniformes', value: totalUniformes },
      { name: 'Passagens', value: totalPassagens },
      { name: 'Hospedagem', value: totalHospedagem },
      { name: 'Ingressos', value: totalIngressos },
      { name: 'Outros', value: totalOutros },
    ].filter(item => item.value > 0);

    const topEvents = eventCosts.sort((a, b) => b.gasto - a.gasto).slice(0, 5);

    const monthData = Object.keys(monthlyMap)
      .sort()
      .map(key => monthlyMap[key]);

    return { categoryData: catData, topEventsData: topEvents, monthlyData: monthData };
  }, [events, getEventFinancials]);

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Evento', 'Data Inicio', 'Status', 'Orçamento', 'Gasto Brindes', 'Gasto Uniformes', 'Gasto Passagens', 'Gasto Hospedagem', 'Gasto Ingressos', 'Gasto Outros', 'Gasto Total', 'Saldo'];
      const rows = events.map(evt => {
        const fins = getEventFinancials(evt);
        return [
          `"${evt.evento}"`,
          evt.data_ini ? new Date(evt.data_ini).toLocaleDateString('pt-BR') : '',
          evt.status,
          fins.orcamento,
          fins.custo_brindes,
          fins.custo_uniformes,
          fins.custo_passagens,
          fins.custo_hospedagem,
          fins.custo_ingressos,
          fins.custo_outros,
          fins.gasto,
          fins.orcamento - fins.gasto
        ].join(';');
      });

      const csvContent = "\uFEFF" + [headers.join(';'), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "relatorio_financeiro.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Relatório Financeiro de Eventos', 14, 22);
      
      // Totals
      const totalOrcamento = events.reduce((acc, e) => acc + getEventFinancials(e).orcamento, 0);
      const totalGasto = events.reduce((acc, e) => acc + getEventFinancials(e).gasto, 0);
      
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 32);
      
      doc.setTextColor(0, 0, 0);
      doc.text(`Orçamento Global: R$ ${totalOrcamento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 42);
      doc.text(`Gasto Global Consolidado: R$ ${totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 48);
      
      const saldo = totalOrcamento - totalGasto;
      if (saldo >= 0) doc.setTextColor(16, 185, 129); // Green
      else doc.setTextColor(239, 68, 68); // Red
      doc.text(`Saldo Atual: R$ ${saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, 54);

      const tableColumn = ["Evento", "Status", "Data Início", "Orçamento", "Brindes", "Uniformes", "Viagens", "Hosped.", "Outros", "Gasto Total", "Saldo"];
      const tableRows: any[] = [];

      const sortedEvents = [...events].sort((a,b) => new Date(b.data_ini || 0).getTime() - new Date(a.data_ini || 0).getTime());

      sortedEvents.forEach(evt => {
        const fins = getEventFinancials(evt);
        const rowData = [
          evt.evento,
          evt.status,
          evt.data_ini ? new Date(evt.data_ini).toLocaleDateString('pt-BR') : '-',
          `R$ ${fins.orcamento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${fins.custo_brindes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${fins.custo_uniformes.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${fins.custo_passagens.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${fins.custo_hospedagem.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${(fins.custo_outros + fins.custo_ingressos).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${fins.gasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
          `R$ ${(fins.orcamento - fins.gasto).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = "relatorio_financeiro.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } finally {
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg border border-white/10 p-3 rounded-lg shadow-xl">
          <p className="text-sm font-bold text-text mb-2">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text uppercase tracking-widest">Painel Analítico</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-text rounded-lg transition-colors text-sm font-medium"
          >
            <Table className="w-4 h-4" />
            Exportar CSV
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <FileText className="w-4 h-4" />
            Relatório PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Pizza - Distribuição */}
        <div className="bg-surface/40 border border-white/5 rounded-xl p-5 flex flex-col items-center">
          <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-6 w-full text-left">Distribuição de Custos</h4>
          {categoryData.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Sem dados suficientes</div>
          )}
        </div>

        {/* Gráfico de Barras - Top Eventos */}
        <div className="bg-surface/40 border border-white/5 rounded-xl p-5 flex flex-col">
          <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-6">Top 5 Eventos Mais Caros</h4>
          {topEventsData.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEventsData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} width={100} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="gasto" name="Gasto" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Sem dados suficientes</div>
          )}
        </div>

        {/* Gráfico de Área - Linha do Tempo */}
        <div className="bg-surface/40 border border-white/5 rounded-xl p-5 flex flex-col">
          <h4 className="text-sm font-medium text-muted uppercase tracking-widest mb-6">Despesas x Orçamento ao longo do ano</h4>
          {monthlyData.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOrcamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="gasto" name="Gastos" stroke="#ef4444" fillOpacity={1} fill="url(#colorGasto)" strokeWidth={2} />
                  <Area type="monotone" dataKey="orcamento" name="Orçamento" stroke="#10b981" fillOpacity={1} fill="url(#colorOrcamento)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm">Sem dados suficientes</div>
          )}
        </div>
      </div>
    </div>
  );
}
