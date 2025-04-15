import { ReflectionTheme } from '../types/journal';

// Predefined reflection themes
export const reflectionThemes: ReflectionTheme[] = [
  {
    id: 'authentic-self',
    name: 'Authentic Self',
    description: 'Explore who you truly are beneath social expectations and conditioning.',
    icon: 'face-man-outline',
    order: 1
  },
  {
    id: 'life-purpose',
    name: 'Life Purpose',
    description: 'Reflect on your values, passions, and what gives your life meaning.',
    icon: 'compass-outline',
    order: 2
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Examine your connections with others and patterns in your interactions.',
    icon: 'account-group-outline',
    order: 3
  },
  {
    id: 'career-growth',
    name: 'Career & Growth',
    description: 'Consider your professional path, skills, and aspirations.',
    icon: 'briefcase-outline',
    order: 4
  },
  {
    id: 'emotional-patterns',
    name: 'Emotional Patterns',
    description: 'Understand your emotional responses and recurring feelings.',
    icon: 'heart-outline',
    order: 5
  },
  {
    id: 'limiting-beliefs',
    name: 'Limiting Beliefs',
    description: 'Identify and challenge thoughts that may be holding you back.',
    icon: 'lock-outline',
    order: 6
  },
  {
    id: 'health-wellbeing',
    name: 'Health & Wellbeing',
    description: 'Reflect on your physical and mental health habits and balance.',
    icon: 'yoga',
    order: 7
  },
  {
    id: 'gratitude-abundance',
    name: 'Gratitude & Abundance',
    description: 'Recognize the abundance in your life and cultivate appreciation.',
    icon: 'gift-outline',
    order: 8
  },
  {
    id: 'past-future',
    name: 'Past & Future',
    description: 'Connect your past experiences with your vision for the future.',
    icon: 'clock-time-eight-outline',
    order: 9
  },
  {
    id: 'creative-expression',
    name: 'Creative Expression',
    description: 'Explore how you express your unique voice and creativity.',
    icon: 'palette-outline',
    order: 10
  }
];

// Function to get a theme by ID
export function getThemeById(id: string): ReflectionTheme | undefined {
  return reflectionThemes.find(theme => theme.id === id);
}
