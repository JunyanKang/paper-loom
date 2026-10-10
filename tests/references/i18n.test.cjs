process.chdir(require('node:path').resolve(__dirname,'../..'));
const {test}=require('node:test'),assert=require('node:assert/strict'),I=require('../../addon/references/i18n.js');
test('interface locales follow Paper Voice and translate settings independently',()=>{for(const language of ['en','ja','fr','de']){for(const key of ['界面语言','显示模式','引用','字体','外观','数据','译文'])assert.notEqual(I.text(key,language),key);assert.ok(I.text('Paper Nexus 设置',language).startsWith('Paper Nexus '));}assert.equal(I.resolve('auto','ja-JP'),'ja');assert.equal(I.resolve('auto','ko-KR'),'en');assert.equal(I.text('DOI 10.1038/abc','fr'),'DOI 10.1038/abc');});

test('empty network and current release notices use whole localized messages',()=>{for(const language of ['en','fr','de'])for(const text of ['当前范围暂无可关联作者，可选择其他文献夹。','已是最新版本'])assert.doesNotMatch(I.text(text,language),/[\u3400-\u9fff]/);});
