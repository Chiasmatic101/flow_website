import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { creatorTemplate, completeCreatorCopy } from '../../lib/mina-consumer-creator'
import { protocolDefinition } from '../../lib/server/mina-protocol'
const {validateDefinition}=createRequire(import.meta.url)('C:/Users/akpoo/StudioProjects/flow/functions/lib/declarative.js')
const c=JSON.parse(readFileSync('release/mina-consumer-creator/capabilities.json','utf8'))
for(const kind of ['comparison','single','checkin','cognitive'] as const){ const e=completeCreatorCopy({...creatorTemplate(kind,c),id:`compat-${kind}`,title:'Compatibility check',description:'Consumer configuration'}); validateDefinition(protocolDefinition(e)); }
console.log('All four templates accepted by the existing Mina Functions definition validator. No cloud writes.')
