export type Faction = 'Terminids' | 'Automatons' | 'Illuminate' | 'Humans';

export const factionTheme: Record<Faction, {
  bg: string;
  border: string;
  text: string;
  badge: string;
}> = {
  Terminids: {
    bg: 'bg-orange-950/40',
    border: 'border-orange-500',
    text: 'text-orange-400',
    badge: 'bg-orange-500 text-black',
  },
  Automatons: {
    bg: 'bg-red-950/40',
    border: 'border-red-500',
    text: 'text-red-400',
    badge: 'bg-red-500 text-white',
  },
  Illuminate: {
    bg: 'bg-blue-950/40',
    border: 'border-blue-500',
    text: 'text-blue-400',
    badge: 'bg-blue-500 text-white',
  },
  Humans: {
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500 text-black',
  },
};
