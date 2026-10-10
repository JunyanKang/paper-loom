const reader=L.demoReader,V=L.voice,S=L.referencesScope.CiteLensServices,wait=ms=>Zotero.Promise.delay(ms),images=[];
if(!reader||!L.captureDocs)throw Error('Run native-docs first');
for(const lang of ['zh','en']){
 S.state.settings.interfaceLanguage=lang;await S.persist();L.referencesScope.CiteLensThemes.refresh();V.setLanguage(lang);V.set('mode','selection');V.set('voice','af_heart');V.set('readTranslation',false);
 const task=V.speak('The retina transforms light into signals that allow us to see the world. Reading about retinal development often involves moving between cells, tissues, and the organization of a complete visual system.',reader,true);
 for(let i=0;i<200&&V.state!=='playing';i++)await wait(100);if(V.state!=='playing')throw Error('Demo audio did not start');V.togglePause();V.showPanel(reader);await wait(900);images.push(await L.captureDocs(reader._iframeWindow.document.documentElement,'listening-'+lang));V.stop();await task;
}
return {passed:true,images};
