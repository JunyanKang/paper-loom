const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),C=require('../addon/shared/runtime-core.js');
test('native platform matching prevents wrong architecture downloads',()=>{
 assert.equal(C.platform({os:'Darwin',arch:'arm64',version:'25.0'}).key,'macOS-arm64');
 assert.equal(C.platform({os:'Darwin',abi:'aarch64-gcc3',version:'23.4'}).supported,true);
 assert.equal(C.platform({os:'Darwin',arch:'x86_64',version:'25'}).supported,false);
 assert.equal(C.platform({os:'Darwin',arch:'arm64',version:'22.6'}).supported,false);
 assert.equal(C.platform({os:'WINNT',abi:'x86_64-msvc'}).key,'Windows-x64');
 assert.equal(C.platform({os:'WINNT',arch:'ARM64',abi:'x86_64-msvc'}).supported,false);
 assert.equal(C.platform({os:'Linux',arch:'x86_64'}).supported,false);
});
test('both real catalogs pin complete packages and required engine files',()=>{
 for(const key of ['macOS-arm64','Windows-x64']) {
  const manifest=JSON.parse(fs.readFileSync(require.resolve('../addon/catalogs/runtime-'+key+'.json')));
  assert.equal(C.manifest(manifest,key),manifest);
  const copy=structuredClone(manifest);copy.packages[0].parts[0].url='https://evil.example/runtime';
  assert.throws(()=>C.manifest(copy,key));
  assert.throws(()=>C.manifest(manifest,key==='macOS-arm64'?'Windows-x64':'macOS-arm64'));
  const missing=structuredClone(manifest);missing.files=missing.files.filter(f=>f.name!=='worker.py');assert.throws(()=>C.manifest(missing,key));
  const bad=structuredClone(manifest);bad.packages[0].bytes++;assert.throws(()=>C.manifest(bad,key));
 }
});
test('archive paths reject traversal, Windows devices and ambiguous extraction',()=>{
 for(const name of ['../evil','/etc/passwd','engine/../../evil','engine\\evil','C:/evil','engine/a:stream','engine/COM1.txt','engine/foo.','engine/foo ','engine//foo','engine/\0foo','./engine/foo'])assert.equal(C.safePath(name),false,name);
 for(const name of ['engine/python/bin/python3','engine/models/voices-v1.0.bin','Licenses/内置运行环境/源码/espeak.tar.gz','engine/'])assert.equal(C.safePath(name),true,name);
});
