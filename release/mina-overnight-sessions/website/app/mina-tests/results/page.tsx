import type { Metadata } from 'next'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import PublishedExperiments from '@/components/PublishedExperiments'
export const metadata: Metadata = { title: 'Mina Tests Results | Flux', description: 'Genuine Mina Test results will be published here when available.' }
export const dynamic = 'force-dynamic'
export default function ResultsPage() { return <div className="funnel-shell"><ExperimentHeader /><main><div className="mina-hero"><h1>Mina Tests <span className="gradient-text">results</span></h1></div><PublishedExperiments resultsOnly /></main><ExperimentFooter /></div> }
