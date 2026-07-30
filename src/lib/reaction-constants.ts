import { ThumbsUp, Heart, Laugh, AlertCircle, Frown, Angry } from "lucide-react";

export const REACTION_TYPES = [
  { id: 'like', label: "J'aime", icon: ThumbsUp },
  { id: 'love', label: 'Adore', icon: Heart },
  { id: 'haha', label: 'Haha', icon: Laugh },
  { id: 'wow', label: 'Waouh', icon: AlertCircle },
  { id: 'sad', label: 'Triste', icon: Frown },
  { id: 'angry', label: 'Grrr', icon: Angry },
] as const;

export type ReactionType = typeof REACTION_TYPES[number]['id'];
