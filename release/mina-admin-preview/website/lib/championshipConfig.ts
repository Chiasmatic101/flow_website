// Prototype configuration. Replace with backend championship configuration before launch.
// Enrollment is server-backed. LIVE remains the campaign's visual state;
// leaderboard telemetry and standings are still synthetic preview data.
export type CompetitionId = 'sleep-streak' | 'consistency' | 'brain-games' | 'most-improved'
export const CHAMPIONSHIP_NAME = 'Flux Sleep Championship'

export type ChampionshipPrize = {
  id: string
  category: string
  name: string
  competitionId?: CompetitionId
  imageSrc?: string
  imageAlt?: string
  valueLabel?: string
  sponsor?: string
}

export const activeChampionship = {
  id: '2026-10',
  name: 'October Sleep Championship',
  month: 'October',
  year: 2026,
  status: 'LIVE',
  prize: 'Prize announcement coming soon',
  prizes: [
    { id: 'grand', category: 'Grand Prize', name: 'To be announced' },
    { id: 'streak', category: 'Sleep Streak Winner', name: 'Prize to be announced', competitionId: 'sleep-streak' },
    { id: 'consistency', category: 'Consistency Champion', name: 'Prize to be announced', competitionId: 'consistency' },
    { id: 'games', category: 'Brain Game Champion', name: 'Prize to be announced', competitionId: 'brain-games' },
    { id: 'improved', category: 'Most Improved', name: 'Prize to be announced', competitionId: 'most-improved' },
  ] satisfies ChampionshipPrize[],
}

export const competitions: {
  id: CompetitionId; icon: string; name: string; tabLabel: string
  headline: string; description: string; details: string; metric: string; previewCaption: string
}[] = [
  {
    id: 'sleep-streak', icon: '🔥', name: 'Sleep Streak', tabLabel: 'Sleep Streak',
    headline: 'Build your streak.',
    description: 'Hit your personal sleep-duration goal on as many qualifying nights as possible during the current Championship.',
    metric: 'Qualifying Nights', previewCaption: 'Qualifying nights this month',
    details: 'Each qualifying night counts toward your rank in the current Championship. Nights do not need to be consecutive. Qualification rules for your personal sleep-duration goal will be published before launch.',
  },
  {
    id: 'consistency', icon: '⏰', name: 'Consistency Champion', tabLabel: 'Consistency',
    headline: 'Become a more consistent sleeper.',
    description: 'Improve the consistency of your sleep schedule compared with your personal baseline.',
    metric: 'Consistency Improvement', previewCaption: 'Change against your own baseline',
    details: 'Your starting baseline is your benchmark. You can compete by building consistency, even if your schedule starts out irregular. Scoring rules will be published before launch. The percentages shown are synthetic demo values.',
  },
  {
    id: 'brain-games', icon: '🧠', name: 'Brain Game Champion', tabLabel: 'Brain Games',
    headline: 'Top the brain-game leaderboard.',
    description: 'Compete for the highest daily scores in individual Flux cognitive games.',
    metric: 'High Score', previewCaption: "Today's high scores · Separate games",
    details: 'Each game has its own daily high score. Compare scores within the same game. Today is the current preview; This Month and All Time views are coming later.',
  },
  {
    id: 'most-improved', icon: '📈', name: 'Most Improved Brain', tabLabel: 'Most Improved',
    headline: 'How much can you improve?',
    description: 'Improve your cognitive-game performance compared with your own starting baseline.',
    metric: 'Performance Improvement', previewCaption: 'Your starting point is your benchmark',
    details: 'You do not need to start as the best performer to compete for improvement. Compare your game performance with your own starting baseline. Scoring rules will be published before launch. A change in game score is not a claim of improved cognition, sleep or grades.',
  },
]
