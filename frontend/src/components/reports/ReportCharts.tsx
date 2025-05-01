import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface ChartProps {
  title?: string;
  type: 'line' | 'bar' | 'pie' | 'scatter';
  data: Array<Record<string, any>>;
  height?: number;
  xKey?: string;
  yKey?: string;
  dataKey?: string;
  colors?: string[];
}

interface StatItemProps {
  title: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  percent?: boolean;
}

export const StatRow: React.FC<{ stats: StatItemProps[] }> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                    {stat.percent ? `${stat.value}%` : stat.value}
                  </Typography>
                  {stat.subtitle && (
                    <Typography variant="body2" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  )}
                </Box>
                {stat.icon && (
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: '50%', 
                      bgcolor: stat.color ? `${stat.color}20` : 'primary.light',
                      color: stat.color || 'primary.main'
                    }}
                  >
                    {stat.icon}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const ReportCharts: React.FC<ChartProps> = ({ 
  title, 
  type, 
  data, 
  height = 400, 
  xKey = 'name', 
  yKey = 'value',
  dataKey = 'value',
  colors = COLORS
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={colors[0]} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey || yKey} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey={dataKey}
                nameKey={xKey}
                label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey={xKey} 
                name="Attendance" 
                unit="%" 
                domain={[0, 100]} 
              />
              <YAxis 
                type="number" 
                dataKey={yKey} 
                name="Marks" 
                unit="%" 
                domain={[0, 100]} 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                formatter={(value: any, name: string) => [`${value}%`, name]}
                labelFormatter={(value: number) => data[value]?.name || ''}
              />
              <Scatter 
                name="Students" 
                data={data} 
                fill={colors[0]} 
              />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        );
      
      default:
        return <Typography>Chart type not supported</Typography>;
    }
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ReportCharts; 