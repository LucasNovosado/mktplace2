import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SellersChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="leads" name="Leads" fill="#1976D2" />
        <Bar dataKey="vendas" name="Vendas" fill="#2E7D32" />
        <Bar dataKey="bats" name="BATS" fill="#ED6C02" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SellersChart;