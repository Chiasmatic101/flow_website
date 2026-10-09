import type { Metadata } from 'next'
import ExperimentHeader from '@/components/ExperimentHeader'
import ExperimentFooter from '@/components/ExperimentFooter'
import MinaResults from '@/components/MinaResults'
export const metadata: Metadata = { title: 'Mina Tests Results | Flux', description: 'Genuine Mina Test results will be published here when available.' }
export default function ResultsPage() { return <div className="funnel-shell"><ExperimentHeader /><main><div className="mina-hero"><h1>Mina Tests <span className="gradient-text">results</span></h1></div><MinaResults /></main><ExperimentFooter /></div> }
