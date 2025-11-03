import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Plus } from 'lucide-react';
import { ProjectField } from '../types';

export function Charts() {
  const { state } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(state.projects[0]?.id || '');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const selectedProject = state.projects.find(proj => proj.id === selectedProjectId);
  
  // Get numeric/visualizable fields from the selected project
  const visualizableFields = selectedProject?.fields.filter(field => 
    ['number', 'scale', 'rating', 'boolean', 'duration'].includes(field.type)
  ) || [];

  // Set initial field if not set
  if (selectedFieldId === '' && visualizableFields.length > 0) {
    setSelectedFieldId(visualizableFields[0].id);
  }

  const selectedField = visualizableFields.find(field => field.id === selectedFieldId);

  // Filter entries by selected project and time range
  const getFilteredEntries = () => {
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return state.entries
      .filter(entry => 
        entry.projectId === selectedProjectId && 
        new Date(entry.date) >= startDate
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Extract field value from entry
  const getFieldValue = (entry: typeof state.entries[0], fieldId: string) => {
    const entryValue = entry.values.find(v => v.fieldId === fieldId);
    return entryValue?.value;
  };

  // Prepare chart data
  const getChartData = () => {
    if (!selectedField) return [];
    
    const filteredEntries = getFilteredEntries();
    
    // Group by date
    const groupedByDate = filteredEntries.reduce((acc, entry) => {
      const dateKey = new Date(entry.date).toLocaleDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, typeof filteredEntries>);

    // Calculate daily averages/totals
    return Object.entries(groupedByDate).map(([date, entries]) => {
      const fieldValues = entries
        .map(e => getFieldValue(e, selectedField.id))
        .filter(v => v !== undefined && v !== null);
      
      let value = 0;
      if (selectedField.type === 'boolean') {
        value = fieldValues.filter(v => v === true).length;
      } else {
        const numericValues = fieldValues.filter(v => typeof v === 'number') as number[];
        if (numericValues.length > 0) {
          value = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
        }
      }

      return {
        date,
        value: Math.round(value * 100) / 100,
        count: entries.length
      };
    });
  };

  // Calculate statistics
  const getStats = () => {
    if (!selectedField) return null;
    
    const filteredEntries = getFilteredEntries();
    if (filteredEntries.length === 0) return null;

    const fieldValues = filteredEntries
      .map(e => getFieldValue(e, selectedField.id))
      .filter(v => v !== undefined && v !== null);

    if (fieldValues.length === 0) return null;
    
    if (selectedField.type === 'boolean') {
      const trueCount = fieldValues.filter(v => v === true).length;
      return {
        average: Math.round((trueCount / fieldValues.length) * 100),
        total: trueCount,
        trend: trueCount > fieldValues.length / 2 ? 'up' : 'down'
      };
    }

    const numericValues = fieldValues.filter(v => typeof v === 'number') as number[];
    if (numericValues.length === 0) return null;

    const average = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    const total = numericValues.reduce((sum, val) => sum + val, 0);
    
    // Simple trend calculation (compare first half vs second half)
    const midPoint = Math.floor(numericValues.length / 2);
    const firstHalf = numericValues.slice(0, midPoint);
    const secondHalf = numericValues.slice(midPoint);
    
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length : 0;
    
    return {
      average: Math.round(average * 100) / 100,
      total: Math.round(total * 100) / 100,
      trend: secondAvg > firstAvg ? 'up' : 'down'
    };
  };

  const chartData = getChartData();
  const stats = getStats();

  const formatValue = (value: number) => {
    if (!selectedField) return value.toString();
    
    if (selectedField.type === 'boolean') {
      return `${value}%`;
    }
    if (selectedField.unit) {
      return `${value} ${selectedField.unit}`;
    }
    return value.toString();
  };

  if (state.projects.length === 0) {
    return (
      <div className="pb-[112px] space-y-6 pt-[28px] pr-[14px] pl-[14px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-medium mb-2">Analytics</h1>
          <p className="text-muted-foreground">Visualize your progress</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <Card 
            className="p-8 bg-white/60 backdrop-blur-sm border-white/30 cursor-pointer hover:bg-white/70 transition-colors text-center"
            onClick={() => {
              const event = new CustomEvent('navigateToTab', { detail: { tab: 'projects' } });
              window.dispatchEvent(event);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const event = new CustomEvent('navigateToTab', { detail: { tab: 'projects' } });
                window.dispatchEvent(event);
              }
            }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-full text-blue-500 shadow-[0_4px_16px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] transition-shadow">
              <Plus className="w-8 h-8" />
            </div>
            <h2 className="mb-1">No Projects Yet</h2>
            <p className="text-muted-foreground">Create some projects to start visualizing your data.</p>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (visualizableFields.length === 0) {
    return (
      <div className="pb-[112px] space-y-6 pt-[28px] pr-[14px] pl-[14px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-medium mb-2">Analytics</h1>
          <p className="text-muted-foreground">Visualize your progress</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <Card className="p-8 bg-white/60 backdrop-blur-sm border-white/30">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="mb-2">No Numeric Fields</h2>
            <p className="text-muted-foreground">
              Add numeric, scale, rating, or boolean fields to your project to visualize data.
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-[112px] space-y-6 pt-[28px] pr-[14px] pl-[14px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-2xl font-medium mb-2">Analytics</h1>
        <p className="text-muted-foreground">Visualize your progress</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select value={selectedProjectId} onValueChange={(value) => {
              setSelectedProjectId(value);
              setSelectedFieldId(''); // Reset field selection
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {state.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <span>{project.icon}</span>
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Field selector */}
        {visualizableFields.length > 1 && (
          <div>
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {visualizableFields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} {field.unit && `(${field.unit})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card className="p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/50 border-blue-200/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600">Average</div>
                <div className="text-xl text-blue-700">
                  {formatValue(stats.average)}
                </div>
              </div>
              {stats.trend === 'up' ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50/50 to-purple-100/50 border-purple-200/30 backdrop-blur-sm">
            <div>
              <div className="text-sm text-purple-600">
                {selectedField?.type === 'boolean' ? 'True Count' : 'Total'}
              </div>
              <div className="text-xl text-purple-700">
                {selectedField?.type === 'boolean' ? stats.total : formatValue(stats.total)}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Chart */}
      <div>
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/30">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {selectedProject && (
              <>
                <span className="text-lg">{selectedProject.icon}</span>
                <h3>{selectedProject.name}</h3>
                {selectedField && (
                  <Badge variant="secondary">{selectedField.name}</Badge>
                )}
                <Badge variant="secondary">{timeRange}</Badge>
              </>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No data for selected period</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={selectedProject?.color || '#3b82f6'}
                    strokeWidth={2}
                    dot={{ fill: selectedProject?.color || '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Entry Count Chart */}
      {chartData.length > 0 && (
        <div>
          <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/30">
            <h3 className="mb-4">Daily Entry Count</h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Bar 
                    dataKey="count" 
                    fill={selectedProject?.color || '#3b82f6'}
                    opacity={0.7}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
