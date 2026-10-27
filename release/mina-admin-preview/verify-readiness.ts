import {readFileSync,writeFileSync} from 'node:fs'
import {publicationBlockers} from '../../lib/mina-builder'
import {consumerDisclosureIssues} from '../../lib/mina-consumer-creator'
import {validateProtocol,validateSevenNight} from '../../lib/mina-protocol'
import {assertExecutable,PublicationValidationError} from '../../lib/server/mina-protocol'
import type {Experiment} from '../../lib/mina-experiments'
const dir='C:/Users/akpoo/StudioProjects/flow/release/mina-admin-preview/'
const e={resultsSummary:'',resultsVideoUrl:'',resultsPublished:false,revision:1,...JSON.parse(readFileSync(dir+'draft-source-after.json','utf8'))} as Experiment
const c=JSON.parse(readFileSync(dir+'registry-runtime.json','utf8'))
validateProtocol(e.protocol);validateSevenNight(e)
const disclosures=consumerDisclosureIssues(e)
let serverPassed=false,issues:string[]=[]
try{assertExecutable(e,c);serverPassed=true}catch(err){if(err instanceof PublicationValidationError)issues=err.issues;else throw err}
const result={installedBuild:14,registryBuild:c.appBuild,sevenNightStructureValid:true,baseline:'Silence',pairedNights:[[2,3],[4,5],[6,7]],bundledSound:'brown_noise',participantControlled:true,minimumIntervalSeconds:e.protocol.sessionPolicy?.minimumIntervalSeconds,sharedDisclosureCovered:disclosures.length===0,publicationValidationPassed:serverPassed,serverIssues:issues,editorIssues:publicationBlockers(e,c).map(b=>b.message),published:false,enrollmentEnabled:false}
writeFileSync(dir+'publication-readiness.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2))

