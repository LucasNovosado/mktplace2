// src/components/dashboard/OverviewTab/TimelineChart.jsx
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';

/**
 * Componente de gráfico de linha estilizado para a visualização de evolução de vendas e leads
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.data - Dados para o gráfico
 */
const TimelineChart = ({ data }) => {
  // Calcular a média de leads e vendas para linhas de referência
  const avgLeads = data.reduce((sum, item) => sum + item.leads, 0) / data.length;
  const avgVendas = data.reduce((sum, item) => sum + item.vendas, 0) / data.length;
  
  // Personalização do tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <div className="tooltip-items">
            {payload.map((entry, index) => (
              <div 
                key={`tooltip-item-${index}`} 
                className="tooltip-item"
                style={{ color: entry.color }}
              >
                <span className="tooltip-label">{entry.name}: </span>
                <span className="tooltip-value">{entry.value}</span>
              </div>
            ))}
            {payload[0] && payload[1] && (
              <div className="tooltip-conversion">
                <span className="tooltip-label">Taxa de Conversão: </span>
                <span className="tooltip-value">
                  {(payload[1].value / payload[0].value * 100 || 0).toFixed(2)}%
                </span>
              </div>
            )}
            {payload[1] && payload[2] && (
              <div className="tooltip-bats-rate">
                <span className="tooltip-label">Taxa BATS: </span>
                <span className="tooltip-value">
                  {(payload[2].value / payload[1].value * 100 || 0).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <defs>
          {/* Gradientes para as áreas */}
          <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#1976D2" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorBats" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ED6C02" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ED6C02" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        
        <XAxis 
          dataKey="dateFormatted" 
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          tickLine={{ stroke: '#a0a0a0' }}
          axisLine={{ stroke: '#a0a0a0' }}
        />
        
        <YAxis 
          yAxisId="left"
          tick={{ fill: '#a0a0a0', fontSize: 12 }}
          tickLine={{ stroke: '#a0a0a0' }}
          axisLine={{ stroke: '#a0a0a0' }}
          label={{ 
            value: 'Quantidade', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: '#a0a0a0' }
          }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <Legend 
          verticalAlign="top" 
          wrapperStyle={{ paddingBottom: '20px' }}
          formatter={(value) => <span style={{ color: '#f0f0f0' }}>{value}</span>}
        />
        
        {/* Linha de referência para média de leads */}
        <ReferenceLine 
          y={avgLeads} 
          yAxisId="left" 
          stroke="#1976D2" 
          strokeDasharray="3 3"
          isFront={false}
        >
          <Label 
            value="Média Leads" 
            position="insideBottomRight"
            fill="#1976D2"
          />
        </ReferenceLine>
        
        {/* Linha de referência para média de vendas */}
        <ReferenceLine 
          y={avgVendas} 
          yAxisId="left" 
          stroke="#2E7D32" 
          strokeDasharray="3 3"
          isFront={false}
        >
          <Label 
            value="Média Vendas" 
            position="insideTopRight"
            fill="#2E7D32"
          />
        </ReferenceLine>
        
        <Area 
          type="monotone" 
          dataKey="leads" 
          name="Leads" 
          stroke="#1976D2" 
          fillOpacity={1}
          fill="url(#colorLeads)"
          strokeWidth={2}
          activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
          yAxisId="left"
        />
        
        <Area 
          type="monotone" 
          dataKey="vendas" 
          name="Vendas" 
          stroke="#2E7D32" 
          fillOpacity={1}
          fill="url(#colorVendas)"
          strokeWidth={2}
          activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
          yAxisId="left"
        />
        
        <Area 
          type="monotone" 
          dataKey="bats" 
          name="BATS" 
          stroke="#ED6C02" 
          fillOpacity={1}
          fill="url(#colorBats)"
          strokeWidth={2}
          activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
          yAxisId="left"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;