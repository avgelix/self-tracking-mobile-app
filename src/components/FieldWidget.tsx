import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Smartphone, Settings, Download } from 'lucide-react';
import { CategoryField, FieldType } from '../types';
import { useApp } from '../contexts/AppContext';

interface FieldWidgetProps {
  field: CategoryField;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onWidgetToggle?: (enabled: boolean) => void;
  className?: string;
}

export function FieldWidget({ 
  field, 
  categoryName,
  categoryIcon,
  categoryColor,
  onWidgetToggle,
  className 
}: FieldWidgetProps) {
  const { state, addWidget } = useApp();
  const [showSettings, setShowSettings] = useState(false);

  // Check if widgets are supported for this field type
  const supportsWidget = ['tally', 'number', 'boolean', 'scale', 'rating', 'choice'].includes(field.type);

  // Generate widget HTML for different field types
  const generateWidgetHTML = () => {
    const baseStyles = `
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .widget {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        max-width: 280px;
        width: 100%;
      }
      .title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #333;
      }
      .category {
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
      }
      .button {
        background: ${categoryColor || '#667eea'};
        color: white;
        border: none;
        border-radius: 12px;
        padding: 16px 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        margin: 8px 0;
        transition: all 0.2s;
      }
      .button:hover {
        opacity: 0.9;
        transform: translateY(-2px);
      }
      .button:active {
        transform: translateY(0);
      }
      .button.secondary {
        background: transparent;
        color: ${categoryColor || '#667eea'};
        border: 2px solid ${categoryColor || '#667eea'};
        font-size: 14px;
        padding: 12px 20px;
      }
      .button.secondary:hover {
        background: ${categoryColor || '#667eea'};
        color: white;
      }
      .value-display {
        font-size: 48px;
        font-weight: 700;
        color: ${categoryColor || '#667eea'};
        margin: 16px 0;
      }
      .input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 16px;
        margin: 8px 0;
      }
      .toggle {
        display: flex;
        gap: 8px;
        margin: 16px 0;
      }
      .toggle button {
        flex: 1;
        padding: 12px;
        border: 2px solid ${categoryColor || '#667eea'};
        background: transparent;
        color: ${categoryColor || '#667eea'};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .toggle button.active {
        background: ${categoryColor || '#667eea'};
        color: white;
      }
    `;

    let widgetContent = '';
    let widgetScript = '';

    switch (field.type) {
      case 'tally':
        widgetContent = `
          <div class="title">${field.name}</div>
          <div class="category">${categoryIcon} ${categoryName}</div>
          <div class="value-display" id="count">0</div>
          <button class="button" onclick="increment()">+ Add One</button>
          <button class="button secondary" onclick="openApp()">Open Full App</button>
        `;
        widgetScript = `
          let count = 0;
          
          function loadCount() {
            const saved = localStorage.getItem('field_${field.id}');
            if (saved) {
              const data = JSON.parse(saved);
              count = data.count || 0;
              document.getElementById('count').textContent = count;
            }
          }
          
          function saveCount() {
            const data = {
              count: count,
              timestamp: Date.now()
            };
            localStorage.setItem('field_${field.id}', JSON.stringify(data));
          }
          
          function increment() {
            count++;
            document.getElementById('count').textContent = count;
            saveCount();
            if (navigator.vibrate) navigator.vibrate(50);
          }
          
          function openApp() {
            window.open(window.location.origin, '_blank');
          }
          
          loadCount();
          setInterval(loadCount, 5000);
        `;
        break;

      case 'number':
        widgetContent = `
          <div class="title">${field.name}</div>
          <div class="category">${categoryIcon} ${categoryName}</div>
          <input type="number" class="input" id="numberInput" placeholder="Enter ${field.name.toLowerCase()}" ${field.min ? `min="${field.min}"` : ''} ${field.max ? `max="${field.max}"` : ''}>
          ${field.unit ? `<div style="font-size: 14px; color: #666; margin: 8px 0;">${field.unit}</div>` : ''}
          <button class="button" onclick="recordValue()">Record Value</button>
          <button class="button secondary" onclick="openApp()">Open Full App</button>
        `;
        widgetScript = `
          function recordValue() {
            const input = document.getElementById('numberInput');
            const value = parseFloat(input.value);
            if (isNaN(value)) {
              alert('Please enter a valid number');
              return;
            }
            const data = {
              value: value,
              timestamp: Date.now()
            };
            localStorage.setItem('field_${field.id}', JSON.stringify(data));
            input.value = '';
            alert('Value recorded successfully!');
            if (navigator.vibrate) navigator.vibrate(50);
          }
          
          function openApp() {
            window.open(window.location.origin, '_blank');
          }
        `;
        break;

      case 'boolean':
        widgetContent = `
          <div class="title">${field.name}</div>
          <div class="category">${categoryIcon} ${categoryName}</div>
          <div class="toggle">
            <button id="yesBtn" onclick="recordValue(true)">✓ Yes</button>
            <button id="noBtn" onclick="recordValue(false)">✗ No</button>
          </div>
          <button class="button secondary" onclick="openApp()">Open Full App</button>
        `;
        widgetScript = `
          function recordValue(value) {
            const data = {
              value: value,
              timestamp: Date.now()
            };
            localStorage.setItem('field_${field.id}', JSON.stringify(data));
            document.getElementById('yesBtn').classList.toggle('active', value);
            document.getElementById('noBtn').classList.toggle('active', !value);
            setTimeout(() => {
              document.getElementById('yesBtn').classList.remove('active');
              document.getElementById('noBtn').classList.remove('active');
            }, 1000);
            if (navigator.vibrate) navigator.vibrate(50);
          }
          
          function openApp() {
            window.open(window.location.origin, '_blank');
          }
        `;
        break;

      case 'scale':
      case 'rating':
        const min = field.min || 1;
        const max = field.max || (field.type === 'rating' ? 5 : 10);
        widgetContent = `
          <div class="title">${field.name}</div>
          <div class="category">${categoryIcon} ${categoryName}</div>
          <div class="value-display" id="currentValue">${min}</div>
          <input type="range" min="${min}" max="${max}" value="${min}" class="slider" id="scaleSlider" oninput="updateValue()" style="width: 100%; margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 16px;">
            <span>${min}</span>
            <span>${max}</span>
          </div>
          <button class="button" onclick="recordValue()">Record Rating</button>
          <button class="button secondary" onclick="openApp()">Open Full App</button>
        `;
        widgetScript = `
          let currentValue = ${min};
          
          function updateValue() {
            const slider = document.getElementById('scaleSlider');
            currentValue = parseInt(slider.value);
            document.getElementById('currentValue').textContent = currentValue;
          }
          
          function recordValue() {
            const data = {
              value: currentValue,
              timestamp: Date.now()
            };
            localStorage.setItem('field_${field.id}', JSON.stringify(data));
            alert('Rating recorded successfully!');
            if (navigator.vibrate) navigator.vibrate(50);
          }
          
          function openApp() {
            window.open(window.location.origin, '_blank');
          }
        `;
        break;

      case 'choice':
        if (!field.options || field.options.length === 0) {
          widgetContent = `
            <div class="title">${field.name}</div>
            <div class="category">${categoryIcon} ${categoryName}</div>
            <div style="color: #666; margin: 20px 0;">No options available</div>
            <button class="button secondary" onclick="openApp()">Open Full App</button>
          `;
          widgetScript = `
            function openApp() {
              window.open(window.location.origin, '_blank');
            }
          `;
        } else {
          const optionButtons = field.options.map((option, index) => 
            `<button class="button" onclick="recordValue('${option}')">${option}</button>`
          ).join('');
          
          widgetContent = `
            <div class="title">${field.name}</div>
            <div class="category">${categoryIcon} ${categoryName}</div>
            ${optionButtons}
            <button class="button secondary" onclick="openApp()">Open Full App</button>
          `;
          widgetScript = `
            function recordValue(value) {
              const data = {
                value: value,
                timestamp: Date.now()
              };
              localStorage.setItem('field_${field.id}', JSON.stringify(data));
              alert('Choice recorded: ' + value);
              if (navigator.vibrate) navigator.vibrate(50);
            }
            
            function openApp() {
              window.open(window.location.origin, '_blank');
            }
          `;
        }
        break;

      default:
        return null;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${field.name} Widget</title>
    <style>
        ${baseStyles}
    </style>
</head>
<body>
    <div class="widget">
        ${widgetContent}
    </div>
    <script>
        ${widgetScript}
    </script>
</body>
</html>`;
  };

  // Download widget
  const downloadWidget = () => {
    const html = generateWidgetHTML();
    if (!html) return;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${field.name.toLowerCase().replace(/\s+/g, '-')}-widget.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!supportsWidget) {
    return null;
  }

  return (
    <Card className={`p-3 bg-white/60 backdrop-blur-sm border-white/30 ${className}`}>
      {onWidgetToggle && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <Label htmlFor="widget-enabled" className="text-sm">
              {field.type === 'tally' && 'Add a tally counter widget'}
              {field.type === 'number' && 'Add a number input widget'}
              {field.type === 'boolean' && 'Add a yes/no toggle widget'}
              {field.type === 'scale' && 'Add a rating scale widget'}
              {field.type === 'rating' && 'Add a star rating widget'}
              {field.type === 'choice' && 'Add a quick choice widget'}
            </Label>
          </div>
          <Switch
            id="widget-enabled"
            checked={field.widgetEnabled || false}
            onCheckedChange={onWidgetToggle}
          />
        </div>
      )}
    </Card>
  );
}