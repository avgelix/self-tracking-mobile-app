import { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from './ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  FileText, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { format } from '../utils/dateHelpers';

export function DataManagement() {
  const { state, dispatch } = useApp();
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'all' | string>('all');
  const [resetScope, setResetScope] = useState<'all' | string>('all');

  // Export data as JSON (existing functionality)
  const exportDataJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tracking-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported as JSON successfully!');
  };

  // Export data as CSV
  const exportDataCSV = () => {
    let entries = state.entries;
    let filename = 'all-data';

    // Filter by project if specific project selected
    if (exportScope !== 'all') {
      entries = entries.filter(e => e.projectId === exportScope);
      const project = state.projects.find(p => p.id === exportScope);
      filename = project ? `${project.name}-data` : 'project-data';
    }

    if (entries.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Build CSV header
    const headers = ['Date', 'Project', 'Note'];
    const fieldNames = new Set<string>();
    
    entries.forEach(entry => {
      const project = state.projects.find(p => p.id === entry.projectId);
      if (project) {
        project.fields.forEach(field => {
          fieldNames.add(field.name);
        });
      }
    });

    headers.push(...Array.from(fieldNames));

    // Build CSV rows
    const rows = entries.map(entry => {
      const project = state.projects.find(p => p.id === entry.projectId);
      const row: any = {
        Date: format(new Date(entry.date), 'yyyy-MM-dd HH:mm:ss'),
        Project: project?.name || 'Unknown',
        Note: entry.note || ''
      };

      // Add field values
      entry.values.forEach(value => {
        const field = project?.fields.find(f => f.id === value.fieldId);
        if (field) {
          let displayValue = value.value;
          
          // Format based on field type
          if (field.type === 'boolean') {
            displayValue = value.value ? 'Yes' : 'No';
          } else if (field.type === 'date') {
            displayValue = format(new Date(value.value), 'yyyy-MM-dd');
          } else if (field.type === 'datetime') {
            displayValue = format(new Date(value.value), 'yyyy-MM-dd HH:mm:ss');
          } else if (field.type === 'time') {
            displayValue = value.value;
          } else if (field.type === 'multi_choice' && Array.isArray(value.value)) {
            displayValue = value.value.join(', ');
          } else if (field.type === 'location' && typeof value.value === 'object') {
            displayValue = `${value.value.latitude}, ${value.value.longitude}`;
          } else if (field.type === 'path' && Array.isArray(value.value)) {
            displayValue = `Path with ${value.value.length} points`;
          }

          row[field.name] = displayValue;
        }
      });

      return row;
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported as CSV successfully!');
  };

  // Export data as PDF
  const exportDataPDF = () => {
    let entries = state.entries;
    let filename = 'all-data';

    // Filter by project if specific project selected
    if (exportScope !== 'all') {
      entries = entries.filter(e => e.projectId === exportScope);
      const project = state.projects.find(p => p.id === exportScope);
      filename = project ? `${project.name}-data` : 'project-data';
    }

    if (entries.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create a simple HTML document for PDF conversion
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Data Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #6366f1; }
          .entry { 
            margin: 20px 0; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px;
            break-inside: avoid;
          }
          .entry-header { 
            font-weight: bold; 
            margin-bottom: 10px; 
            color: #1f2937;
            font-size: 16px;
          }
          .field { 
            margin: 5px 0; 
            padding-left: 15px;
          }
          .field-name { 
            font-weight: 600; 
            color: #4b5563;
          }
          .note { 
            margin-top: 10px; 
            padding: 10px; 
            background: #f3f4f6; 
            border-radius: 4px;
            font-style: italic;
          }
          @media print {
            .entry { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Data Export - ${exportScope === 'all' ? 'All Projects' : state.projects.find(p => p.id === exportScope)?.name || 'Project'}</h1>
        <p>Exported on: ${format(new Date(), 'MMMM d, yyyy')}</p>
        <p>Total entries: ${entries.length}</p>
        <hr>
    `;

    entries.forEach(entry => {
      const project = state.projects.find(p => p.id === entry.projectId);
      htmlContent += `
        <div class="entry">
          <div class="entry-header">
            ${format(new Date(entry.date), 'EEEE, MMMM d, yyyy - HH:mm')}
            ${project ? ` | ${project.name}` : ''}
          </div>
      `;

      entry.values.forEach(value => {
        const field = project?.fields.find(f => f.id === value.fieldId);
        if (field) {
          let displayValue = value.value;
          
          // Format based on field type
          if (field.type === 'boolean') {
            displayValue = value.value ? 'Yes' : 'No';
          } else if (field.type === 'date') {
            displayValue = format(new Date(value.value), 'MMMM d, yyyy');
          } else if (field.type === 'datetime') {
            displayValue = format(new Date(value.value), 'MMMM d, yyyy - HH:mm');
          } else if (field.type === 'multi_choice' && Array.isArray(value.value)) {
            displayValue = value.value.join(', ');
          } else if (field.type === 'location' && typeof value.value === 'object') {
            displayValue = `Lat: ${value.value.latitude}, Lng: ${value.value.longitude}`;
          } else if (field.type === 'path' && Array.isArray(value.value)) {
            displayValue = `Path with ${value.value.length} coordinates`;
          }

          htmlContent += `
            <div class="field">
              <span class="field-name">${field.name}:</span> ${displayValue}${field.unit ? ' ' + field.unit : ''}
            </div>
          `;
        }
      });

      if (entry.note) {
        htmlContent += `<div class="note">Note: ${entry.note}</div>`;
      }

      htmlContent += `</div>`;
    });

    htmlContent += `
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
      toast.success('PDF preview opened - use your browser\'s print dialog to save as PDF');
    } else {
      toast.error('Please allow popups to export as PDF');
    }
  };

  // Handle export
  const handleExport = () => {
    if (exportFormat === 'json') {
      exportDataJSON();
    } else if (exportFormat === 'csv') {
      exportDataCSV();
    } else if (exportFormat === 'pdf') {
      exportDataPDF();
    }
  };

  // Delete all profile data
  const deleteAllData = () => {
    dispatch({ 
      type: 'LOAD_DATA', 
      payload: {
        projects: [],
        entries: [],
        reminders: [],
        widgets: [],
        pendingNotifications: [],
        activePaths: []
      }
    });
    toast.success('All data deleted successfully');
  };

  // Reset onboarding (for testing)
  const resetOnboarding = () => {
    dispatch({ 
      type: 'LOAD_DATA', 
      payload: {
        ...state,
        userProfile: undefined
      }
    });
    toast.success('Onboarding reset - refresh the page to see onboarding again');
  };

  // Reset project(s) - keep project but delete all entries
  const resetProjects = () => {
    if (resetScope === 'all') {
      // Delete all entries but keep projects
      const updatedState = {
        ...state,
        entries: []
      };
      dispatch({ type: 'LOAD_DATA', payload: updatedState });
      toast.success('All project entries have been deleted');
    } else {
      // Delete entries for specific project
      const updatedState = {
        ...state,
        entries: state.entries.filter(e => e.projectId !== resetScope)
      };
      dispatch({ type: 'LOAD_DATA', payload: updatedState });
      const project = state.projects.find(p => p.id === resetScope);
      toast.success(`Entries for "${project?.name}" have been deleted`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Data Section */}
      <Card className="bg-white/60 backdrop-blur-sm border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV (Spreadsheet)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (Document)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON (Raw Data)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Scope</label>
            <Select value={exportScope} onValueChange={setExportScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {state.projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} className="w-full gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </Button>

          {state.entries.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              {exportScope === 'all' 
                ? `${state.entries.length} total entries` 
                : `${state.entries.filter(e => e.projectId === exportScope).length} entries`
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Projects Section */}
      <Card className="bg-white/60 backdrop-blur-sm border-white/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Reset Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete all entries for a project while keeping the project structure
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            <Select value={resetScope} onValueChange={setResetScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {state.projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                      <Badge variant="secondary" className="ml-2">
                        {state.entries.filter(e => e.projectId === project.id).length} entries
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset {resetScope === 'all' ? 'All Projects' : 'Project'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Confirm Reset
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {resetScope === 'all' 
                    ? 'This will delete all entries for all projects. Your projects and their structures will be preserved, but all entry data will be permanently deleted.'
                    : `This will delete all entries for "${state.projects.find(p => p.id === resetScope)?.name}". The project structure will be preserved, but all entry data will be permanently deleted.`
                  }
                  <br /><br />
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetProjects} className="bg-orange-500 hover:bg-orange-600">
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Test Section - Reset Onboarding */}
      <Card className="bg-blue-50/60 backdrop-blur-sm border-blue-200/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <RefreshCw className="w-5 h-5" />
            Test: Reset Onboarding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-blue-700">
            Reset your user profile to test the onboarding flow and "Welcome" vs "Welcome back" messages. Your projects and entries will be preserved.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-100">
                <RefreshCw className="w-4 h-4" />
                Reset Onboarding
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                  Reset Onboarding?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset your user profile and you'll need to complete onboarding again when you refresh the page. Your projects and entries will be preserved.
                  <br /><br />
                  This is useful for testing the first-time user experience.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetOnboarding} className="bg-blue-600 hover:bg-blue-700">
                  Reset Onboarding
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Delete All Data Section */}
      <Card className="bg-red-50/60 backdrop-blur-sm border-red-200/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-700">
            Permanently delete all your data including projects, entries, reminders, and widgets.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2">
                <Trash2 className="w-4 h-4" />
                Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Delete All Data?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>{state.projects.length} projects</li>
                    <li>{state.entries.length} entries</li>
                    <li>{state.reminders.length} reminders</li>
                    <li>{state.widgets.length} widgets</li>
                  </ul>
                  <br />
                  <strong>This action cannot be undone.</strong> Consider exporting your data first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllData} className="bg-red-600 hover:bg-red-700">
                  Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
