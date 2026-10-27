'use client'
import { useEffect } from 'react'
import { captureAcquisition } from '@/lib/acquisition'
export default function AcquisitionCapture() { useEffect(() => { captureAcquisition() }, []); return null }
