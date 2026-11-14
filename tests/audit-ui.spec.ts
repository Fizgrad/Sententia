import {expect,test,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {defaultData} from '../src/lib/store';
import {createQueuedRecord,schedule} from '../src/lib/scheduler';
import type {AppData} from '../src/lib/types';

async function dataSettings(page:Page){
  const profile=page.getByRole('button',{name:/终身学习，始于一句/});
  const menu=page.getByRole('button',{name:'打开导航',exact:true});
  if(await menu.isVisible()&&!await page.getByRole('button',{name:'关闭导航',exact:true}).isVisible())await menu.click();
  await profile.click();
  const dialog=page.getByRole('dialog',{name:'阅读偏好',exact:true});
  await dialog.getByRole('tab',{name:'数据与备份',exact:true}).click();
  return dialog;
}

async function importSnapshot(page:Page,input:string|AppData){
  const data=typeof input==='string'?defaultData():input;
  if(typeof input==='string')data.records[input]=createQueuedRecord(input,new Date('2026-11-01T00:00:00.000Z'));
  const dialog=await dataSettings(page);
  await dialog.getByLabel('导入拾句备份',{exact:true}).setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await dialog.getByRole('button',{name:'确认恢复',exact:true}).click();
  await expect(dialog).toBeHidden();
}

test('replacing progress while an answer is revealed starts a fresh recall question',async({page})=>{
  await page.goto('./');
  await expect(page.getByRole('combobox',{name:'学习词汇难度',exact:true})).toBeVisible();
  await importSnapshot(page,'mitigate');
  const menu=page.getByRole('button',{name:'打开导航',exact:true});
  if(await menu.isVisible())await menu.click();
  await page.getByRole('navigation',{name:'主导航'}).getByRole('button',{name:/^回响/}).click();
  await page.getByLabel('那个词，你还记得吗？',{exact:true}).fill('mitigate');
  await page.getByRole('button',{name:'核对答案',exact:true}).click();
  await expect(page.locator('.word-heading h3')).toHaveText('mitigate');
  await expect(page.locator('.rating-button')).toHaveCount(4);
  await importSnapshot(page,'foster');
  await expect(page.getByLabel('那个词，你还记得吗？',{exact:true})).toHaveValue('');
  await expect(page.locator('.cloze-blank')).toBeVisible();
  await expect(page.locator('.rating-button')).toHaveCount(0);
  await expect(page.locator('.word-heading h3')).toHaveCount(0);
});

async function exportSnapshot(page:Page):Promise<AppData>{
  const dialog=await dataSettings(page);
  const downloading=page.waitForEvent('download');
  await dialog.getByRole('button',{name:'导出',exact:true}).click();
  const download=await downloading;
  const path=await download.path();
  if(!path)throw new Error('Backup download path was unavailable');
  const data=JSON.parse(await readFile(path,'utf8')) as AppData;
  await dialog.getByRole('button',{name:'关闭设置',exact:true}).click();
  await expect(dialog).toBeHidden();
  return data;
}

for(const mode of ['learn','review'] as const){
  test(`${mode} undo preserves later same-word progress restored from a backup`,async({page})=>{
    await page.goto('./');
    await expect(page.getByRole('combobox',{name:'学习词汇难度',exact:true})).toBeVisible();
    if(mode==='learn'){
      await page.getByRole('combobox',{name:'学习顺序',exact:true}).selectOption('original');
      await page.getByRole('button',{name:'暂时不会，查看解析',exact:true}).click();
      await page.getByRole('button',{name:'继续拾句',exact:true}).click();
    }else{
      await importSnapshot(page,'mitigate');
      const menu=page.getByRole('button',{name:'打开导航',exact:true});
      if(await menu.isVisible())await menu.click();
      await page.getByRole('navigation',{name:'主导航'}).getByRole('button',{name:/^回响/}).click();
      await page.getByRole('button',{name:'核对答案',exact:true}).click();
      await page.locator('.rating-3').click();
    }
    const undo=page.getByRole('button',{name:mode==='learn'?/撤销上一步/:/撤销评分/});
    await expect(undo).toBeEnabled();
    const data=await exportSnapshot(page);
    expect(data.records.mitigate.card.reps).toBe(1);
    const now=new Date(Date.now()+86_400_000);
    data.records.mitigate=schedule(data.records.mitigate,'mitigate','mitigate-1',3,data.preferences.retention,now);
    data.logs.push({id:'later-same-word-review',wordId:'mitigate',sentenceId:'mitigate-1',rating:3,mode:'review',at:now.toISOString()});
    await importSnapshot(page,data);
    await undo.click();
    await expect(page.locator('.toast')).toContainText('这条记录已更新，无法继续撤销。');
    await expect(undo).toBeDisabled();
    const preserved=await exportSnapshot(page);
    expect(preserved.records.mitigate).toEqual(data.records.mitigate);
    expect(preserved.logs.map(log=>log.id)).toEqual(data.logs.map(log=>log.id));
  });
}
