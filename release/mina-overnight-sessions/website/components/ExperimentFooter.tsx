import Link from 'next/link'

export default function ExperimentFooter() {
  return <footer className="funnel-footer"><span>Flux · Sleep. Sound. Cognition.</span><div className="flex flex-wrap gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/delete-details">Delete My Account</Link></div></footer>
}
