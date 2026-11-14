'use client';

import { useEffect, useRef } from 'react';
import { ArrowRight, Check, Lightbulb, X } from 'lucide-react';
import type { MeaningQuestion } from '@/lib/meaning-quiz';
import './meaning-choices.css';

export interface GuessResult { wordId:string; optionId:string|null; correct:boolean }

export function MeaningChoices({question,selected,result,onSelect,onConfirm,onSkip}:{question:MeaningQuestion;selected:string|null;result:GuessResult|null;onSelect:(id:string)=>void;onConfirm:()=>void;onSkip:()=>void}) {
  const feedback=useRef<HTMLDivElement>(null);
  const confirmed=result?.wordId===question.wordId;
  useEffect(()=>{if(confirmed)feedback.current?.focus({preventScroll:true});},[confirmed]);
  return <section className="meaning-question" aria-label="语境词义选择">
    <form onSubmit={event=>{event.preventDefault();if(!confirmed&&selected)onConfirm();}} onKeyDown={event=>{
      if(confirmed || event.ctrlKey || event.metaKey || event.altKey)return;
      if(/^[1-4]$/.test(event.key)){event.preventDefault();event.stopPropagation();onSelect(question.options[Number(event.key)-1].id);}
    }}>
      <fieldset disabled={confirmed}>
        <legend>Which meaning best fits this sentence?</legend>
        <p className="meaning-instruction">选出最贴合语境的英文释义</p>
        <div className="meaning-options">{question.options.map((option,index)=>{
          const correct=confirmed&&option.id===question.correctOptionId;
          const incorrect=confirmed&&option.id===result?.optionId&&!correct;
          return <label className={`meaning-option ${selected===option.id?'selected':''} ${correct?'is-correct':''} ${incorrect?'is-incorrect':''}`} key={option.id}>
            <input type="radio" name={`meaning-${question.wordId}`} value={option.id} checked={selected===option.id} onChange={()=>onSelect(option.id)}/>
            <span className="meaning-letter" aria-hidden="true">{correct?<Check size={16}/>:incorrect?<X size={16}/>:String.fromCharCode(65+index)}</span>
            <span className="meaning-option-copy"><span>{option.definition}</span>{correct&&<small>正确答案</small>}{incorrect&&<small>你的选择</small>}</span>
            {!confirmed&&<kbd aria-hidden="true">{index+1}</kbd>}
          </label>;
        })}</div>
      </fieldset>
      {!confirmed&&<div className="meaning-submit-row"><button type="button" className="text-button meaning-skip" onClick={onSkip}>暂时不会，查看解析</button><button type="submit" className="primary-button" disabled={!selected}>确认选择 <ArrowRight size={16}/></button></div>}
    </form>
    {confirmed&&<div className={`guess-feedback ${result.correct?'correct':'incorrect'}`} role="status" tabIndex={-1} ref={feedback}>{result.correct?<Check size={19}/>:result.optionId?<X size={19}/>:<Lightbulb size={19}/>}<div><strong>{result.correct?'答对了，语境读懂了。':result.optionId?'这次选错了，来看看词义的分寸。':'没关系，先在这句话里认识它。'}</strong><p>{result.correct?'继续读读搭配与其他例句，再把这个词留下来。':'正确的英文释义已标出。读懂之后，我们会安排一次更近的复习。'}</p></div></div>}
  </section>;
}
