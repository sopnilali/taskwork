'use client';
import { useRef, useEffect, useState } from 'react';

export default function ClassicEditor({ value, onChange, onImageUpload }: { value: string; onChange: (v:string)=>void; onImageUpload?: (file: File)=>Promise<string> }){
  const ref = useRef<HTMLDivElement>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [active, setActive] = useState<string[]>([]);

  useEffect(()=>{ if(ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value; },[]);

  useEffect(()=>{
    if(!htmlMode && ref.current && value !== ref.current.innerHTML) {
      const sel = window.getSelection();
      const pos = sel?.rangeCount ? sel.getRangeAt(0).startOffset : null;
      if(document.activeElement !== ref.current) ref.current.innerHTML = value;
    }
  },[value, htmlMode]);

  const exec = (cmd:string, val?:string)=>{
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    updateActive();
  };

  const updateActive = ()=>{
    const cmds = ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList','justifyLeft','justifyCenter','justifyRight'];
    const a: string[] = [];
    cmds.forEach(c=> { try{ if(document.queryCommandState(c)) a.push(c);}catch{} });
    const block = document.queryCommandValue('formatBlock');
    if(block) a.push(block);
    setActive(a);
  };

  const onInput = ()=>{
    if(ref.current) onChange(ref.current.innerHTML);
  };

  const insertLink = ()=>{
    const url = prompt('Enter URL:');
    if(url) exec('createLink', url);
  };

  const insertImageFromUrl = ()=>{
    const url = prompt('Image URL (or upload via button):');
    if(url) exec('insertImage', url);
  };

  const handleImageFile = async (f: File | null)=>{
    if(!f) return;
    if(onImageUpload){
      const url = await onImageUpload(f);
      exec('insertImage', url);
    } else {
      const url = URL.createObjectURL(f);
      exec('insertImage', url);
    }
  };

  const btnStyle = (isActive:boolean): React.CSSProperties => ({
    padding:'6px 8px', borderRadius:6, border:'1px solid var(--gray-200)', background: isActive ? 'var(--primary)' : '#fff', color: isActive ? '#fff' : 'var(--gray-700)', fontSize:12, cursor:'pointer', fontWeight:600, minWidth:28, textAlign:'center'
  });

  return (
    <div style={{ border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', background:'#fff' }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, padding:8, background:'var(--gray-50)', borderBottom:'1px solid var(--gray-200)', alignItems:'center' }}>
        <select onChange={e=> exec('formatBlock', e.target.value)} defaultValue="p" style={{ padding:'6px 8px', borderRadius:6, border:'1px solid var(--gray-200)', fontSize:12, background:'#fff' }}>
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code</option>
        </select>
        <div style={{ width:1, height:22, background:'var(--gray-200)' }}/>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('bold');}} style={btnStyle(active.includes('bold'))}><i className="fas fa-bold"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('italic');}} style={btnStyle(active.includes('italic'))}><i className="fas fa-italic"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('underline');}} style={btnStyle(active.includes('underline'))}><i className="fas fa-underline"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('strikeThrough');}} style={btnStyle(active.includes('strikeThrough'))}><i className="fas fa-strikethrough"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('justifyLeft');}} style={btnStyle(active.includes('justifyLeft'))}><i className="fas fa-align-left"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('justifyCenter');}} style={btnStyle(active.includes('justifyCenter'))}><i className="fas fa-align-center"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('justifyRight');}} style={btnStyle(active.includes('justifyRight'))}><i className="fas fa-align-right"/></button>
        <div style={{ width:1, height:22, background:'var(--gray-200)' }}/>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('insertUnorderedList');}} style={btnStyle(active.includes('insertUnorderedList'))}><i className="fas fa-list-ul"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('insertOrderedList');}} style={btnStyle(active.includes('insertOrderedList'))}><i className="fas fa-list-ol"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); insertLink();}} style={btnStyle(false)}><i className="fas fa-link"/></button>
        <button type="button" onMouseDown={e=>{e.preventDefault(); insertImageFromUrl();}} style={btnStyle(false)}><i className="fas fa-image"/></button>
        <label style={{ ...btnStyle(false), cursor:'pointer', margin:0 }}>
          <i className="fas fa-cloud-arrow-up"/> <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=> handleImageFile(e.target.files?.[0]||null)} />
        </label>
        <button type="button" onMouseDown={e=>{e.preventDefault(); exec('removeFormat');}} style={btnStyle(false)} title="Clear"><i className="fas fa-eraser"/></button>
        <button type="button" onClick={()=> setHtmlMode(v=>!v)} style={{ ...btnStyle(htmlMode), marginLeft:'auto' }}>{htmlMode ? 'Visual' : 'HTML'}</button>
      </div>

      {htmlMode ? (
        <textarea value={value} onChange={e=> onChange(e.target.value)} style={{ width:'100%', minHeight:220, padding:12, border:'none', outline:'none', fontFamily:'monospace', fontSize:12, background:'#fafafa' }} placeholder="<p>Write article...</p>" />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onKeyUp={updateActive}
          onMouseUp={updateActive}
          style={{ minHeight:220, padding:12, outline:'none', fontSize:14, lineHeight:1.7, overflowY:'auto' }}
          data-placeholder="Write your content here... Use toolbar like WordPress Classic Editor"
        />
      )}
      <div style={{ padding:'6px 10px', background:'var(--gray-50)', borderTop:'1px solid var(--gray-200)', fontSize:11, color:'var(--gray-500)', display:'flex', justifyContent:'space-between' }}>
        <span><i className="fas fa-pen"/> Classic Editor — like WordPress CMS</span>
        <span>{strip(value).split(/\s+/).filter(Boolean).length} words</span>
      </div>
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder); color:var(--gray-400)}`}</style>
    </div>
  );
}
function strip(h:string){ return h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
