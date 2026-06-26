import { useState, useEffect } from "react";
import jsPDF from 'jspdf';

const B = {
  bg:"#0F0E0C",bg1:"#161513",bg2:"#1E1C19",bg3:"#252320",
  border:"#2C2A27",border2:"#383532",text:"#F0EBE3",text2:"#9A948C",
  text3:"#5C5852",gold:"#C8AA78",white:"#F5F0E8",red:"#E05252",
  amber:"#D4904A",green:"#5CB87A",blue:"#5B9BD5",
};
const STATUS={
  pendiente:{l:"Pendiente",c:B.text3,dot:"#3D3A36"},
  en_espera:{l:"En espera",c:B.blue,dot:B.blue},
  en_ejecucion:{l:"En ejecución",c:B.amber,dot:B.amber},
  para_revisar:{l:"Para revisar",c:"#D4804A",dot:"#D4804A"},
  en_correccion:{l:"En corrección",c:B.red,dot:B.red},
  aprobado:{l:"Aprobado",c:B.green,dot:B.green},
  entregado:{l:"Entregado",c:"#4AB89A",dot:"#4AB89A"},
  cerrado:{l:"Cerrado",c:B.text3,dot:B.text3},
};
const PRIO={
  urgente:{l:"Urgente",c:B.red},alta:{l:"Alta",c:B.amber},
  normal:{l:"Normal",c:B.gold},baja:{l:"Baja",c:B.green},
};
const TYPES={
  "LX Argentina":["Plano conforme a obra","Ajuste CAD","Detalle técnico","PDF de obra","Relevamiento","Otro"],
  "LXM UT":["APU","Memoria descriptiva","Pliego","Licitación","Layout / Arquitectura","Presentación","Documentación técnica","Otro"],
};
const FLOW={
  pendiente:["en_espera","en_ejecucion"],en_espera:["pendiente","en_ejecucion"],
  en_ejecucion:["para_revisar"],para_revisar:["aprobado","en_correccion"],
  en_correccion:["para_revisar"],aprobado:["entregado"],entregado:["cerrado"],cerrado:[],
};
const PIN="SEM2026";
const FONTS=`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');*{box-sizing:border-box;}::placeholder{color:${B.text3};}select option{background:${B.bg2};}`;

const MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const VALUE_TABLE = {
  'Plano conforme a obra':450000,'Ajuste CAD':280000,'Detalle técnico':150000,
  'PDF de obra':180000,'Relevamiento':180000,'APU':800000,
  'Memoria descriptiva':280000,'Pliego':380000,'Licitación':1800000,
  'Layout / Arquitectura':350000,'Presentación':220000,
  'Documentación técnica':650000,'Otro':180000,
};

function generateMonthlyReport(orders, sheetName) {
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const W=210, PH=297, ML=20, CW=170, FEE=9800000;
  const month = sheetName.replace('Historial - ','');
  const fmt = n => '$' + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  const tc = (...a) => doc.setTextColor(...a);
  const fc = (...a) => doc.setFillColor(...a);
  const dc = (...a) => doc.setDrawColor(...a);
  const fnt = (w,sz) => { doc.setFont('helvetica',w); if(sz) doc.setFontSize(sz); };
  function trunc(s, maxW) {
    let t = String(s||'—');
    if (doc.getTextWidth(t) <= maxW) return t;
    while (t.length > 0 && doc.getTextWidth(t+'…') > maxW) t = t.slice(0,-1);
    return t + '…';
  }
  let y = 0;

  // ── HEADER ──────────────────────────────────────────────────────────
  fc(15,14,12); doc.rect(0,0,W,60,'F');
  fnt('bold',30); tc(200,169,110); doc.text('SC',ML,22);
  fnt('normal',7.5); tc(115,110,103);
  doc.text('SEMCERA STUDIO  ·  ARQ. DANIEL UZCÁTEGUI  ·  SEMCERASTUDIO.COM',ML,29);
  dc(200,169,110); doc.setLineWidth(0.25); doc.line(ML,32.5,W-ML,32.5);
  fnt('bold',7); tc(200,169,110); doc.text('INFORME MENSUAL',ML,41);
  fnt('bold',18); tc(255,255,255); doc.text(month.toUpperCase(),ML,54);
  fnt('bold',26); tc(200,169,110); doc.text(String(orders.length),W-ML,44,{align:'right'});
  fnt('normal',7); tc(115,110,103); doc.text('PEDIDOS ARCHIVADOS',W-ML,51,{align:'right'});
  y = 72;

  // ── RESUMEN OPERATIVO ────────────────────────────────────────────────
  fnt('bold',7); tc(200,169,110); doc.text('§ 01  ·  RESUMEN OPERATIVO',ML,y);
  dc(60,57,53); doc.setLineWidth(0.15); doc.line(ML,y+2.5,W-ML,y+2.5);
  y += 10;
  const lx = orders.filter(o=>o.client==='LX Argentina').length;
  const lxm = orders.filter(o=>o.client==='LXM UT').length;
  const byP = {urgente:0,alta:0,normal:0};
  orders.forEach(o=>{ if(byP[o.priority]!==undefined) byP[o.priority]++; });
  const cw3 = CW/3;
  [['TOTAL PEDIDOS',orders.length],['LX ARGENTINA',lx],['LXM UT',lxm]].forEach(([l,v],i)=>{
    const x=ML+i*cw3;
    fnt('bold',22); tc(20,20,20); doc.text(String(v),x,y+8);
    fnt('normal',7); tc(130,125,118); doc.text(l,x,y+13.5);
  });
  y += 20;
  [['URGENTES',byP.urgente],['ALTA',byP.alta],['NORMAL',byP.normal]].forEach(([l,v],i)=>{
    const x=ML+i*cw3;
    fnt('bold',14); tc(20,20,20); doc.text(String(v),x,y+5);
    fnt('normal',7); tc(130,125,118); doc.text(l,x,y+10);
  });
  y += 20;
  dc(210,205,195); doc.setLineWidth(0.15); doc.line(ML,y,W-ML,y);
  y += 10;

  // ── PEDIDOS ──────────────────────────────────────────────────────────
  fnt('bold',7); tc(200,169,110); doc.text('§ 02  ·  PEDIDOS DEL MES',ML,y);
  dc(60,57,53); doc.setLineWidth(0.15); doc.line(ML,y+2.5,W-ML,y+2.5);
  y += 9;
  const COLS=[{h:'N° PEDIDO',w:27},{h:'PROYECTO',w:40},{h:'TIPO',w:45},{h:'CLIENTE',w:23},{h:'PRIORIDAD',w:19},{h:'CIERRE',w:16}];
  const RH=7, HH=6.5;
  fc(15,14,12); doc.rect(ML,y,CW,HH,'F');
  let cx=ML; fnt('bold',6.5); tc(175,168,155);
  COLS.forEach(({h,w})=>{ doc.text(h,cx+2,y+4.5); cx+=w; });
  y += HH;
  orders.forEach((o,i)=>{
    if(y+RH>PH-18){ doc.addPage(); y=20; }
    if(i%2===0){ fc(248,244,238); doc.rect(ML,y,CW,RH,'F'); }
    const row=[o.id||'—',o.project||'—',o.taskType||'—',o.client||'—',PRIO[o.priority]?.l||o.priority||'—',fd(o.deliveredAt||o.createdAt)];
    cx=ML; fnt('normal',7); tc(20,20,20);
    row.forEach((v,ci)=>{ doc.text(trunc(v,COLS[ci].w-4),cx+2,y+4.5); cx+=COLS[ci].w; });
    y += RH;
  });
  y += 8;

  // ── ANÁLISIS DE VALOR ────────────────────────────────────────────────
  if(y+50>PH-18){ doc.addPage(); y=20; }
  fnt('bold',7); tc(200,169,110); doc.text('§ 03  ·  ANÁLISIS DE VALOR DE MERCADO',ML,y);
  dc(60,57,53); doc.setLineWidth(0.15); doc.line(ML,y+2.5,W-ML,y+2.5);
  y += 9;
  const tg={};
  orders.forEach(o=>{ const t=o.taskType||'Otro'; if(!tg[t])tg[t]={count:0,unit:VALUE_TABLE[t]??180000}; tg[t].count++; });
  let total=0;
  fc(15,14,12); doc.rect(ML,y,CW,HH,'F');
  fnt('bold',6.5); tc(175,168,155);
  doc.text('TIPO DE TRABAJO',ML+2,y+4.5); doc.text('CANT.',ML+92,y+4.5);
  doc.text('VALOR UNITARIO',ML+109,y+4.5); doc.text('SUBTOTAL',ML+148,y+4.5);
  y += HH;
  Object.entries(tg).forEach(([type,{count,unit}],i)=>{
    if(y+RH>PH-18){ doc.addPage(); y=20; }
    const sub=count*unit; total+=sub;
    if(i%2===0){ fc(248,244,238); doc.rect(ML,y,CW,RH,'F'); }
    fnt('normal',7); tc(20,20,20);
    doc.text(trunc(type,88),ML+2,y+4.5);
    doc.text(String(count),ML+93,y+4.5);
    doc.text(fmt(unit),ML+109,y+4.5);
    fnt('bold',7); doc.text(fmt(sub),ML+168,y+4.5,{align:'right'});
    y += RH;
  });
  y += 8;

  // ── RESUMEN FINANCIERO ───────────────────────────────────────────────
  if(y+48>PH-18){ doc.addPage(); y=20; }
  fnt('bold',7); tc(200,169,110); doc.text('§ 04  ·  RESUMEN FINANCIERO',ML,y);
  dc(60,57,53); doc.setLineWidth(0.15); doc.line(ML,y+2.5,W-ML,y+2.5);
  y += 12;
  fc(240,236,228); doc.rect(ML,y,CW,10,'F');
  fnt('normal',9); tc(20,20,20); doc.text('Valor de mercado total',ML+4,y+6.5);
  fnt('bold',9); tc(60,57,53); doc.text(fmt(total),W-ML-3,y+6.5,{align:'right'});
  y += 10;
  fc(248,244,238); doc.rect(ML,y,CW,10,'F');
  fnt('normal',9); tc(20,20,20); doc.text('Fee mensual del plan',ML+4,y+6.5);
  fnt('bold',9); tc(130,125,118); doc.text(fmt(FEE),W-ML-3,y+6.5,{align:'right'});
  y += 10;
  const ahorro=total-FEE;
  fc(15,14,12); doc.rect(ML,y,CW,13,'F');
  fnt('normal',9); tc(255,255,255); doc.text('Ahorro neto del cliente',ML+4,y+8.5);
  fnt('bold',11); tc(...(ahorro>=0?[92,184,122]:[224,82,82]));
  doc.text((ahorro>=0?'+':'-')+fmt(ahorro),W-ML-3,y+8.5,{align:'right'});

  // ── FOOTER (todas las páginas) ───────────────────────────────────────
  const nP=doc.getNumberOfPages();
  for(let p=1;p<=nP;p++){
    doc.setPage(p);
    dc(200,169,110); doc.setLineWidth(0.25); doc.line(ML,PH-14,W-ML,PH-14);
    fnt('normal',7); tc(130,125,118);
    doc.text('SemCera  ·  Arq. Daniel Uzcátegui  ·  semcerastudio.com',W/2,PH-9,{align:'center'});
    if(nP>1) doc.text(`${p} / ${nP}`,W-ML,PH-9,{align:'right'});
  }

  doc.save(`Informe-${month.replace(/ /g,'-')}.pdf`);
}

const STORAGE_KEY = "sc-ops-v2";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function persist(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
}

async function uid(){
  try{
    const r=await fetch('/api/nextid');
    if(r.ok){const d=await r.json();return d.id;}
  }catch(e){console.warn('[SC] nextid error:',e.message);}
  return`SC-${String(new Date().getFullYear()).slice(2)}-${String(Math.floor(Math.random()*900)+100)}`
}
function fd(iso){if(!iso)return"—";const d=new Date(iso);return`${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getFullYear()).slice(2)}`}
function nd(){const d=new Date();return`${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getFullYear()).slice(2)}`}

const S={
  card:{background:B.bg1,border:`1px solid ${B.border}`,borderRadius:"2px",padding:"24px"},
  input:{width:"100%",padding:"11px 14px",background:B.bg2,border:`1px solid ${B.border}`,borderRadius:"2px",color:B.text,fontSize:"13px",fontFamily:"'IBM Plex Sans',system-ui",outline:"none",boxSizing:"border-box",transition:"border-color 0.15s"},
  label:{display:"block",marginBottom:"6px",fontSize:"10px",fontWeight:"500",color:B.text3,letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:"'IBM Plex Mono',monospace"},
};

function ST({s}){const c=STATUS[s]||STATUS.pendiente;return<span style={{display:"inline-flex",alignItems:"center",gap:"6px",color:c.c,fontSize:"11px",fontWeight:"500",fontFamily:"'IBM Plex Mono',monospace"}}><span style={{fontSize:"8px"}}>◆</span>{c.l}</span>}
function PT({p}){const c=PRIO[p]||PRIO.normal;return<span style={{display:"inline-flex",alignItems:"center",gap:"5px",color:c.c,fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}><span style={{fontSize:"7px"}}>●</span>{c.l}</span>}
function Code({children,style={}}){return<span style={{fontFamily:"'IBM Plex Mono',monospace",color:B.gold,fontSize:"11px",letterSpacing:"0.5px",...style}}>{children}</span>}
function HR(){return<div style={{height:"1px",background:B.border}}/>}

function Btn({children,onClick,variant="primary",size="md",full=false,disabled=false,style={}}){
  const vs={primary:{background:B.text,color:B.bg,border:`1px solid ${B.text}`},ghost:{background:"transparent",color:B.text2,border:`1px solid ${B.border}`},danger:{background:"transparent",color:B.red,border:`1px solid ${B.red}`},gold:{background:"transparent",color:B.gold,border:`1px solid ${B.gold}`}};
  const ss={sm:{padding:"6px 14px",fontSize:"11px"},md:{padding:"10px 20px",fontSize:"12px"},lg:{padding:"14px 28px",fontSize:"13px"}};
  return<button onClick={onClick} disabled={disabled} style={{...vs[variant],...ss[size],borderRadius:"2px",fontWeight:"600",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,width:full?"100%":"auto",fontFamily:"'IBM Plex Sans',system-ui",letterSpacing:"0.3px",transition:"all 0.15s",...style}}>{children}</button>
}

function Field({label,value,onChange,type="text",placeholder="",required=false,opts=null,rows=3}){
  return<div style={{marginBottom:"20px"}}>
    {label&&<label style={S.label}>{label}{required&&<span style={{color:B.red}}> *</span>}</label>}
    {opts?<select value={value} onChange={e=>onChange(e.target.value)} style={{...S.input,appearance:"none"}}><option value="">—</option>{opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select>
    :type==="textarea"?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...S.input,resize:"vertical",lineHeight:"1.6"}}/>
    :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={S.input}/>}
  </div>
}

function Bar({left,right,sub}){
  return<div style={{background:B.bg,borderBottom:`1px solid ${B.border}`,position:"sticky",top:0,zIndex:50}}>
    <div style={{display:"flex",alignItems:"center",padding:"0 20px",height:"52px",gap:"16px"}}>
      <div style={{flex:1}}>{left}</div>{right}
    </div>
    {sub&&<div style={{padding:"0 20px 0",display:"flex"}}>{sub}</div>}
  </div>
}

function Home({go,setTid}){
  const[tid,setL]=useState("");
  const[now,setNow]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t)},[]);
  const ts=now.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS+`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    <div style={{borderBottom:`1px solid ${B.border}`,padding:"8px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <Code>{nd()} · {ts} · CABA · 34.61° S</Code>
      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
        <span style={{width:"6px",height:"6px",borderRadius:"50%",background:B.green,display:"inline-block",animation:"pulse 2s infinite"}}/>
        <Code style={{color:B.green}}>EN VIVO</Code>
      </div>
    </div>
    <div style={{borderBottom:`1px solid ${B.border}`,padding:"7px 0",overflow:"hidden"}}>
      <div style={{whiteSpace:"nowrap",animation:"ticker 30s linear infinite",fontSize:"11px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace"}}>
        &nbsp;&nbsp;&nbsp;Sin cera · Sin relleno · Sin atajos · Proyecto ejecutivo · Documentación técnica · Coordinación interdisciplinaria · Arquitectura institucional · BIM aplicado · ISO 19650 · 14 años de oficio · +10.000 m² desarrollados · Sin cera · Sin relleno · Sin atajos · Proyecto ejecutivo · Documentación técnica · Coordinación interdisciplinaria ·
      </div>
    </div>
    <div style={{borderBottom:`1px solid ${B.border}`,padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center",height:"48px"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <span style={{fontSize:"18px",fontWeight:"800",letterSpacing:"2px",fontFamily:"'IBM Plex Mono',monospace",color:B.text}}>SC</span>
        <span style={{color:B.text3,fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px"}}>· Studio</span>
      </div>
      <button onClick={()=>go("dash")} style={{background:"none",border:`1px solid ${B.border}`,color:B.text2,padding:"6px 14px",borderRadius:"2px",cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.5px"}}>ACCESO INTERNO →</button>
    </div>
    <div style={{padding:"80px 20px 60px",maxWidth:"800px",margin:"0 auto"}}>
      <Code style={{display:"block",marginBottom:"16px"}}>§ OT · Portal Operativo</Code>
      <h1 style={{fontSize:"clamp(32px,6vw,58px)",fontWeight:"300",lineHeight:1.1,margin:"0 0 4px",color:B.text,letterSpacing:"-0.5px"}}>Pedidos técnicos.</h1>
      <h1 style={{fontSize:"clamp(32px,6vw,58px)",fontWeight:"700",lineHeight:1.1,margin:"0 0 32px",color:B.text,letterSpacing:"-0.5px"}}>Sin intermediarios.</h1>
      <p style={{color:B.text2,fontSize:"15px",lineHeight:1.8,maxWidth:"480px",marginBottom:"56px"}}>Enviá tu solicitud técnica, seguí el estado en tiempo real y recibí la documentación cuando esté lista. Sin atajos.</p>
      <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"64px"}}>
        <button onClick={()=>go("form")} style={{background:B.text,color:B.bg,border:`1px solid ${B.text}`,padding:"14px 28px",borderRadius:"2px",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"'IBM Plex Sans',system-ui"}}>+ Enviar pedido</button>
        <button onClick={()=>go("track")} style={{background:"transparent",color:B.text2,border:`1px solid ${B.border}`,padding:"14px 28px",borderRadius:"2px",fontSize:"13px",cursor:"pointer",fontFamily:"'IBM Plex Sans',system-ui"}}>Seguir pedido →</button>
      </div>
      <div style={{borderTop:`1px solid ${B.border}`,paddingTop:"32px"}}>
        <Code style={{display:"block",marginBottom:"10px"}}>SEGUIMIENTO RÁPIDO</Code>
        <div style={{display:"flex",gap:"8px",maxWidth:"420px"}}>
          <input value={tid} onChange={e=>setL(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==="Enter"&&tid){setTid(tid);go("track")}}} placeholder="SC-26-XXX" style={{...S.input,flex:1,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"2px",fontSize:"13px"}}/>
          <button onClick={()=>{if(tid){setTid(tid);go("track")}}} style={{background:B.gold,color:B.bg,border:"none",padding:"11px 20px",borderRadius:"2px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:"700"}}>→</button>
        </div>
      </div>
    </div>
    <div style={{borderTop:`1px solid ${B.border}`,padding:"20px",display:"flex",justifyContent:"space-between"}}>
      <Code>SC · 2026 · CABA, Argentina</Code>
      <Code style={{color:B.text3}}>semcerastudio.com</Code>
    </div>
  </div>
}

function Form({go,onNew}){
  const[step,setStep]=useState(1);
  const[f,setF]=useState({client:"",project:"",name:"",email:"",taskType:"",desc:"",urgency:"normal",deadline:"",files:""});
  const[done,setDone]=useState(null);
  const[busy,setBusy]=useState(false);
  const[selFiles,setSelFiles]=useState([]);
  const u=k=>v=>setF(p=>({...p,[k]:v}));
  const ok1=f.client&&f.name,ok2=f.taskType&&f.desc;
  async function submit(){
    setBusy(true);
    const id=await uid();
    let driveFiles=[];
    if(selFiles.length>0){
      try{
        const fdata=new FormData();
        selFiles.forEach(file=>fdata.append("files",file));
        fdata.append("orderId",id);
        if(f.project)fdata.append("project",f.project);
        const resp=await fetch("/api/upload",{method:"POST",body:fdata});
        if(resp.ok){const d=await resp.json();driveFiles=d.files||[];}
      }catch(e){console.error("Upload error:",e);}
    }
    const r={id,...f,driveFiles,status:"pendiente",priority:f.urgency,assignee:null,internalNotes:"",responsable:"",corrections:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),deliveredAt:null};
    await onNew(r);
    setDone(id);
    setBusy(false);
  }
  const STEPS=["Identificación","Pedido","Confirmar"];
  if(done)return<div style={{minHeight:"100vh",background:B.bg,color:B.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <div style={{maxWidth:"480px",width:"100%"}}>
      <Code style={{display:"block",textAlign:"center",marginBottom:"32px"}}>§ OT · PEDIDO REGISTRADO</Code>
      <div style={{...S.card,textAlign:"center",padding:"48px 32px"}}>
        <div style={{fontSize:"10px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"12px"}}>NÚMERO DE PEDIDO</div>
        <div style={{fontSize:"36px",fontWeight:"700",color:B.gold,letterSpacing:"4px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"8px"}}>{done}</div>
        <HR/>
        <p style={{color:B.text2,fontSize:"13px",lineHeight:1.8,margin:"24px 0"}}>Tu solicitud fue recibida. Guardá este número para hacer seguimiento.</p>
        <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
          <Btn onClick={()=>go("home")} variant="ghost">← Inicio</Btn>
          <Btn onClick={()=>go("track")} variant="gold">Ver estado →</Btn>
        </div>
      </div>
    </div>
  </div>
  return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <Bar left={<div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <button onClick={()=>go("home")} style={{background:"none",border:"none",color:B.text2,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"16px"}}>←</button>
      <div><div style={{fontSize:"13px",fontWeight:"600"}}>Nuevo pedido técnico</div><Code style={{fontSize:"10px"}}>SemCera Studio</Code></div>
    </div>}/>
    <div style={{borderBottom:`1px solid ${B.border}`,padding:"0 20px",display:"flex"}}>
      {STEPS.map((s,i)=><div key={s} style={{padding:"12px 20px",borderBottom:`2px solid ${i+1<=step?B.gold:"transparent"}`,display:"flex",alignItems:"center",gap:"8px"}}>
        <span style={{width:"18px",height:"18px",borderRadius:"1px",background:i+1<=step?B.gold:B.bg3,color:i+1<=step?B.bg:B.text3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",fontFamily:"'IBM Plex Mono',monospace",flexShrink:0}}>{i+1}</span>
        <span style={{fontSize:"11px",color:i+1<=step?B.text:B.text3,fontFamily:"'IBM Plex Mono',monospace"}}>{s.toUpperCase()}</span>
      </div>)}
    </div>
    <div style={{maxWidth:"560px",margin:"0 auto",padding:"32px 20px"}}>
      {step===1&&<div>
        <div style={{marginBottom:"28px"}}><Code>§ 01 · Identificación</Code><div style={{marginTop:"8px",fontSize:"22px",fontWeight:"600"}}>¿Quién hace el pedido?</div></div>
        <div style={S.card}>
          <Field label="Empresa" value={f.client} onChange={u("client")} required opts={["LX Argentina","LXM UT"]}/>
          <Field label="Nombre del proyecto" value={f.project} onChange={u("project")} placeholder="Nombre del proyecto"/>
          <Field label="Nombre y apellido" value={f.name} onChange={u("name")} placeholder="Nombre completo" required/>
          <Field label="Email de contacto" value={f.email} onChange={u("email")} type="email" placeholder="email@empresa.com"/>
          <Btn onClick={()=>setStep(2)} disabled={!ok1} full size="lg">Continuar →</Btn>
        </div>
      </div>}
      {step===2&&<div>
        <div style={{marginBottom:"28px"}}><Code>§ 02 · Pedido</Code><div style={{marginTop:"8px",fontSize:"22px",fontWeight:"600"}}>¿Qué necesitás?</div></div>
        <div style={S.card}>
          <Field label="Tipo de tarea" value={f.taskType} onChange={u("taskType")} required opts={f.client?TYPES[f.client]:[]}/>
          <Field label="Descripción del pedido" value={f.desc} onChange={u("desc")} type="textarea" placeholder="Describí con el mayor detalle posible. Sin atajos." required rows={5}/>
          <Field label="Urgencia" value={f.urgency} onChange={u("urgency")} opts={[{v:"urgente",l:"● Urgente — hoy"},{v:"alta",l:"● Alta — 24 hs"},{v:"normal",l:"● Normal — 2 a 3 días"},{v:"baja",l:"● Baja — cuando puedan"}]}/>
          <Field label="Fecha límite" value={f.deadline} onChange={u("deadline")} type="date"/>
          <Field label="Archivos / referencias" value={f.files} onChange={u("files")} type="textarea" rows={2} placeholder="Links de Drive, fotos, nombre de archivos..."/>
          <div style={{marginBottom:"20px"}}>
            <label style={S.label}>Adjuntar archivos</label>
            <input type="file" multiple onChange={e=>setSelFiles(Array.from(e.target.files))} style={{...S.input,cursor:"pointer",paddingTop:"8px"}}/>
            {selFiles.length>0&&<div style={{marginTop:"6px",fontSize:"10px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace"}}>{selFiles.length} archivo(s) listo(s) para subir a Drive</div>}
          </div>
          <div style={{display:"flex",gap:"10px"}}><Btn onClick={()=>setStep(1)} variant="ghost" style={{flex:1}}>← Atrás</Btn><Btn onClick={()=>setStep(3)} disabled={!ok2} style={{flex:2}}>Continuar →</Btn></div>
        </div>
      </div>}
      {step===3&&<div>
        <div style={{marginBottom:"28px"}}><Code>§ 03 · Confirmar</Code><div style={{marginTop:"8px",fontSize:"22px",fontWeight:"600"}}>Revisá y confirmá</div></div>
        <div style={S.card}>
          {[["EMPRESA",f.client],["PROYECTO",f.project||"—"],["CONTACTO",f.name],["TAREA",f.taskType],["URGENCIA",PRIO[f.urgency]?.l],["DEADLINE",f.deadline?fd(f.deadline):"—"]].map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${B.border}`,fontSize:"13px"}}><span style={{color:B.text3,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",letterSpacing:"1px"}}>{k}</span><span style={{color:B.text,fontWeight:"500"}}>{v||"—"}</span></div>)}
          {selFiles.length>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:`1px solid ${B.border}`,fontSize:"13px"}}><span style={{color:B.text3,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",letterSpacing:"1px"}}>ARCHIVOS</span><span style={{color:B.text,fontWeight:"500"}}>{selFiles.length} adjunto(s)</span></div>}
          <div style={{padding:"14px 0"}}><div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"6px"}}>DESCRIPCIÓN</div><div style={{color:B.text2,fontSize:"13px",lineHeight:1.7}}>{f.desc}</div></div>
          <div style={{display:"flex",gap:"10px",marginTop:"8px"}}><Btn onClick={()=>setStep(2)} variant="ghost" style={{flex:1}}>← Atrás</Btn><Btn onClick={submit} disabled={busy||!ok1||!ok2} style={{flex:2}}>{busy?(selFiles.length>0?"Subiendo archivos...":"Enviando..."):"Enviar pedido ✓"}</Btn></div>
        </div>
      </div>}
    </div>
  </div>
}

function Track({go,reqs,initId}){
  const[sid,setSid]=useState(initId||"");
  const[res,setRes]=useState(null);
  const[searched,setSearched]=useState(false);
  const[authed,setAuthed]=useState(false);
  const[pw,setPw]=useState("");
  const[pwErr,setPwErr]=useState(false);
  const[sel,setSel]=useState(null);
  useEffect(()=>{if(initId){const f=reqs.find(r=>r.id===initId);setRes(f||null);setSearched(true)}},[initId,reqs]);
  function search(){const f=reqs.find(r=>r.id===sid.trim().toUpperCase());setRes(f||null);setSearched(true)}
  function tryAuth(){if(pw.trim()==="semcera2026"){setAuthed(true);setPwErr(false)}else{setPwErr(true);setPw("")}}
  const SK=["pendiente","en_ejecucion","para_revisar","aprobado","entregado","cerrado"];
  const SL=["Recibido","En proceso","Revisión","Aprobado","Entregado","Cerrado"];
  if(!initId&&!authed)return<div style={{minHeight:"100vh",background:B.bg,color:B.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <div style={{maxWidth:"320px",width:"100%"}}>
      <div style={{textAlign:"center",marginBottom:"32px"}}><Code style={{display:"block",fontSize:"10px",letterSpacing:"2px",marginBottom:"8px"}}>SC · SEGUIMIENTO</Code><div style={{fontSize:"20px",fontWeight:"600"}}>Acceso al panel</div></div>
      <div style={S.card}>
        <label style={S.label}>Contraseña</label>
        <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(false)}} onKeyDown={e=>e.key==="Enter"&&tryAuth()} placeholder="········" style={{...S.input,textAlign:"center",letterSpacing:"4px",fontSize:"16px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"6px",borderColor:pwErr?B.red:B.border}}/>
        {pwErr?<div style={{color:B.red,fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"12px",textAlign:"center"}}>Contraseña incorrecta.</div>:<div style={{height:"23px",marginBottom:"12px"}}/>}
        <Btn onClick={tryAuth} full size="lg">Ingresar →</Btn>
      </div>
      <button onClick={()=>go("home")} style={{display:"block",margin:"16px auto 0",background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>← VOLVER</button>
    </div>
  </div>
  if(!initId&&authed&&sel){const o=sel;return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <Bar left={<div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:B.text2,cursor:"pointer",fontSize:"16px",fontFamily:"'IBM Plex Mono',monospace"}}>←</button>
      <div><div style={{fontSize:"13px",fontWeight:"600"}}>Detalle del pedido</div><Code style={{fontSize:"10px"}}>SC · Portal Operativo</Code></div>
    </div>}/>
    <div style={{maxWidth:"560px",margin:"0 auto",padding:"32px 20px"}}>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px",flexWrap:"wrap",gap:"8px"}}>
          <div><Code style={{fontSize:"18px",letterSpacing:"3px",display:"block",marginBottom:"4px"}}>{o.id}</Code><div style={{fontSize:"11px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace"}}>R · {fd(o.createdAt)}</div></div>
          <ST s={o.status}/>
        </div>
        <div style={{marginBottom:"28px"}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:"8px"}}>
            {SK.map((s,i)=>{const cur=SK.indexOf(o.status),done=i<=cur;return<div key={s} style={{display:"flex",alignItems:"center",flex:i<SK.length-1?1:"auto"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"1px",background:done?B.gold:B.bg3,border:done?`1px solid ${B.gold}`:`1px solid ${B.border}`,flexShrink:0,transition:"all 0.4s"}}/>
              {i<SK.length-1&&<div style={{flex:1,height:"1px",background:i<cur?B.gold:B.border,transition:"all 0.4s"}}/>}
            </div>})}
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {SL.map((l,i)=>{const cur=SK.indexOf(o.status);return<div key={l} style={{fontSize:"9px",color:i<=cur?B.gold:B.text3,fontFamily:"'IBM Plex Mono',monospace",textAlign:"center",width:"50px"}}>{l}</div>})}
          </div>
        </div>
        <HR/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0"}}>
          {[["CLIENTE",o.client],["TAREA",o.taskType],["URGENCIA",PRIO[o.priority]?.l],["DEADLINE",fd(o.deadline)]].map(([k,v])=><div key={k} style={{padding:"14px 0",borderBottom:`1px solid ${B.border}`,paddingRight:"16px"}}>
            <div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"4px"}}>{k}</div>
            <div style={{fontSize:"13px",color:B.text,fontWeight:"500"}}>{v||"—"}</div>
          </div>)}
        </div>
        <div style={{padding:"16px 0 0"}}><div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"6px"}}>DESCRIPCIÓN</div><div style={{color:B.text2,fontSize:"13px",lineHeight:1.7}}>{o.desc}</div></div>
        {o.driveFiles&&o.driveFiles.length>0&&<div style={{padding:"16px 0 0"}}>
          <div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"8px"}}>ARCHIVOS ADJUNTOS</div>
          {o.driveFiles.map((df,i)=>df.driveLink
            ?<a key={df.driveLink} href={df.driveLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:"6px",color:B.blue,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"5px",textDecoration:"none"}}><span style={{fontSize:"9px"}}>◆</span>{df.name}</a>
            :<div key={df.name||i} style={{display:"flex",alignItems:"center",gap:"6px",color:B.text2,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"5px"}}><span style={{fontSize:"9px",color:B.text3}}>◆</span>{df.name}</div>
          )}
        </div>}
        {o.status==="entregado"&&<div style={{marginTop:"20px",padding:"16px",background:B.bg2,border:`1px solid ${B.green}`,borderRadius:"2px",display:"flex",gap:"12px",alignItems:"center"}}>
          <span style={{color:B.green,fontSize:"18px"}}>◆</span>
          <div><div style={{fontWeight:"700",color:B.green,fontSize:"13px"}}>Pedido entregado</div><div style={{fontSize:"12px",color:B.text2}}>Revisá tu correo para los archivos finales.</div></div>
        </div>}
      </div>
    </div>
  </div>}
  if(!initId&&authed)return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <Bar left={<div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <button onClick={()=>go("home")} style={{background:"none",border:"none",color:B.text2,cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"16px"}}>←</button>
      <div><div style={{fontSize:"13px",fontWeight:"600"}}>Panel de seguimiento</div><Code style={{fontSize:"10px"}}>SC · Portal Operativo</Code></div>
    </div>}/>
    <div style={{padding:"20px",maxWidth:"900px",margin:"0 auto"}}>
      <Code style={{display:"block",marginBottom:"20px"}}>§ ST · Todos los pedidos · {reqs.length} registrados</Code>
      {!reqs.length?<div style={{...S.card,textAlign:"center",padding:"56px"}}><Code>Sin pedidos registrados</Code></div>
      :<div style={{border:`1px solid ${B.border}`,borderRadius:"2px",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"140px 1fr 160px 110px",background:B.bg2,borderBottom:`1px solid ${B.border}`,padding:"10px 16px",gap:"16px"}}>
          {["N° PEDIDO","PROYECTO","ESTADO","FECHA"].map(h=><div key={h} style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1.5px"}}>{h}</div>)}
        </div>
        {[...reqs].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map((r,i)=><div key={r.id} onClick={()=>setSel(r)} style={{display:"grid",gridTemplateColumns:"140px 1fr 160px 110px",padding:"12px 16px",gap:"16px",background:i%2===0?B.bg1:B.bg,borderBottom:`1px solid ${B.border}`,alignItems:"center",cursor:"pointer"}}>
          <Code style={{fontSize:"11px"}}>{r.id}</Code>
          <div style={{fontSize:"13px",color:r.project?B.text:B.text3,fontWeight:r.project?"500":"400"}}>{r.project||"—"}</div>
          <ST s={r.status}/>
          <Code style={{fontSize:"10px",color:B.text3}}>{fd(r.createdAt)}</Code>
        </div>)}
      </div>}
    </div>
  </div>
  return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <Bar left={<div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <button onClick={()=>go("home")} style={{background:"none",border:"none",color:B.text2,cursor:"pointer",fontSize:"16px",fontFamily:"'IBM Plex Mono',monospace"}}>←</button>
      <div><div style={{fontSize:"13px",fontWeight:"600"}}>Seguimiento de pedido</div><Code style={{fontSize:"10px"}}>SC · Portal Operativo</Code></div>
    </div>}/>
    <div style={{maxWidth:"560px",margin:"0 auto",padding:"32px 20px"}}>
      <Code style={{display:"block",marginBottom:"28px"}}>§ ST · Estado del pedido</Code>
      <div style={{...S.card,marginBottom:"16px"}}>
        <div style={{display:"flex",gap:"8px"}}>
          <input value={sid} onChange={e=>setSid(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="SC-26-XXX" style={{...S.input,flex:1,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"2px",fontSize:"15px",fontWeight:"600"}}/>
          <button onClick={search} style={{background:B.gold,color:B.bg,border:"none",padding:"11px 20px",borderRadius:"2px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontWeight:"700",fontSize:"14px"}}>→</button>
        </div>
      </div>
      {searched&&!res&&<div style={{...S.card,textAlign:"center",padding:"48px"}}><Code style={{fontSize:"12px",display:"block",marginBottom:"12px"}}>404 · NO ENCONTRADO</Code><p style={{color:B.text2,fontSize:"13px"}}>Verificá el número e intentá de nuevo.</p></div>}
      {res&&<div style={S.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px",flexWrap:"wrap",gap:"8px"}}>
          <div><Code style={{fontSize:"18px",letterSpacing:"3px",display:"block",marginBottom:"4px"}}>{res.id}</Code><div style={{fontSize:"11px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace"}}>R · {fd(res.createdAt)}</div></div>
          <ST s={res.status}/>
        </div>
        <div style={{marginBottom:"28px"}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:"8px"}}>
            {SK.map((s,i)=>{const cur=SK.indexOf(res.status),done=i<=cur;return<div key={s} style={{display:"flex",alignItems:"center",flex:i<SK.length-1?1:"auto"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"1px",background:done?B.gold:B.bg3,border:done?`1px solid ${B.gold}`:`1px solid ${B.border}`,flexShrink:0,transition:"all 0.4s"}}/>
              {i<SK.length-1&&<div style={{flex:1,height:"1px",background:i<cur?B.gold:B.border,transition:"all 0.4s"}}/>}
            </div>})}
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {SL.map((l,i)=>{const cur=SK.indexOf(res.status);return<div key={l} style={{fontSize:"9px",color:i<=cur?B.gold:B.text3,fontFamily:"'IBM Plex Mono',monospace",textAlign:"center",width:"50px"}}>{l}</div>})}
          </div>
        </div>
        <HR/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0"}}>
          {[["CLIENTE",res.client],["TAREA",res.taskType],["URGENCIA",PRIO[res.priority]?.l],["DEADLINE",fd(res.deadline)]].map(([k,v])=><div key={k} style={{padding:"14px 0",borderBottom:`1px solid ${B.border}`,paddingRight:"16px"}}>
            <div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"4px"}}>{k}</div>
            <div style={{fontSize:"13px",color:B.text,fontWeight:"500"}}>{v||"—"}</div>
          </div>)}
        </div>
        <div style={{padding:"16px 0 0"}}><div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"6px"}}>DESCRIPCIÓN</div><div style={{color:B.text2,fontSize:"13px",lineHeight:1.7}}>{res.desc}</div></div>
        {res.driveFiles&&res.driveFiles.length>0&&<div style={{padding:"16px 0 0"}}>
          <div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"8px"}}>ARCHIVOS ADJUNTOS</div>
          {res.driveFiles.map((df,i)=>df.driveLink
            ?<a key={df.driveLink} href={df.driveLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:"6px",color:B.blue,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"5px",textDecoration:"none"}}><span style={{fontSize:"9px"}}>◆</span>{df.name}</a>
            :<div key={df.name||i} style={{display:"flex",alignItems:"center",gap:"6px",color:B.text2,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"5px"}}><span style={{fontSize:"9px",color:B.text3}}>◆</span>{df.name}</div>
          )}
        </div>}
        {res.status==="entregado"&&<div style={{marginTop:"20px",padding:"16px",background:B.bg2,border:`1px solid ${B.green}`,borderRadius:"2px",display:"flex",gap:"12px",alignItems:"center"}}>
          <span style={{color:B.green,fontSize:"18px"}}>◆</span>
          <div><div style={{fontWeight:"700",color:B.green,fontSize:"13px"}}>Pedido entregado</div><div style={{fontSize:"12px",color:B.text2}}>Revisá tu correo para los archivos finales.</div></div>
        </div>}
      </div>}
    </div>
  </div>
}

function Modal({req,onClose,onUpd}){
  const[notes,setNotes]=useState(req.internalNotes||"");
  const[responsable,setResponsable]=useState(req.responsable||"");
  const[saving,setSaving]=useState(false);
  const nexts=FLOW[req.status]||[];
  async function save(extra={}){setSaving(true);await onUpd(req.id,{internalNotes:notes,responsable,...extra});setSaving(false)}
  return<div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'IBM Plex Sans',system-ui"}}>
    <div style={{background:B.bg1,border:`1px solid ${B.border}`,borderRadius:"2px 2px 0 0",width:"100%",maxWidth:"620px",maxHeight:"92vh",overflowY:"auto",padding:"28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"24px"}}>
        <div><Code style={{display:"block",marginBottom:"4px"}}>{req.id} · R-{fd(req.createdAt)}</Code><div style={{fontWeight:"700",color:B.text,fontSize:"18px",lineHeight:1.2}}>{req.taskType}</div><div style={{color:B.text3,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace"}}>{req.client} · {req.name}</div></div>
        <button onClick={onClose} style={{background:"none",border:`1px solid ${B.border}`,color:B.text2,width:"32px",height:"32px",borderRadius:"2px",cursor:"pointer",fontSize:"14px"}}>✕</button>
      </div>
      <div style={{display:"flex",gap:"16px",marginBottom:"20px",flexWrap:"wrap"}}><ST s={req.status}/><PT p={req.priority}/>{req.assignee&&<Code>{req.assignee==="cadista"?"Cadista":"Arquitecto"}</Code>}</div>
      <div style={{background:B.bg2,border:`1px solid ${B.border}`,borderRadius:"2px",padding:"14px",marginBottom:"16px",fontSize:"13px",color:B.text2,lineHeight:1.7}}>{req.desc}</div>
      {req.files&&<div style={{padding:"12px 14px",background:B.bg2,border:`1px solid ${B.border2}`,borderLeft:`2px solid ${B.amber}`,marginBottom:"16px",fontSize:"12px",color:B.text2,fontFamily:"'IBM Plex Mono',monospace"}}>{req.files}</div>}
      {req.driveFiles&&req.driveFiles.length>0&&<div style={{padding:"12px 14px",background:B.bg2,border:`1px solid ${B.border}`,borderRadius:"2px",marginBottom:"16px"}}>
        <div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginBottom:"8px"}}>ARCHIVOS ADJUNTOS</div>
        {req.driveFiles.map((df,i)=>df.driveLink
          ?<a key={df.driveLink} href={df.driveLink} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:"6px",color:B.blue,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"5px",textDecoration:"none"}}><span style={{fontSize:"9px"}}>◆</span>{df.name}</a>
          :<div key={df.name||i} style={{display:"flex",alignItems:"center",gap:"6px",color:B.text2,fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"5px"}}><span style={{fontSize:"9px",color:B.text3}}>◆</span>{df.name}</div>
        )}
      </div>}
      <div style={{marginBottom:"16px"}}><label style={S.label}>Asignar a</label><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {[null,"cadista","arquitecto"].map(a=><button key={String(a)} onClick={()=>save({assignee:a})} style={{padding:"7px 16px",borderRadius:"2px",border:"1px solid",borderColor:req.assignee===a?B.gold:B.border,background:"transparent",color:req.assignee===a?B.gold:B.text3,cursor:"pointer",fontSize:"11px",fontWeight:"600",fontFamily:"'IBM Plex Mono',monospace"}}>{a===null?"—":a==="cadista"?"CADISTA":"ARQUITECTO"}</button>)}
      </div></div>
      <div style={{marginBottom:"16px"}}><label style={S.label}>Responsable</label><input value={responsable} onChange={e=>setResponsable(e.target.value)} placeholder="Nombre de quien lleva el pedido" style={S.input}/></div>
      <div style={{marginBottom:"16px"}}><label style={S.label}>Prioridad</label><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {Object.entries(PRIO).map(([p,cfg])=><button key={p} onClick={()=>save({priority:p})} style={{padding:"7px 16px",borderRadius:"2px",border:"1px solid",borderColor:req.priority===p?cfg.c:B.border,background:"transparent",color:req.priority===p?cfg.c:B.text3,cursor:"pointer",fontSize:"11px",fontWeight:"600",fontFamily:"'IBM Plex Mono',monospace"}}>{cfg.l.toUpperCase()}</button>)}
      </div></div>
      <div style={{marginBottom:"16px"}}><label style={S.label}>Notas internas / briefing</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Observaciones, correcciones, instrucciones al equipo..." style={{...S.input,resize:"vertical"}}/></div>
      {nexts.length>0&&<div style={{marginBottom:"16px"}}><label style={S.label}>Avanzar estado</label><div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
        {nexts.map(s=>{const cfg=STATUS[s];return<button key={s} onClick={()=>save({status:s,corrections:s==="en_correccion"?(req.corrections||0)+1:req.corrections,deliveredAt:s==="entregado"?new Date().toISOString():req.deliveredAt})} style={{padding:"9px 18px",borderRadius:"2px",border:`1px solid ${cfg.dot}`,background:"transparent",color:cfg.dot,cursor:"pointer",fontWeight:"700",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>→ {cfg.l.toUpperCase()}</button>})}
      </div></div>}
      <Btn onClick={()=>save()} disabled={saving} full size="lg">{saving?"Guardando...":"Guardar notas ✓"}</Btn>
    </div>
  </div>
}

function Dash({go,reqs,setReqs}){
  const[pin,setPin]=useState("");
  const[auth,setAuth]=useState(false);
  const[pinErr,setPinErr]=useState(false);
  const[view,setView]=useState("board");
  const[sel,setSel]=useState(null);
  const[cf,setCf]=useState("all");
  const[archiveState,setArchiveState]=useState(null);
  const[histSheets,setHistSheets]=useState([]);
  const[selHist,setSelHist]=useState(null);
  const[histOrders,setHistOrders]=useState([]);
  const[histLoading,setHistLoading]=useState(false);
  useEffect(()=>{
    if(auth&&view==='historial'){
      fetch('/api/archive?action=list').then(r=>r.ok?r.json():{sheets:[]}).then(d=>setHistSheets(d.sheets||[])).catch(()=>{});
    }
  },[view,auth]);
  useEffect(()=>{
    if(!selHist){setHistOrders([]);return;}
    setHistLoading(true);
    fetch(`/api/archive?action=read&sheet=${encodeURIComponent(selHist)}`).then(r=>r.ok?r.json():{orders:[]}).then(d=>{setHistOrders(d.orders||[]);setHistLoading(false);}).catch(()=>setHistLoading(false));
  },[selHist]);
  function tryLogin(){if(pin.trim()===PIN){setAuth(true);setPinErr(false)}else{setPinErr(true);setPin("")}}
  if(!auth)return<div style={{minHeight:"100vh",background:B.bg,color:B.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <div style={{maxWidth:"320px",width:"100%"}}>
      <div style={{textAlign:"center",marginBottom:"32px"}}><div style={{fontSize:"28px",fontWeight:"700",letterSpacing:"4px",fontFamily:"'IBM Plex Mono',monospace",color:B.text,marginBottom:"4px"}}>SEMCERA</div><Code style={{fontSize:"10px",letterSpacing:"2px"}}>ACCESO INTERNO · DASHBOARD</Code></div>
      <div style={S.card}>
        <label style={S.label}>PIN de acceso</label>
        <input type="text" value={pin} onChange={e=>{setPin(e.target.value);setPinErr(false)}} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="SEM2026" style={{...S.input,textAlign:"center",letterSpacing:"6px",fontSize:"16px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"6px",borderColor:pinErr?B.red:B.border}}/>
        {pinErr?<div style={{color:B.red,fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",marginBottom:"12px",textAlign:"center"}}>PIN incorrecto.</div>:<div style={{height:"23px",marginBottom:"12px"}}/>}
        <Btn onClick={tryLogin} full size="lg">Ingresar →</Btn>
      </div>
      <button onClick={()=>go("home")} style={{display:"block",margin:"16px auto 0",background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>← VOLVER</button>
    </div>
  </div>
  const list=reqs.filter(r=>cf==="all"||r.client===cf);
  const active=reqs.filter(r=>!["cerrado","entregado"].includes(r.status)).length;
  const urg=reqs.filter(r=>r.priority==="urgente"&&!["cerrado","entregado"].includes(r.status)).length;
  const closed=reqs.filter(r=>r.status==="cerrado").length;
  const onTime=reqs.filter(r=>r.status==="cerrado"&&r.deadline&&r.deliveredAt&&new Date(r.deliveredAt)<=new Date(r.deadline)).length;
  const rate=closed>0?Math.round((onTime/closed)*100):0;
  async function upd(id,ch){
    const updated={...reqs.find(r=>r.id===id),...ch,updatedAt:new Date().toISOString()};
    const u=reqs.map(r=>r.id===id?updated:r);
    setReqs(u);
    persist(u);
    if(sel?.id===id)setSel(p=>({...p,...ch}));
    syncSheet('update',updated);
  }
  function currentMonthYear(){const d=new Date();return`${MES[d.getMonth()]} ${d.getFullYear()}`;}
  async function doArchive(){
    setArchiveState('running');
    try{
      const r=await fetch('/api/archive',{method:'POST'});
      const d=await r.json();
      if(r.ok){
        const r2=await fetch('/api/sheet');
        if(r2.ok){const d2=await r2.json();if(d2.orders){setReqs(d2.orders);persist(d2.orders);}}
        const r3=await fetch('/api/archive?action=list');
        if(r3.ok){const d3=await r3.json();setHistSheets(d3.sheets||[]);}
        setSelHist(null);setHistOrders([]);
        setArchiveState({count:d.archived??0,sheetName:d.sheetName});
      }else{setArchiveState({error:d.error||'Error desconocido'});}
    }catch(e){setArchiveState({error:e.message});}
  }
  const NAVS=[{k:"board",l:"Tablero"},{k:"list",l:"Lista"},{k:"metrics",l:"Métricas"},{k:"historial",l:"Historial"}];
  return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <Bar
      left={<div style={{display:"flex",alignItems:"center",gap:"12px"}}><span style={{fontSize:"16px",fontWeight:"800",letterSpacing:"3px",fontFamily:"'IBM Plex Mono',monospace"}}>SC</span><span style={{color:B.text3,fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px"}}>· Dashboard</span></div>}
      right={<div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        {archiveState&&typeof archiveState==='object'&&archiveState.count!=null
          ?<><Code style={{fontSize:"11px",color:archiveState.count>0?B.green:B.text3}}>{archiveState.count>0?`${archiveState.count} archivados ✓`:'Sin cerrados'}</Code><button onClick={()=>setArchiveState(null)} style={{background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"12px",lineHeight:1}}>✕</button></>
          :archiveState&&typeof archiveState==='object'&&archiveState.error
          ?<><Code style={{fontSize:"11px",color:B.red}}>Error al archivar</Code><button onClick={()=>setArchiveState(null)} style={{background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"12px",lineHeight:1}}>✕</button></>
          :archiveState==='running'
          ?<Code style={{fontSize:"11px",color:B.text3}}>Archivando...</Code>
          :<button onClick={()=>setArchiveState('confirm')} style={{background:"none",border:`1px solid ${B.border}`,color:B.text2,padding:"6px 14px",borderRadius:"2px",cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>ARCHIVAR MES</button>}
        <button onClick={()=>go("team")} style={{background:"none",border:`1px solid ${B.border}`,color:B.text2,padding:"6px 14px",borderRadius:"2px",cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>EQUIPO</button>
        <button onClick={()=>go("home")} style={{background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>SALIR</button>
      </div>}
      sub={NAVS.map(n=><button key={n.k} onClick={()=>setView(n.k)} style={{background:"none",border:"none",color:view===n.k?B.gold:B.text3,padding:"10px 16px 10px 0",cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.5px",borderBottom:`2px solid ${view===n.k?B.gold:"transparent"}`}}>{n.l.toUpperCase()}</button>)}
    />
    <div style={{borderBottom:`1px solid ${B.border}`,padding:"12px 20px",display:"flex",gap:"32px",alignItems:"center",overflowX:"auto"}}>
      {[{l:"ACTIVAS",v:active,c:B.text},{l:"URGENTES",v:urg,c:urg>0?B.red:B.text3},{l:"TOTAL",v:reqs.length,c:B.text3},{l:"EN PLAZO",v:`${rate}%`,c:rate>=85?B.green:B.amber}].map(k=><div key={k.l}><div style={{fontSize:"22px",fontWeight:"700",color:k.c,fontFamily:"'IBM Plex Mono',monospace",lineHeight:1}}>{k.v}</div><div style={{fontSize:"9px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"1px",marginTop:"2px"}}>{k.l}</div></div>)}
      <div style={{marginLeft:"auto"}}><select value={cf} onChange={e=>setCf(e.target.value)} style={{...S.input,width:"auto",fontSize:"11px",padding:"7px 12px",fontFamily:"'IBM Plex Mono',monospace"}}><option value="all">TODOS</option><option value="LX Argentina">LX ARGENTINA</option><option value="LXM UT">LXM UT</option></select></div>
    </div>
    <div style={{padding:"20px",overflowX:"auto"}}>
      {view==="board"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"12px"}}>
        {Object.entries(STATUS).map(([s,cfg])=>{
          const cols=list.filter(r=>r.status===s);
          if(!cols.length&&!["pendiente","en_ejecucion","para_revisar"].includes(s))return null;
          return<div key={s}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px",paddingBottom:"8px",borderBottom:`1px solid ${B.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}><span style={{fontSize:"7px",color:cfg.dot}}>◆</span><Code style={{color:cfg.c,fontSize:"10px"}}>{cfg.l.toUpperCase()}</Code></div>
              <Code style={{color:B.text3}}>{cols.length}</Code>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
              {cols.sort((a,b)=>["urgente","alta","normal","baja"].indexOf(a.priority)-["urgente","alta","normal","baja"].indexOf(b.priority)).map(r=><div key={r.id} onClick={()=>setSel(r)} style={{...S.card,padding:"12px 14px",cursor:"pointer",borderLeft:`2px solid ${cfg.dot}`,transition:"background 0.15s"}}>
                <Code style={{display:"block",marginBottom:"5px",fontSize:"10px",color:B.text3}}>{r.id}</Code>
                <div style={{fontSize:"12px",fontWeight:"600",color:B.text,marginBottom:"4px",lineHeight:1.3}}>{r.taskType}</div>
                {r.project&&<div style={{fontSize:"11px",color:B.text2,marginBottom:"3px"}}>{r.project}</div>}
                {r.responsable&&<div style={{fontSize:"10px",color:B.gold,marginBottom:"3px",fontFamily:"'IBM Plex Mono',monospace"}}>{r.responsable}</div>}
                <div style={{fontSize:"11px",color:B.text3,marginBottom:"8px"}}>{r.client}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><PT p={r.priority}/>{r.deadline&&<Code style={{color:B.text3,fontSize:"10px"}}>{fd(r.deadline)}</Code>}</div>
              </div>)}
            </div>
          </div>
        })}
      </div>}
      {view==="list"&&<div style={{display:"flex",flexDirection:"column",gap:"1px",border:`1px solid ${B.border}`,borderRadius:"2px",overflow:"hidden"}}>
        {!list.length&&<div style={{...S.card,textAlign:"center",color:B.text3,padding:"40px"}}><Code>Sin pedidos registrados</Code></div>}
        {list.map((r,i)=><div key={r.id} onClick={()=>setSel(r)} style={{background:i%2===0?B.bg1:B.bg,padding:"14px 16px",display:"flex",alignItems:"center",gap:"14px",cursor:"pointer",flexWrap:"wrap",borderBottom:`1px solid ${B.border}`}}>
          <Code style={{minWidth:"100px",fontSize:"11px"}}>{r.id}</Code>
          <div style={{flex:1,minWidth:"120px"}}><div style={{fontWeight:"600",color:B.text,fontSize:"13px"}}>{r.taskType}</div>{r.project&&<div style={{fontSize:"11px",color:B.text2}}>{r.project}</div>}<div style={{fontSize:"11px",color:B.text3}}>{r.client} · {r.name}</div></div>
          <PT p={r.priority}/><ST s={r.status}/>
          <Code style={{fontSize:"10px",color:B.text3}}>{fd(r.createdAt)}</Code>
        </div>)}
      </div>}
      {view==="metrics"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"12px"}}>
        <div style={S.card}><Code style={{display:"block",marginBottom:"16px"}}>POR ESTADO</Code>
          {Object.entries(STATUS).map(([s,c])=>{const n=reqs.filter(r=>r.status===s).length,pct=reqs.length>0?(n/reqs.length)*100:0;return<div key={s} style={{marginBottom:"12px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:"4px"}}><span style={{color:B.text2}}>{c.l}</span><span style={{color:B.text,fontFamily:"'IBM Plex Mono',monospace",fontWeight:"600"}}>{n}</span></div><div style={{height:"2px",background:B.bg3,borderRadius:"1px",overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:c.dot}}/></div></div>})}
        </div>
        <div style={S.card}><Code style={{display:"block",marginBottom:"16px"}}>POR CLIENTE</Code>
          {["LX Argentina","LXM UT"].map(cl=>{const n=reqs.filter(r=>r.client===cl).length,pct=reqs.length>0?(n/reqs.length)*100:0;return<div key={cl} style={{marginBottom:"20px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",fontWeight:"600",marginBottom:"6px"}}><span style={{color:B.text2}}>{cl}</span><span style={{color:B.gold,fontFamily:"'IBM Plex Mono',monospace"}}>{n}</span></div><div style={{height:"3px",background:B.bg3,borderRadius:"1px",overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:B.gold}}/></div><div style={{fontSize:"10px",color:B.text3,marginTop:"3px",fontFamily:"'IBM Plex Mono',monospace"}}>{Math.round(pct)}% DEL TOTAL</div></div>})}
        </div>
        <div style={S.card}><Code style={{display:"block",marginBottom:"16px"}}>RESUMEN OPERATIVO</Code>
          {[["TOTAL PEDIDOS",reqs.length],["ACTIVOS",active],["URGENTES ACTIVOS",urg],["CERRADOS",closed],["ENTREGA EN PLAZO",`${rate}%`]].map(([l,v])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${B.border}`}}><span style={{color:B.text3,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",letterSpacing:"1px"}}>{l}</span><span style={{color:B.gold,fontFamily:"'IBM Plex Mono',monospace",fontWeight:"700"}}>{v}</span></div>)}
        </div>
      </div>}
      {view==="historial"&&<div>
        <Code style={{display:"block",marginBottom:"20px"}}>§ HT · Historial de pedidos archivados</Code>
        {!selHist
          ?<div>
            <p style={{fontSize:"13px",color:B.text2,marginBottom:"16px"}}>Seleccioná un período para ver los pedidos archivados.</p>
            {!histSheets.length
              ?<div style={{...S.card,textAlign:"center",padding:"48px"}}><Code style={{display:"block",marginBottom:"8px"}}>Sin historial disponible</Code><p style={{color:B.text2,fontSize:"13px",lineHeight:1.7,margin:0}}>Usá "ARCHIVAR MES" para crear el primer archivo.</p></div>
              :<div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {histSheets.map(name=><button key={name} onClick={()=>setSelHist(name)} style={{...S.card,padding:"16px 20px",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",fontFamily:"'IBM Plex Sans',system-ui",border:`1px solid ${B.border}`}}>
                  <Code style={{fontSize:"13px"}}>{name}</Code>
                  <span style={{color:B.text3,fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>VER →</span>
                </button>)}
              </div>}
          </div>
          :<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <button onClick={()=>{setSelHist(null);setHistOrders([]);}} style={{background:"none",border:"none",color:B.text2,cursor:"pointer",fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",padding:0}}>← VOLVER AL HISTORIAL</button>
              {!histLoading&&histOrders.length>0&&<button onClick={()=>generateMonthlyReport(histOrders,selHist)} style={{background:"none",border:`1px solid ${B.gold}`,color:B.gold,padding:"6px 16px",borderRadius:"2px",cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.5px",fontWeight:"600"}}>INFORME DEL MES ↓</button>}
            </div>
            <Code style={{display:"block",marginBottom:"16px"}}>{selHist} · {histOrders.length} pedidos</Code>
            {histLoading
              ?<div style={{...S.card,textAlign:"center",padding:"48px"}}><Code>Cargando...</Code></div>
              :!histOrders.length
              ?<div style={{...S.card,textAlign:"center",padding:"48px"}}><Code>Sin pedidos en este período</Code></div>
              :<div style={{display:"flex",flexDirection:"column",gap:"1px",border:`1px solid ${B.border}`,borderRadius:"2px",overflow:"hidden"}}>
                {histOrders.map((r,i)=><div key={r.id} style={{background:i%2===0?B.bg1:B.bg,padding:"14px 16px",display:"flex",alignItems:"center",gap:"14px",flexWrap:"wrap",borderBottom:`1px solid ${B.border}`}}>
                  <Code style={{minWidth:"100px",fontSize:"11px"}}>{r.id}</Code>
                  <div style={{flex:1,minWidth:"120px"}}><div style={{fontWeight:"600",color:B.text,fontSize:"13px"}}>{r.taskType}</div>{r.project&&<div style={{fontSize:"11px",color:B.text2}}>{r.project}</div>}<div style={{fontSize:"11px",color:B.text3}}>{r.client} · {r.name}</div></div>
                  <ST s={r.status}/>
                  <Code style={{fontSize:"10px",color:B.text3}}>{fd(r.createdAt)}</Code>
                </div>)}
              </div>}
          </div>}
      </div>}
    </div>
    {sel&&<Modal req={sel} onClose={()=>setSel(null)} onUpd={upd}/>}
    {archiveState==='confirm'&&<div onClick={e=>e.target===e.currentTarget&&setArchiveState(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'IBM Plex Sans',system-ui"}}>
      <div style={{background:B.bg1,border:`1px solid ${B.border}`,borderRadius:"2px",padding:"32px",maxWidth:"400px",width:"100%"}}>
        <Code style={{display:"block",marginBottom:"8px",fontSize:"10px",letterSpacing:"1.5px"}}>§ ARCHIVO MENSUAL</Code>
        <div style={{fontSize:"18px",fontWeight:"600",marginBottom:"12px",color:B.text}}>¿Archivar {currentMonthYear()}?</div>
        <p style={{color:B.text2,fontSize:"13px",lineHeight:1.7,marginBottom:"24px"}}>Se moverán <strong style={{color:B.text}}>{closed} pedido{closed!==1?"s":""} cerrado{closed!==1?"s":""}</strong> a la hoja <strong style={{color:B.gold}}>"Historial - {currentMonthYear()}"</strong>. Los pedidos activos no se tocarán.</p>
        <div style={{display:"flex",gap:"10px"}}>
          <Btn onClick={()=>setArchiveState(null)} variant="ghost" style={{flex:1}}>Cancelar</Btn>
          <Btn onClick={doArchive} disabled={closed===0} style={{flex:2}}>{closed>0?`Archivar ${closed} pedidos →`:"Sin pedidos cerrados"}</Btn>
        </div>
      </div>
    </div>}
  </div>
}

function Team({go,reqs,setReqs}){
  const[role,setRole]=useState(null);
  const TF={pendiente:"en_ejecucion",en_ejecucion:"para_revisar",en_correccion:"para_revisar"};
  async function move(id,s){
    const updated={...reqs.find(r=>r.id===id),status:s,updatedAt:new Date().toISOString()};
    const u=reqs.map(r=>r.id===id?updated:r);
    setReqs(u);
    persist(u);
    syncSheet('update',updated);
  }
  if(!role)return<div style={{minHeight:"100vh",background:B.bg,color:B.text,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <div style={{maxWidth:"340px",width:"100%"}}>
      <div style={{textAlign:"center",marginBottom:"32px"}}><Code style={{display:"block",fontSize:"10px",letterSpacing:"2px",marginBottom:"8px"}}>SC · VISTA DE EQUIPO</Code><div style={{fontSize:"20px",fontWeight:"600"}}>¿Quién sos?</div></div>
      <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
        {[{r:"cadista",l:"Cadista Operativo",s:"LX Argentina"},{r:"arquitecto",l:"Arquitecto Técnico",s:"LXM UT"}].map(({r,l,s})=><button key={r} onClick={()=>setRole(r)} style={{...S.card,padding:"20px",border:`1px solid ${B.border}`,color:B.text,fontWeight:"700",fontSize:"14px",cursor:"pointer",textAlign:"left",borderRadius:"2px"}}>
          {l}<div style={{fontSize:"11px",fontWeight:"400",color:B.text3,marginTop:"3px",fontFamily:"'IBM Plex Mono',monospace"}}>{s}</div>
        </button>)}
      </div>
      <button onClick={()=>go("home")} style={{display:"block",margin:"0 auto",background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>← INICIO</button>
    </div>
  </div>
  const mine=reqs.filter(r=>r.assignee===role&&r.status!=="cerrado");
  return<div style={{minHeight:"100vh",background:B.bg,color:B.text,fontFamily:"'IBM Plex Sans',system-ui"}}>
    <style>{FONTS}</style>
    <Bar left={<div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <button onClick={()=>setRole(null)} style={{background:"none",border:"none",color:B.text2,cursor:"pointer",fontSize:"16px",fontFamily:"'IBM Plex Mono',monospace"}}>←</button>
      <div><div style={{fontSize:"13px",fontWeight:"600"}}>{role==="cadista"?"Cadista Operativo":"Arquitecto Técnico"}</div><Code style={{fontSize:"10px"}}>{role==="cadista"?"LX Argentina":"LXM UT"}</Code></div>
    </div>} right={<button onClick={()=>go("home")} style={{background:"none",border:"none",color:B.text3,cursor:"pointer",fontSize:"11px",fontFamily:"'IBM Plex Mono',monospace"}}>INICIO</button>}/>
    <div style={{padding:"20px",maxWidth:"600px",margin:"0 auto"}}>
      {!mine.length?<div style={{...S.card,textAlign:"center",padding:"56px"}}><Code style={{display:"block",marginBottom:"12px"}}>◆ SIN TAREAS ASIGNADAS</Code><p style={{color:B.text2,fontSize:"13px",lineHeight:1.7}}>Cuando Daniel asigne algo, aparece acá.</p></div>
      :<div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {mine.sort((a,b)=>["urgente","alta","normal","baja"].indexOf(a.priority)-["urgente","alta","normal","baja"].indexOf(b.priority)).map(r=><div key={r.id} style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
            <div><Code style={{display:"block",marginBottom:"3px",fontSize:"10px",color:B.text3}}>{r.id} · {fd(r.createdAt)}</Code><div style={{fontWeight:"700",color:B.text,fontSize:"15px"}}>{r.taskType}</div><div style={{fontSize:"11px",color:B.text3,fontFamily:"'IBM Plex Mono',monospace"}}>{r.client}</div></div>
            <ST s={r.status}/>
          </div>
          <div style={{background:B.bg2,border:`1px solid ${B.border}`,borderRadius:"2px",padding:"12px",fontSize:"13px",color:B.text2,lineHeight:1.7,marginBottom:"10px"}}>{r.desc}</div>
          {r.internalNotes&&<div style={{padding:"12px",background:B.bg2,borderLeft:`2px solid ${B.gold}`,fontSize:"12px",color:B.gold,marginBottom:"10px",fontFamily:"'IBM Plex Mono',monospace"}}>DANIEL · {r.internalNotes}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
            <div style={{display:"flex",gap:"14px",alignItems:"center"}}><PT p={r.priority}/>{r.deadline&&<Code style={{fontSize:"10px",color:B.text3}}>DEADLINE · {fd(r.deadline)}</Code>}</div>
            {TF[r.status]&&<button onClick={()=>move(r.id,TF[r.status])} style={{background:"transparent",color:B.gold,border:`1px solid ${B.gold}`,padding:"7px 16px",borderRadius:"2px",cursor:"pointer",fontSize:"11px",fontWeight:"700",fontFamily:"'IBM Plex Mono',monospace"}}>{r.status==="pendiente"?"INICIAR →":"ENVIAR A REVISIÓN →"}</button>}
          </div>
        </div>)}
      </div>}
    </div>
  </div>
}

function syncSheet(action,req){
  fetch('/api/sheet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,req})})
    .then(r=>{if(!r.ok)return r.json().then(d=>console.warn('[SC] sheet sync failed:',d.error))})
    .catch(e=>console.warn('[SC] sheet sync error:',e.message));
}

export default function App(){
  const[page,setPage]=useState("home");
  const[reqs,setReqs]=useState([]);
  const[tid,setTid]=useState("");
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    async function loadOrders(){
      try{
        const r=await fetch('/api/sheet');
        if(r.ok){
          const d=await r.json();
          if(d.orders&&d.orders.length>0){
            setReqs(d.orders);
            persist(d.orders);
            setLoading(false);
            return;
          }
        }
      }catch(e){console.warn('[SC] sheet load error:',e.message);}
      setReqs(load()||[]);
      setLoading(false);
    }
    loadOrders();
  },[]);
  async function addReq(r){
    const u=[r,...reqs];
    setReqs(u);
    persist(u);
    syncSheet('create',r);
  }
  if(loading)return<div style={{minHeight:"100vh",background:B.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}><div style={{color:B.gold,fontWeight:"700",fontSize:"20px",letterSpacing:"4px",fontFamily:"monospace"}}>SC</div><div style={{width:"40px",height:"1px",background:B.border}}/></div>
  return<div style={{fontFamily:"'IBM Plex Sans',system-ui"}}>
    {page==="home"&&<Home go={setPage} setTid={setTid}/>}
    {page==="form"&&<Form go={setPage} onNew={addReq}/>}
    {page==="track"&&<Track go={setPage} reqs={reqs} initId={tid}/>}
    {page==="dash"&&<Dash go={setPage} reqs={reqs} setReqs={setReqs}/>}
    {page==="team"&&<Team go={setPage} reqs={reqs} setReqs={setReqs}/>}
  </div>
}
