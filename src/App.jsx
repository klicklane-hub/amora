import{useEffect,useState}from"react";
import{supabase}from"./main";

const features=[["01","Private by design","Profiles, invitations and rooms are built around user-controlled privacy."],["02","Real connections","Discover people, build connections and move into private conversations when invited."],["03","Trust first","Verification, reporting, blocking and moderation belong in the foundation."]];
const baseNav=["Home","Discover","Connections","Messages","Rooms","Notifications","Profile"];
const premiumNav=["My Room","Room Settings","Invitations","Profile Analytics"];

export default function App(){
 const[session,setSession]=useState(null),[profile,setProfile]=useState(null),[mode,setMode]=useState(null),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState(""),[dob,setDob]=useState(""),[ageConfirmed,setAgeConfirmed]=useState(false),[terms,setTerms]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[active,setActive]=useState("Home"),[mobileOpen,setMobileOpen]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const{data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[]);
 useEffect(()=>{if(!session){setProfile(null);return}supabase.from("profiles").select("display_name,role,verification_status,avatar_url").eq("id",session.user.id).maybeSingle().then(({data})=>setProfile(data||null))},[session]);
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage("");
  if(mode==="signup"){if(!ageConfirmed||!terms){setMessage("You must confirm that you are 18+ and accept AMORA's terms and privacy requirements.");setBusy(false);return}
   const{error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name,date_of_birth:dob,is_age_confirmed:true,terms_accepted:true,privacy_accepted:true}}});
   setMessage(error?error.message:"Account created. Check your email if confirmation is required, then sign in.");if(!error)setMode("signin");
  }else{const{error}=await supabase.auth.signInWithPassword({email,password});setMessage(error?error.message:"Signed in.");}
  setBusy(false)
 };
 const signout=async()=>{await supabase.auth.signOut();setMessage("Signed out.");setActive("Home")};
 if(session)return <AppShell session={session} profile={profile} active={active} setActive={setActive} signout={signout} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>;
 return <Landing mode={mode} setMode={setMode} email={email} setEmail={setEmail} password={password} setPassword={setPassword} name={name} setName={setName} dob={dob} setDob={setDob} ageConfirmed={ageConfirmed} setAgeConfirmed={setAgeConfirmed} terms={terms} setTerms={setTerms} busy={busy} message={message} setMessage={setMessage} submit={submit}/>;
}

function AppShell({session,profile,active,setActive,signout,mobileOpen,setMobileOpen}){
 const isPremium=profile?.role==="premium";
 const nav=isPremium?[...baseNav,...premiumNav]:baseNav;
 const initials=(profile?.display_name||session.user.email||"A").slice(0,1).toUpperCase();
 return <div className="app-shell">
  <aside className={mobileOpen?"sidebar open":"sidebar"}><div className="side-top"><a className="brand" href="/"><b>A</b><span>AMORA</span></a><button className="mobile-close" onClick={()=>setMobileOpen(false)}>×</button></div>
   <div className="account-mini"><span className="avatar">{initials}</span><div><strong>{profile?.display_name||"AMORA member"}</strong><small>{isPremium?"Premium":"Member"}</small></div></div>
   <nav className="app-nav">{nav.map(item=><button key={item} className={active===item?"active":""} onClick={()=>{setActive(item);setMobileOpen(false)}}><span className="nav-dot"/>{item}{["Notifications","Messages"].includes(item)&&<span className="nav-count">0</span>}</button>)}</nav>
   <button className="signout" onClick={signout}>Sign out</button>
  </aside>
  <div className="app-main"><header className="app-header"><button className="menu-button" onClick={()=>setMobileOpen(true)}>☰</button><div><small>AMORA / {active.toUpperCase()}</small><h1>{active}</h1></div><div className="header-actions"><button aria-label="Notifications" onClick={()=>setActive("Notifications")}>♡</button><span className="avatar">{initials}</span></div></header>
   <main className="app-content"><Screen active={active} profile={profile} session={session} isPremium={isPremium}/></main>
  </div>
 </div>
}

function Screen({active,profile,session,isPremium}){
 const email=session.user.email||"";
 const descriptions={Home:"Your private AMORA space starts here. Discover, connect and move into conversations at your own pace.",Discover:"Find people who match what you are looking for. Discovery controls will appear here.",Connections:"Manage your likes, connection requests and accepted connections.",Messages:"Your private conversations will appear here.",Rooms:"Access rooms you have been invited to, with privacy and access controls built in.",Notifications:"Invitations, messages, calls, subscriptions and security updates will appear here.",Profile:"Manage your profile, privacy, verification and account settings.","My Room":"Your premium private room will live here.","Room Settings":"Control room access, invitations, chat and call settings.","Invitations":"Manage invitations to your private room.","Profile Analytics":"Understand profile and room engagement."};
 return <><section className="page-intro"><div><small>{isPremium&&["My Room","Room Settings","Invitations","Profile Analytics"].includes(active)?"PREMIUM SPACE":"AMORA MEMBER SPACE"}</small><h2>{active}</h2><p>{descriptions[active]}</p></div>{active==="Home"&&<span className="status-pill">● Account active</span>}</section>
  {active==="Home"?<div className="dashboard-grid"><article className="dash-card featured"><small>WELCOME</small><h3>{profile?.display_name||"Welcome to AMORA"}</h3><p>Your account foundation is connected. The next layers will bring discovery, connections, private rooms, messaging and calls into one experience.</p><button className="primary" onClick={()=>document.querySelector(".app-nav button:nth-child(2)")?.click()}>Start discovering</button></article><article className="dash-card"><small>YOUR STATUS</small><h3>Protected foundation</h3><p>18+ account · Privacy controls · Reporting · Blocking · Verification architecture</p></article><article className="dash-card"><small>ACCOUNT</small><h3>{isPremium?"Premium profile":"Regular profile"}</h3><p>{email}</p></article></div>:<div className="empty-panel"><div className="empty-icon">A</div><h3>{active} is ready for the next build layer.</h3><p>The navigation and account foundation are now in place. We will connect this area to real AMORA data without replacing the shell.</p></div>}
 </>;
}

function Landing(p){
 const{mode,setMode,email,setEmail,password,setPassword,name,setName,dob,setDob,ageConfirmed,setAgeConfirmed,terms,setTerms,busy,message,setMessage,submit}=p;
 return <div className="shell"><header><a className="brand" href="/"><b>A</b><span>AMORA</span></a><nav><button onClick={()=>{setMode("signin");setMessage("")}}>Sign in</button><button className="primary" onClick={()=>{setMode("signup");setMessage("")}}>Create account</button></nav></header><main>
  <section className="hero"><div><small>ADULT SOCIAL & DATING</small><h1>Meet with intention.<br/><i>Connect privately.</i></h1><p>AMORA is being built for adults who want meaningful connections, private conversations and personal spaces designed around trust.</p><div className="actions"><button className="primary big" onClick={()=>setMode("signup")}>Join AMORA</button><button className="ghost big" onClick={()=>document.getElementById("foundation").scrollIntoView({behavior:"smooth"})}>Explore AMORA</button></div><label>18+ only · Consent, privacy and safety are fundamental.</label></div><div className="visual"><div className="glow one"/><div className="glow two"/><div className="room"><span>● Private room</span><strong>Only invited people enter.</strong></div></div></section>
  <section id="foundation"><small>THE FOUNDATION</small><h2>Designed for trust before scale.</h2><p className="intro">Identity, privacy, communication, subscriptions and safety are being established as one system so AMORA can grow without rebuilding its core.</p><div className="grid">{features.map(([n,t,d])=><article key={n}><em>{n}</em><h3>{t}</h3><p>{d}</p></article>)}</div></section>
  {mode&&<div className="modal"><div className="modal-card"><button className="close" onClick={()=>setMode(null)}>×</button><small>{mode==="signup"?"CREATE YOUR AMORA ACCOUNT":"WELCOME BACK"}</small><h2>{mode==="signup"?"Join AMORA":"Sign in"}</h2><form onSubmit={submit}>{mode==="signup"&&<><input required placeholder="Display name" value={name} onChange={e=>setName(e.target.value)}/><label className="field">Date of birth<input required type="date" value={dob} onChange={e=>setDob(e.target.value)}/></label></>}<input required type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}/><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)}/>{mode==="signup"&&<div className="checks"><label><input type="checkbox" checked={ageConfirmed} onChange={e=>setAgeConfirmed(e.target.checked)}/> I confirm I am 18 or older.</label><label><input type="checkbox" checked={terms} onChange={e=>setTerms(e.target.checked)}/> I accept AMORA's terms and privacy requirements.</label></div>}<button className="primary big" disabled={busy}>{busy?"Please wait…":mode==="signup"?"Create account":"Sign in"}</button></form>{message&&<p className="form-message">{message}</p>}<button className="switch" onClick={()=>setMode(mode==="signup"?"signin":"signup")}>{mode==="signup"?"Already have an account? Sign in":"Need an account? Create one"}</button></div></div>}
 </main><footer><strong>AMORA</strong><span>Adult-only platform · Safety-first architecture</span></footer></div>
}

const features=[["01","Private by design","Profiles, invitations and rooms are built around user-controlled privacy."],["02","Real connections","Discover people, build connections and move into private conversations when invited."],["03","Trust first","Verification, reporting, blocking and moderation belong in the foundation."]];
