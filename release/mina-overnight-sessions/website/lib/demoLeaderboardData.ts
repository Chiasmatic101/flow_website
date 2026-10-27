// Prototype data only. Replace with Firestore leaderboard data before public experiment launch.
// All handles, ranks and values below are synthetic examples, not actual Flux users or results.
// Sleep qualification, baseline comparison and normalization are intentionally not implemented here.
// Values illustrate a monthly cycle; they are not measurements for today's date or personal results.

export const demoSleepStreak = [
  { rank: 1, username: 'sleepNinja', nights: 18 },
  { rank: 2, username: 'studyowl', nights: 16 },
  { rank: 3, username: 'brainwave7', nights: 15 },
  { rank: 4, username: 'dormroom99', nights: 14 },
  { rank: 5, username: 'coffee2code', nights: 13 },
] as const

export const demoConsistency = [
  { rank: 1, username: 'nightowl21', improvement: 32 },
  { rank: 2, username: 'studyowl', improvement: 27 },
  { rank: 3, username: 'sleepySam', improvement: 24 },
  { rank: 4, username: 'brainwave7', improvement: 21 },
  { rank: 5, username: 'coffee2code', improvement: 18 },
] as const

// Map these illustrative game names to the Android app's game IDs before launch.
// Actual per-game daily high scores will come from Flux game telemetry, never a combined score.
export const demoCognition = [
  { game: 'Reaction Rush', username: 'brainwave7', score: 9840 },
  { game: 'Memory Sequence', username: 'studyowl', score: 8720 },
  { game: 'Color Quick', username: 'coffee2code', score: 8410 },
  { game: 'Pattern Memory', username: 'sleepySam', score: 7950 },
] as const

export const demoMostImproved = [
  { rank: 1, username: 'studyowl', improvement: 24 },
  { rank: 2, username: 'brainwave7', improvement: 19 },
  { rank: 3, username: 'sleepySam', improvement: 17 },
  { rank: 4, username: 'nightowl21', improvement: 14 },
  { rank: 5, username: 'dormroom99', improvement: 12 },
] as const

export type { CompetitionId as LeaderboardCategory } from './championshipConfig'
