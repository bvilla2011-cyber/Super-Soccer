import http from 'node:http';import path from 'node:path';import {readFile,stat} from 'node:fs/promises';
const root=path.resolve(import.meta.dirname,'..',process.argv.includes('--dist')?'dist':'.');
const port=Number(process.env.PORT??4173);const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png'};
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');let pathname=decodeURIComponent(url.pathname);if(pathname.endsWith('/'))pathname+='index.html';const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 const s=await stat(file);if(!s.isFile())throw new Error('Not a file');const data=await readFile(file);
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch(error){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Archivo no encontrado.');}
}).listen(port,'0.0.0.0',()=>console.log(`Super Soccer ready at http://localhost:${port}`));
