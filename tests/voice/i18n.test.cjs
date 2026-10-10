process.chdir(require('node:path').resolve(__dirname,'../..'));
const test=require('node:test'),assert=require('node:assert/strict'),i18n=require('../../addon/voice/i18n.js');
test('English interface translates dynamic playback and updater statuses',()=>{
 assert.equal(i18n.translate('第 2 页 · 正在朗读 3/8 · 第 1/2 遍','en'),'Page 2 · Reading 3/8 · Repeat 1/2');
 assert.equal(i18n.translate('自动更新已开启 · 由 Zotero 定期检查','en'),'Automatic updates on · Managed by Zotero');
 assert.equal(i18n.translate('发现新版本 1.2.4 · 点击安装更新','en'),'New version: 1.2.4 · Select Install update');
});
test('Language choice preserves original Chinese UI and English scientific text',()=>{
 assert.equal(i18n.translate('从选定位置（句首）','zh'),'从选定位置（句首）');
 assert.equal(i18n.translate('The retina converts light into neural signals.','en'),'The retina converts light into neural signals.');
 assert.equal(i18n.translate('美音 · 女声 Heart','en'),'US · Female Heart');
});

test('First page option uses complete English label',()=>assert.equal(i18n.translate('从第 1 页','en'),'First page'));

test('interface locale resolution follows supported system languages and falls back safely',()=>{
 for(const [input,expected] of [['zh-TW','zh'],['ja-JP','ja'],['fr-CA','fr'],['de-DE','de'],['en-GB','en'],['ru-RU','en']])assert.equal(i18n.resolveLanguage('auto',input),expected);
 assert.equal(i18n.resolveLanguage('de','ja-JP'),'de');assert.equal(i18n.resolveLanguage('invalid','zh-CN'),'en');
});
test('new locales translate controls and dynamic counters without changing source text',()=>{
 const labels={zh:'自动',en:'Auto',ja:'自動',fr:'Auto',de:'Auto'};
 for(const lang of Object.keys(labels)){
  assert.equal(i18n.translate('自动',lang),labels[lang]);
  assert.equal(i18n.translate('Müller cells convert light into signals.',lang),'Müller cells convert light into signals.');
 }
 assert.equal(i18n.translate('第 2 页 · 正在朗读 3/8 · 第 1/2 遍','ja'),'2 ページ · 読み上げ中 3/8 · 1/2 回目');
 assert.equal(i18n.translate('正在读取第 3/9 页…','fr'),'Chargement page 3/9…');
 assert.equal(i18n.translate('朗读完成 · 2 页无文字，已跳过','de'),'Fertig · 2 Seiten ohne Text übersprungen');
 assert.equal(i18n.translate('普通话 · 男声 Yunxi','de'),'Mandarin · Männlich Yunxi');
});

test('current release notice does not leave a Chinese version suffix',()=>{for(const language of ['en','fr','de'])assert.doesNotMatch(i18n.translate('已是最新版本',language),/[\u3400-\u9fff]/);});
