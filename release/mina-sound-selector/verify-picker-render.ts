import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import Picker from './website/components/MinaBundledSoundPicker'
const capabilities=JSON.parse(readFileSync('C:/Users/akpoo/StudioProjects/flow/release/mina-release-1/production-capabilities.pending-review.json','utf8'))
const activity={id:'brown-noise-audio',type:'audio.playback',version:1,soundId:'brown_noise',audioUrl:'',durationSeconds:0,sessionMode:'overnight' as const,taskId:'',questionIds:[]}
const html=renderToStaticMarkup(React.createElement(Picker,{activity,capabilities,onChange:()=>{}}))
if(!html.includes('value="brown_noise" selected=""')&&!html.includes('selected="" value="brown_noise"')) throw Error('Existing Brown Noise selection was not rendered')
for(const id of ['brown_noise','rain','ocean','forest','winter']) if(!html.includes(`value="${id}"`))throw Error('Bundled sound missing: '+id)
if(html.includes('<audio')||html.includes('type="file"'))throw Error('Unexpected remote audio or upload UI')
console.log(JSON.stringify({renderedSoundOptions:5,brownNoiseSelected:true,noUploadOrRemotePlayer:true}))
