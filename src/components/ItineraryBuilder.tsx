"use client";

import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useState, useRef } from "react";
import { Plus, Calendar, MapPin, Clock, Wallet, Star, ChevronDown, ChevronUp, Sparkles, GripVertical, Map, Pencil, Trash2, Check, X, Save } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface Activity {
  id: string; time: string; name: string; type: string;
  duration: string; cost: number; rating?: number; notes?: string; emoji: string;
}
interface Day {
  id: string; day: number; date: string; city: string;
  activities: Activity[]; expanded: boolean;
}

const EMOJIS: Record<string,string> = {
  Cultural:"⛩️",Food:"🍜",Shopping:"🛍️",Art:"🎨",Sightseeing:"🏙️",Nature:"🌳",Transport:"🚇",Other:"📍"
};
const TYPE_COLORS: Record<string,string> = {
  Cultural:"#a855f7",Food:"#f59e0b",Shopping:"#06b6d4",Art:"#ec4899",
  Sightseeing:"#6366f1",Nature:"#22c55e",Transport:"#94a3b8",Other:"#64748b"
};
const TYPES = Object.keys(EMOJIS);

const SEED: Day[] = [
  { id:"d1", day:1, date:"2024-04-01", city:"Tokyo", expanded:true, activities:[
    {id:"a1",time:"09:00",name:"Senso-ji Temple",type:"Cultural",duration:"2h",cost:0,rating:4.9,emoji:"⛩️"},
    {id:"a2",time:"12:00",name:"Tsukiji Market",type:"Food",duration:"2h",cost:2000,rating:4.7,emoji:"🍜"},
    {id:"a3",time:"15:00",name:"teamLab Planets",type:"Art",duration:"3h",cost:4500,rating:5.0,emoji:"🎨"},
  ]},
  { id:"d2", day:2, date:"2024-04-02", city:"Kyoto", expanded:false, activities:[
    {id:"a4",time:"06:30",name:"Arashiyama Bamboo Grove",type:"Nature",duration:"2h",cost:0,rating:4.9,emoji:"🎋"},
    {id:"a5",time:"10:00",name:"Fushimi Inari Shrine",type:"Cultural",duration:"3h",cost:0,rating:5.0,emoji:"⛩️"},
  ]},
];

// ── Inline editable text ──────────────────────────────────
function InlineEdit({ value, onSave, style, multiline }: { value:string; onSave:(v:string)=>void; style?:React.CSSProperties; multiline?:boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const commit = () => { setEditing(false); if (val.trim()) onSave(val.trim()); else setVal(value); };
  if (editing) {
    const props = { value:val, onChange:(e:any)=>setVal(e.target.value), onBlur:commit, autoFocus:true, onKeyDown:(e:any)=>{ if(e.key==="Enter"&&!multiline) commit(); if(e.key==="Escape"){setVal(value);setEditing(false);} }, style:{...style, background:"var(--bg-primary)", border:"1px solid var(--brand-primary)", borderRadius:"6px", padding:"2px 8px", outline:"none", color:"var(--text-primary)", width:"100%", fontFamily:"inherit" } };
    return multiline ? <textarea {...props} rows={2} style={{...props.style, resize:"none"}} /> : <input {...props} />;
  }
  return (
    <span onClick={()=>setEditing(true)} title="Click to edit"
      style={{ cursor:"text", borderBottom:"1px dashed transparent", ...style, display:"inline-flex", alignItems:"center", gap:"4px" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderBottomColor="var(--brand-primary)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderBottomColor="transparent";}}>
      {value} <Pencil size={10} style={{opacity:0.4,flexShrink:0}} />
    </span>
  );
}

// ── Add Activity Modal ────────────────────────────────────
function AddActivityModal({ dayId, onAdd, onClose }: { dayId:string; onAdd:(a:Activity)=>void; onClose:()=>void }) {
  const [form, setForm] = useState({ name:"", time:"10:00", type:"Cultural", duration:"1h", cost:"0", notes:"" });
  const f = (k:string) => (e:any) => setForm(p=>({...p,[k]:e.target.value}));
  const save = () => {
    if (!form.name.trim()) return;
    onAdd({ id:Date.now().toString(), name:form.name.trim(), time:form.time, type:form.type, duration:form.duration, cost:Number(form.cost)||0, notes:form.notes, emoji:EMOJIS[form.type]||"📍" });
    onClose();
  };
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{scale:0.92,y:20}} animate={{scale:1,y:0}} exit={{scale:0.92,y:20}}
        style={{width:"100%",maxWidth:"440px",borderRadius:"20px",background:"var(--bg-card)",border:"1px solid rgba(99,102,241,0.3)",overflow:"hidden"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(135deg,rgba(99,102,241,0.08),transparent)"}}>
          <span style={{fontWeight:800,fontSize:"15px",color:"var(--text-primary)"}}>➕ Add Activity</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex"}}><X size={18}/></button>
        </div>
        <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:"12px"}}>
          <div><label style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)",display:"block",marginBottom:"5px",textTransform:"uppercase"}}>Activity Name *</label>
            <input className="input" value={form.name} onChange={f("name")} placeholder="e.g. Visit Meiji Shrine" autoFocus/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div><label style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)",display:"block",marginBottom:"5px",textTransform:"uppercase"}}>Time</label>
              <input type="time" className="input" value={form.time} onChange={f("time")}/></div>
            <div><label style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)",display:"block",marginBottom:"5px",textTransform:"uppercase"}}>Duration</label>
              <input className="input" value={form.duration} onChange={f("duration")} placeholder="e.g. 2h"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <div><label style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)",display:"block",marginBottom:"5px",textTransform:"uppercase"}}>Category</label>
              <select className="input" value={form.type} onChange={f("type")}>
                {TYPES.map(t=><option key={t} value={t}>{EMOJIS[t]} {t}</option>)}
              </select></div>
            <div><label style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)",display:"block",marginBottom:"5px",textTransform:"uppercase"}}>Cost (₹)</label>
              <input type="number" className="input" value={form.cost} onChange={f("cost")} min={0}/></div>
          </div>
          <div><label style={{fontSize:"11px",fontWeight:600,color:"var(--text-muted)",display:"block",marginBottom:"5px",textTransform:"uppercase"}}>Notes (optional)</label>
            <textarea className="input" value={form.notes} onChange={f("notes")} rows={2} style={{resize:"none"}} placeholder="Add notes…"/></div>
          <div style={{display:"flex",gap:"8px",paddingTop:"4px"}}>
            <button onClick={onClose} className="btn-secondary" style={{flex:1}}>Cancel</button>
            <motion.button whileTap={{scale:0.97}} onClick={save} className="btn-primary"
              style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              <Check size={14}/> Add Activity
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Activity Row ──────────────────────────────────────────
function ActivityRow({ activity, onUpdate, onDelete }: { activity:Activity; onUpdate:(a:Activity)=>void; onDelete:()=>void }) {
  const color = TYPE_COLORS[activity.type] || "#6366f1";
  const upd = (k:keyof Activity) => (v:string) => onUpdate({...activity,[k]:k==="cost"?Number(v):v});
  return (
    <motion.div layout initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}}
      style={{display:"flex",gap:"12px",padding:"14px 16px",borderRadius:"12px",background:"var(--bg-primary)",border:"1px solid var(--border)",position:"relative",alignItems:"flex-start"}}
      whileHover={{borderColor:"rgba(99,102,241,0.3)"}}>
      <GripVertical size={16} color="var(--text-muted)" style={{marginTop:"2px",cursor:"grab",flexShrink:0}}/>
      <div style={{width:"34px",height:"34px",borderRadius:"10px",background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
        {activity.emoji}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",marginBottom:"5px"}}>
          <InlineEdit value={activity.name} onSave={upd("name")} style={{fontWeight:700,fontSize:"14px",color:"var(--text-primary)"}}/>
          <div style={{display:"flex",gap:"8px",alignItems:"center",flexShrink:0}}>
            <InlineEdit value={String(activity.cost)} onSave={upd("cost")}
              style={{fontWeight:700,fontSize:"13px",color:activity.cost===0?"#22c55e":"var(--text-primary)"}}/>
            <motion.button whileTap={{scale:0.85}} onClick={onDelete}
              style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex",padding:"2px"}}>
              <Trash2 size={13}/>
            </motion.button>
          </div>
        </div>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:"12px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"3px"}}>
            <Clock size={10}/>
            <InlineEdit value={activity.time} onSave={upd("time")} style={{fontSize:"12px",color:"var(--text-muted)"}}/>
            · <InlineEdit value={activity.duration} onSave={upd("duration")} style={{fontSize:"12px",color:"var(--text-muted)"}}/>
          </span>
          <span style={{padding:"2px 8px",borderRadius:"10px",background:`${color}15`,color,border:`1px solid ${color}25`,fontSize:"10px",fontWeight:600}}>
            {activity.type}
          </span>
          {activity.rating && <span style={{display:"flex",alignItems:"center",gap:"2px",fontSize:"11px",fontWeight:600}}><Star size={10} fill="gold" color="gold"/>{activity.rating}</span>}
        </div>
        {activity.notes && <div style={{marginTop:"5px",fontSize:"12px",color:"var(--text-muted)",fontStyle:"italic"}}>💬 {activity.notes}</div>}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────
export function ItineraryBuilder() {
  const { success, error: showError } = useToast();
  const [days, setDays] = useState<Day[]>(SEED);
  const [addingTo, setAddingTo] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState(false);

  const mutate = (fn: (prev: Day[]) => Day[]) => { setDays(fn); setUnsaved(true); };

  const toggleDay = (id:string) => setDays(p=>p.map(d=>d.id===id?{...d,expanded:!d.expanded}:d));

  const updateDay = (id:string, patch: Partial<Day>) => mutate(p=>p.map(d=>d.id===id?{...d,...patch}:d));

  const deleteDay = (id:string) => { mutate(p=>p.filter(d=>d.id!==id).map((d,i)=>({...d,day:i+1}))); success("Day removed"); };

  const addActivity = (dayId:string, act:Activity) => { mutate(p=>p.map(d=>d.id===dayId?{...d,activities:[...d.activities,act]}:d)); success(`✅ "${act.name}" added!`); };

  const updateActivity = (dayId:string, act:Activity) => mutate(p=>p.map(d=>d.id===dayId?{...d,activities:d.activities.map(a=>a.id===act.id?act:a)}:d));

  const deleteActivity = (dayId:string, actId:string) => { mutate(p=>p.map(d=>d.id===dayId?{...d,activities:d.activities.filter(a=>a.id!==actId)}:d)); success("Activity removed"); };

  const reorderActivities = (dayId:string, newOrder:Activity[]) => mutate(p=>p.map(d=>d.id===dayId?{...d,activities:newOrder}:d));

  const addDay = () => {
    const last = days[days.length-1];
    const nextDate = last ? new Date(new Date(last.date).getTime()+86400000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    mutate(p=>[...p,{id:Date.now().toString(),day:p.length+1,date:nextDate,city:"New City",activities:[],expanded:true}]);
    success("New day added!");
  };

  const saveAll = async () => {
    setSaving(true);
    await new Promise(r=>setTimeout(r,1200));
    setSaving(false); setUnsaved(false);
    success("✅ Itinerary saved successfully!");
  };

  const aiOptimize = async () => {
    setAiOptimizing(true);
    await new Promise(r=>setTimeout(r,2000));
    setAiOptimizing(false);
    success("✨ AI optimized your schedule!");
  };

  const totalCost = days.flatMap(d=>d.activities).reduce((s,a)=>s+a.cost,0);
  const totalActs = days.flatMap(d=>d.activities).length;
  const uniqueCities = [...new Set(days.map(d=>d.city).filter(c=>c!=="New City"))].length;

  return (
    <div style={{padding:"24px",maxWidth:"900px",margin:"0 auto"}} className="page-enter">
      <AnimatePresence>{addingTo && <AddActivityModal dayId={addingTo} onAdd={a=>addActivity(addingTo,a)} onClose={()=>setAddingTo(null)}/>}</AnimatePresence>

      {/* Header */}
      <div style={{marginBottom:"24px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <h1 style={{fontSize:"26px",fontWeight:900,color:"var(--text-primary)",marginBottom:"4px"}}>
            🗺️ <span className="gradient-text">Japan Cherry Blossom Trail</span>
          </h1>
          <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
            <span style={{fontSize:"13px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"4px"}}><Calendar size={13}/>{days[0]?.date} – {days[days.length-1]?.date}</span>
            <span style={{fontSize:"13px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"4px"}}><MapPin size={13}/>{days.map(d=>d.city).join(" · ")}</span>
            <span style={{fontSize:"13px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"4px"}}><Wallet size={13}/>{formatCurrency(totalCost)} est.</span>
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {unsaved && (
            <motion.span initial={{opacity:0}} animate={{opacity:1}}
              style={{fontSize:"11px",color:"#f59e0b",fontWeight:600,display:"flex",alignItems:"center",gap:"4px"}}>
              ● Unsaved changes
            </motion.span>
          )}
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={aiOptimize} disabled={aiOptimizing}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"12px",background:"var(--brand-gradient)",color:"white",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:600,opacity:aiOptimizing?0.7:1}}>
            {aiOptimizing?<><div style={{width:"13px",height:"13px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"white",animation:"spin 0.7s linear infinite"}}/> Optimizing…</>:<><Sparkles size={13}/> AI Optimize</>}
          </motion.button>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={saveAll} disabled={saving||!unsaved}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"12px",background:unsaved?"#22c55e":"var(--bg-card)",color:unsaved?"white":"var(--text-muted)",border:`1px solid ${unsaved?"#22c55e":"var(--border)"}`,cursor:unsaved?"pointer":"default",fontSize:"13px",fontWeight:600,transition:"all 0.2s"}}>
            {saving?<><div style={{width:"13px",height:"13px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",animation:"spin 0.7s linear infinite"}}/> Saving…</>:<><Save size={13}/> Save</>}
          </motion.button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"24px"}}>
        {[{label:"Days",value:days.length,icon:"📅"},{label:"Activities",value:totalActs,icon:"🎯"},{label:"Est. Cost",value:formatCurrency(totalCost),icon:"💰"},{label:"Cities",value:uniqueCities||days.length,icon:"🏙️"}].map(s=>(
          <motion.div key={s.label} whileHover={{y:-2}} className="card" style={{padding:"14px",textAlign:"center"}}>
            <div style={{fontSize:"20px",marginBottom:"4px"}}>{s.icon}</div>
            <div style={{fontWeight:800,fontSize:"18px",color:"var(--text-primary)"}}>{s.value}</div>
            <div style={{fontSize:"11px",color:"var(--text-muted)",marginTop:"2px"}}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Day Cards */}
      <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
        <AnimatePresence>
          {days.map((day,di)=>{
            const dayCost = day.activities.reduce((s,a)=>s+a.cost,0);
            return (
              <motion.div key={day.id} layout initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10,scale:0.97}} transition={{delay:di*0.05}}>
                {/* Day Header */}
                <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"16px 20px",borderRadius:"14px",background:"var(--bg-card)",border:"1px solid var(--border)",transition:"box-shadow 0.2s"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow="0 4px 20px rgba(99,102,241,0.1)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
                  {/* Day badge */}
                  <div onClick={()=>toggleDay(day.id)} style={{width:"44px",height:"44px",borderRadius:"12px",background:"var(--brand-gradient)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:"15px",flexShrink:0,cursor:"pointer"}}>
                    {day.day}
                  </div>
                  {/* Editable city + date */}
                  <div style={{flex:1}} onClick={()=>{ if(!day.expanded) toggleDay(day.id); }}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                      <InlineEdit value={day.city} onSave={v=>updateDay(day.id,{city:v})} style={{fontWeight:700,fontSize:"15px",color:"var(--text-primary)"}}/>
                    </div>
                    <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                      <span style={{fontSize:"12px",color:"var(--text-muted)",display:"flex",alignItems:"center",gap:"3px"}}>
                        <Calendar size={10}/>
                        <InlineEdit value={day.date} onSave={v=>updateDay(day.id,{date:v})} style={{fontSize:"12px",color:"var(--text-muted)"}}/>
                      </span>
                      <span style={{fontSize:"12px",color:"var(--text-muted)"}}>· {day.activities.length} activities</span>
                      <span style={{fontSize:"12px",color:"var(--text-muted)"}}>· {dayCost===0?"Free":formatCurrency(dayCost)}</span>
                    </div>
                  </div>
                  {/* Emoji previews + controls */}
                  <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                    {day.activities.slice(0,3).map(a=><span key={a.id} style={{fontSize:"16px"}}>{a.emoji}</span>)}
                    <motion.button whileTap={{scale:0.85}} onClick={()=>deleteDay(day.id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex",padding:"4px",marginLeft:"4px"}}>
                      <Trash2 size={14}/>
                    </motion.button>
                    <motion.button whileTap={{scale:0.9}} onClick={()=>toggleDay(day.id)}
                      style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",display:"flex",padding:"4px"}}>
                      {day.expanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                    </motion.button>
                  </div>
                </div>

                {/* Activities (drag-to-reorder) */}
                <AnimatePresence>
                  {day.expanded && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                      <div style={{paddingLeft:"20px",paddingTop:"8px",display:"flex",flexDirection:"column",gap:"8px"}}>
                        <Reorder.Group axis="y" values={day.activities} onReorder={newOrder=>reorderActivities(day.id,newOrder)}
                          style={{display:"flex",flexDirection:"column",gap:"8px",listStyle:"none",padding:0,margin:0}}>
                          <AnimatePresence>
                            {day.activities.map(act=>(
                              <Reorder.Item key={act.id} value={act} style={{listStyle:"none"}}>
                                <ActivityRow activity={act}
                                  onUpdate={updated=>updateActivity(day.id,updated)}
                                  onDelete={()=>deleteActivity(day.id,act.id)}/>
                              </Reorder.Item>
                            ))}
                          </AnimatePresence>
                        </Reorder.Group>

                        {day.activities.length===0 && (
                          <div style={{padding:"20px",textAlign:"center",color:"var(--text-muted)",fontSize:"13px",borderRadius:"12px",border:"1px dashed var(--border)"}}>
                            No activities yet — add your first one below
                          </div>
                        )}

                        {/* Add Activity */}
                        <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.98}}
                          onClick={()=>setAddingTo(day.id)}
                          style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 16px",borderRadius:"12px",border:"2px dashed rgba(99,102,241,0.4)",background:"rgba(99,102,241,0.04)",color:"var(--brand-primary)",cursor:"pointer",fontSize:"13px",fontWeight:600,marginBottom:"8px",transition:"all 0.2s"}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background="rgba(99,102,241,0.1)";}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="rgba(99,102,241,0.04)";}}>
                          <Plus size={16}/> Add Activity or Place
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Day */}
        <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.97}} onClick={addDay}
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"20px",borderRadius:"14px",border:"2px dashed var(--border)",background:"transparent",color:"var(--text-muted)",cursor:"pointer",fontSize:"14px",fontWeight:500,transition:"all 0.2s"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--brand-primary)";(e.currentTarget as HTMLElement).style.color="var(--brand-primary)";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border)";(e.currentTarget as HTMLElement).style.color="var(--text-muted)";}}>
          <Plus size={18}/> Add New Day
        </motion.button>
      </div>
    </div>
  );
}
