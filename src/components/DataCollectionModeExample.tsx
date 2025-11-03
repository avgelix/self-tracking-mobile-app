import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Calendar, Clock, MapPin, Mail, Phone, Link, Palette, Upload, Navigation, Hash } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { FieldType } from '../types';

interface DataCollectionModeExampleProps {
  fieldType: FieldType;
  onClose: () => void;
}

const fieldExamples = {
  text: {
    icon: <span className="w-4 h-4 text-muted-foreground">Aa</span>,
    title: 'Text Input Example',
    description: 'Capture short text entries like names, titles, or brief descriptions',
    example: (
      <div className="space-y-2">
        <Input placeholder="Enter workout name" value="Morning Jog" readOnly />
        <div className="text-xs text-muted-foreground">Example: "Morning Jog", "Team Meeting", "Book Title"</div>
      </div>
    )
  },
  number: {
    icon: <span className="w-4 h-4 text-muted-foreground font-mono">123</span>,
    title: 'Number Input Example',
    description: 'Track numeric values like weights, distances, or quantities',
    example: (
      <div className="space-y-2">
        <Input type="number" placeholder="Enter weight" value="75.5" readOnly />
        <div className="text-xs text-muted-foreground">Unit: kg</div>
        <div className="text-xs text-muted-foreground">Example: 75.5 kg, 10 km, 250 ml</div>
      </div>
    )
  },
  boolean: {
    icon: <span className="w-4 h-4 text-muted-foreground">✓</span>,
    title: 'Yes/No Toggle Example',
    description: 'Track binary states like completed tasks or true/false questions',
    example: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Switch checked={true} disabled />
          <span className="text-sm">Completed workout today</span>
        </div>
        <div className="text-xs text-muted-foreground">Example: Yes/No, True/False, Done/Not Done</div>
      </div>
    )
  },
  scale: {
    icon: <span className="w-4 h-4 text-muted-foreground">—●—</span>,
    title: 'Scale Rating Example',
    description: 'Rate experiences on a numeric scale (1-10, 1-5, etc.)',
    example: (
      <div className="space-y-3">
        <Slider value={[7]} min={1} max={10} disabled className="w-full" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span className="font-medium text-primary">7</span>
          <span>10</span>
        </div>
        <div className="text-xs text-muted-foreground">Example: Mood (1-10), Pain level (1-5), Satisfaction rating</div>
      </div>
    )
  },
  spectrum: {
    icon: <span className="w-4 h-4 text-muted-foreground">◄─●─►</span>,
    title: 'Spectrum Scale Example',
    description: 'Custom labeled scale with endpoints and optional midpoints',
    example: (
      <div className="space-y-4">
        <Slider value={[65]} min={0} max={100} disabled className="w-full" />
        <div className="relative h-12 px-2">
          <div className="absolute left-0 text-left" style={{ maxWidth: '30%' }}>
            <div className="text-xs text-muted-foreground">Not at all</div>
            <div className="text-xs text-muted-foreground mt-0.5">0</div>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-xs text-muted-foreground whitespace-nowrap">Moderate</div>
            <div className="text-xs text-muted-foreground mt-0.5">50</div>
          </div>
          <div className="absolute right-0 text-right" style={{ maxWidth: '30%' }}>
            <div className="text-xs text-muted-foreground">Extremely</div>
            <div className="text-xs text-muted-foreground mt-0.5">100</div>
          </div>
        </div>
        <div className="text-center">
          <span className="font-medium text-primary">65</span>
          <span className="text-xs text-muted-foreground ml-1">intensity</span>
        </div>
        <div className="text-xs text-muted-foreground">Example: Pain intensity, Confidence level, Energy</div>
      </div>
    )
  },
  choice: {
    icon: <span className="w-4 h-4 text-muted-foreground">◯</span>,
    title: 'Single Choice Example',
    description: 'Select one option from a predefined list',
    example: (
      <div className="space-y-2">
        <div className="space-y-1">
          <Badge variant="default" className="text-xs">Running</Badge>
          <Badge variant="outline" className="text-xs">Swimming</Badge>
          <Badge variant="outline" className="text-xs">Cycling</Badge>
        </div>
        <div className="text-xs text-muted-foreground">Example: Exercise type, Meal category, Weather condition</div>
      </div>
    )
  },
  multi_choice: {
    icon: <span className="w-4 h-4 text-muted-foreground">☑</span>,
    title: 'Multiple Choice Example',
    description: 'Select multiple options from a list',
    example: (
      <div className="space-y-2">
        <div className="space-y-1">
          <Badge variant="default" className="text-xs">Protein</Badge>
          <Badge variant="default" className="text-xs">Vegetables</Badge>
          <Badge variant="outline" className="text-xs">Grains</Badge>
          <Badge variant="outline" className="text-xs">Dairy</Badge>
        </div>
        <div className="text-xs text-muted-foreground">Example: Food groups, Symptoms, Activities</div>
      </div>
    )
  },
  rating: {
    icon: <Star className="w-4 h-4 text-muted-foreground" />,
    title: 'Star Rating Example',
    description: 'Rate items using a 5-star system',
    example: (
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((star) => (
            <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
          ))}
          <Star className="w-5 h-5 text-gray-300" />
          <span className="ml-2 text-sm text-muted-foreground">4/5 stars</span>
        </div>
        <div className="text-xs text-muted-foreground">Example: Movie rating, Restaurant quality, Book review</div>
      </div>
    )
  },
  date: {
    icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
    title: 'Date Picker Example',
    description: 'Select specific dates for events or milestones',
    example: (
      <div className="space-y-2">
        <Input type="date" value="2024-01-15" readOnly />
        <div className="text-xs text-muted-foreground">Example: Birthday, Appointment date, Deadline</div>
      </div>
    )
  },
  time: {
    icon: <Clock className="w-4 h-4 text-muted-foreground" />,
    title: 'Time Picker Example',
    description: 'Record specific times for activities',
    example: (
      <div className="space-y-2">
        <Input type="time" value="14:30" readOnly />
        <div className="text-xs text-muted-foreground">Example: Wake up time, Meeting time, Medication schedule</div>
      </div>
    )
  },
  datetime: {
    icon: <Clock className="w-4 h-4 text-muted-foreground" />,
    title: 'Date & Time Example',
    description: 'Capture both date and time together',
    example: (
      <div className="space-y-2">
        <Input type="datetime-local" value="2024-01-15T14:30" readOnly />
        <div className="text-xs text-muted-foreground">Example: Event timestamp, Lab test time, Photo taken</div>
      </div>
    )
  },
  duration: {
    icon: <Clock className="w-4 h-4 text-muted-foreground" />,
    title: 'Duration Example',
    description: 'Track time spent on activities',
    example: (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Hours</div>
            <Input type="number" value="1" readOnly />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Minutes</div>
            <Input type="number" value="30" readOnly />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Example: Workout duration, Study time, Sleep hours</div>
      </div>
    )
  },
  email: {
    icon: <Mail className="w-4 h-4 text-muted-foreground" />,
    title: 'Email Input Example',
    description: 'Capture email addresses with validation',
    example: (
      <div className="space-y-2">
        <Input type="email" placeholder="example@email.com" value="john@example.com" readOnly />
        <div className="text-xs text-muted-foreground">Example: Contact email, Support email, Newsletter subscription</div>
      </div>
    )
  },
  phone: {
    icon: <Phone className="w-4 h-4 text-muted-foreground" />,
    title: 'Phone Number Example',
    description: 'Record phone numbers with proper formatting',
    example: (
      <div className="space-y-2">
        <Input type="tel" placeholder="+1 (555) 123-4567" value="+1 (555) 123-4567" readOnly />
        <div className="text-xs text-muted-foreground">Example: Emergency contact, Doctor's office, Service provider</div>
      </div>
    )
  },
  url: {
    icon: <Link className="w-4 h-4 text-muted-foreground" />,
    title: 'URL Input Example',
    description: 'Store website links and resources',
    example: (
      <div className="space-y-2">
        <Input type="url" placeholder="https://example.com" value="https://example.com" readOnly />
        <div className="text-xs text-muted-foreground">Example: Article link, Video URL, Resource website</div>
      </div>
    )
  },
  location: {
    icon: <MapPin className="w-4 h-4 text-muted-foreground" />,
    title: 'Location Example',
    description: 'Record addresses or GPS coordinates',
    example: (
      <div className="space-y-2">
        <Input value="123 Main St, New York, NY 10001" readOnly />
        <div className="text-xs text-muted-foreground">Example: Gym location, Restaurant address, Travel destination</div>
      </div>
    )
  },
  color: {
    icon: <Palette className="w-4 h-4 text-muted-foreground" />,
    title: 'Color Picker Example',
    description: 'Select and store color values',
    example: (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border bg-blue-500"></div>
          <Input value="#3B82F6" readOnly className="flex-1" />
        </div>
        <div className="text-xs text-muted-foreground">Example: Mood color, Favorite color, Theme selection</div>
      </div>
    )
  },
  file: {
    icon: <Upload className="w-4 h-4 text-muted-foreground" />,
    title: 'File Upload Example',
    description: 'Attach files, images, or documents',
    example: (
      <div className="space-y-2">
        <div className="p-3 border rounded bg-muted/30">
          <div className="text-sm">progress_photo.jpg</div>
          <div className="text-xs text-muted-foreground">2.3 MB</div>
        </div>
        <div className="text-xs text-muted-foreground">Example: Progress photos, Medical documents, Receipts</div>
      </div>
    )
  },
  path: {
    icon: <Navigation className="w-4 h-4 text-muted-foreground" />,
    title: 'Path Recording Example',
    description: 'Track GPS routes like fitness activities',
    example: (
      <div className="space-y-2">
        <div className="p-3 border rounded bg-muted/30">
          <div className="text-sm">Running Route</div>
          <div className="text-xs text-muted-foreground">Distance: 5.2 km • Duration: 28:45</div>
          <div className="text-xs text-muted-foreground">142 GPS points recorded</div>
        </div>
        <div className="text-xs text-muted-foreground">Example: Running routes, Hiking trails, Bike rides</div>
      </div>
    )
  },
  tally: {
    icon: <Hash className="w-4 h-4 text-muted-foreground" />,
    title: 'Tally Counter Example',
    description: 'Count occurrences with increment buttons',
    example: (
      <div className="space-y-2">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">23</div>
          <div className="text-sm text-muted-foreground">Water glasses today</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="flex-1">-</Button>
          <Button size="sm" disabled className="flex-1">+</Button>
        </div>
        <div className="text-xs text-muted-foreground">Example: Water intake, Push-ups, Customer visits</div>
      </div>
    )
  }
};

export function DataCollectionModeExample({ fieldType, onClose }: DataCollectionModeExampleProps) {
  const example = fieldExamples[fieldType];
  
  if (!example) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <Card className="bg-gray-50 border-gray-200 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 left-2 h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="p-4 pl-10">
            <div className="flex items-end gap-2 mb-3">
              {example.icon}
              <h3 className="font-medium text-sm">{example.title}</h3>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              {example.description}
            </p>
            
            <div className="bg-white rounded-lg p-3 border">
              {example.example}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}