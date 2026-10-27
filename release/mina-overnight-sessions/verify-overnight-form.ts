import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import Activities, { placeBuilderActivity } from '../../components/MinaBuilderActivities'
const draft=JSON.parse(readFileSync('C:/Users/akpoo/StudioProjects/flow/release/mina-release-1/brown-noise-production-draft.json','utf8'))
const caps=JSON.parse(readFileSync('C:/Users/akpoo/StudioProjects/flow/release/mina-release-1/production-capabilities.pending-review.json','utf8'))
let changed:any
const props={protocol:draft.protocol,nights:7,capabilities:caps,locked:false,onChange:(value:any)=>{changed=value}}
const html=renderToStaticMarkup(React.createElement(Activities,props))
if(!html.includes('Overnight sleep session — participant controlled')||html.includes('Every evening')||html.includes('Every morning after a study night')||html.includes('Session length')||!html.includes('After End Night'))throw Error('Controlled-session form exposes clock/fixed duration settings')
const p=draft.protocol
if(placeBuilderActivity(p,'brown-noise-audio','every:evening',7)!==p)throw Error('Controlled audio accepted a scheduled placement')
function find(n:any):any{if(Array.isArray(n)){for(const x of n){const b=find(x);if(b)return b}}else if(n?.props){if(n.type==='button'&&n.key==='audio.playback')return n;return find(n.props.children)}}
find(Activities(props)).props.onClick()
if(changed.activities.at(-1).sessionMode!=='overnight'||changed.activities.at(-1).durationSeconds!==0)throw Error('New controlled audio requires a fixed duration')
const legacy={...p};delete legacy.sessionPolicy
const oldHtml=renderToStaticMarkup(React.createElement(Activities,{...props,protocol:legacy}))
if(!oldHtml.includes('Every evening'))throw Error('Legacy schedule choices lost')
console.log(JSON.stringify({controlledFormHasNoClockOrFixedDuration:true,conditionPlacementEnforced:true,newAudioDefaultsToParticipantControlled:true,legacySchedulingPreserved:true}))
