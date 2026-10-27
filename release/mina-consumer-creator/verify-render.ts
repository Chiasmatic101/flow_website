import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { readFileSync, writeFileSync } from 'node:fs'
import Builder from '../../components/MinaExperimentBuilder'
import { publicationBlockers } from '../../lib/mina-builder'
import { consumerDisclosureIssues } from '../../lib/mina-consumer-creator'
import { validateSevenNight } from '../../lib/mina-protocol'
import type { Experiment } from '../../lib/mina-experiments'
const base='C:/Users/akpoo/flow-website/release/mina-consumer-creator/'
const e={resultsSummary:'',resultsVideoUrl:'',resultsPublished:false,revision:1,...JSON.parse(readFileSync(base+'draft.json','utf8'))} as Experiment
const capabilities=JSON.parse(readFileSync(base+'capabilities.json','utf8'))
const before=JSON.stringify(e.protocol)
const router={push(){},replace(){},refresh(){},back(){},forward(){},prefetch:async()=>{}}
for(const step of [1,2,3]){
 const html=renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:router},React.createElement(Builder,{initial:e,capabilities,startStep:step})))
 if(!html.includes('Step '+step+' of 3'))throw Error('Incorrect workflow')
 if(/Record protocol review|compatibility attestation|I have reviewed the schedule/.test(html))throw Error('Manual review UI remains')
 if(step===2 && (!html.includes('brown_noise') || !html.includes('Silence · no audio')))throw Error('Saved conditions not loaded')
 if(step===3 && !html.includes('Private preview') && !html.includes('Private preview'.toLowerCase()))throw Error('Missing preview')
 writeFileSync(base+`preview-step-${step}.html`,html)
}
validateSevenNight(e)
if(consumerDisclosureIssues(e).length)throw Error('Existing disclosure not covered')
if(JSON.stringify(e.protocol)!==before)throw Error('Draft mutated')
const blockers=publicationBlockers(e,capabilities)
if(blockers.length!==1 || !blockers[0].message.includes('Register a verified'))throw Error(JSON.stringify(blockers))
writeFileSync(base+'readiness.json',JSON.stringify({stepsRendered:3,draftProtocolUnchanged:true,sevenNightValid:true,sharedDisclosureCovered:true,blockers: blockers.map(b=>b.message),status:e.status,enrollmentEnabled:e.enrollmentEnabled},null,2))
console.log('Three steps rendered; Brown Noise draft and disclosure valid; only actual registry verification blocks publication.')
