import {mkdir,readdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const sources=['index.html','styles.css','arcade.css','manifest.webmanifest'];
async function walk(dir){for(const file of await readdir(path.join(root,dir),{withFileTypes:true})){const p=path.posix.join(dir,file.name);if(file.isDirectory())await walk(p);else sources.push(p);}}
await walk('src');await walk('assets');
const hash=createHash('sha256');for(const file of sources.sort())hash.update(await readFile(path.join(root,file)));hash.update(await readFile(path.join(root,'sw.js')));hash.update(await readFile(path.join(root,'scripts/build.mjs')));
const version=hash.digest('hex').slice(0,12);await rm(path.join(root,'dist'),{recursive:true,force:true});await mkdir(path.join(root,'dist'),{recursive:true});
const versioned=f=>'./'+f+(/[.]js$|[.]css$/.test(f)?'?v='+version:'');
for(const file of sources){
 await mkdir(path.dirname(path.join(root,'dist',file)),{recursive:true});
 let content=await readFile(path.join(root,file),'utf8');
 if(file==='index.html')content=content.replace(/((?:href|src)=["'])(\.\/[^"']+\.(?:js|css))(["'])/g,(_,before,url,after)=>before+url+'?v='+version+after);
 else if(file.endsWith('.js'))content=content.replace(/((?:from\s*|import\s*)["'])(\.{1,2}\/[^"']+\.js)(["'])/g,(_,before,url,after)=>before+url+'?v='+version+after);
 await writeFile(path.join(root,'dist',file),content);
}
const sw=(await readFile(path.join(root,'sw.js'),'utf8')).replace('__BUILD_VERSION__',version).replace('/* ASSET_LIST */',JSON.stringify(['./',...sources.map(versioned)]));
await writeFile(path.join(root,'dist','sw.js'),sw);await writeFile(path.join(root,'dist','version.json'),JSON.stringify({version}));
console.log(`Built Super Soccer ${version}: ${sources.length} local files, no runtime dependencies.`);
