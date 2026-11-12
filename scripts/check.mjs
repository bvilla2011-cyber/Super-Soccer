import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');let failed=false;
for(const dir of ['src','scripts','tests'])for(const file of await readdir(path.join(root,dir)))if(/\.(js|mjs)$/.test(file)){
 const result=spawnSync(process.execPath,['--check',path.join(root,dir,file)],{encoding:'utf8'});if(result.status!==0){failed=true;process.stderr.write(result.stderr);}
}
for(const file of ['package.json','manifest.webmanifest','.openai/hosting.json'])try{JSON.parse(await readFile(path.join(root,file),'utf8'));}catch(e){failed=true;console.error(file,e.message);}
if(failed)process.exit(1);console.log('All JavaScript and JSON files are valid.');
