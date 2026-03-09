import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════
const DEMO_FLASHCARDS = [
  { id:1, en:"Serendipity", tr:"Güzel bir tesadüf", example_en:"It was pure serendipity that we met.", wrong:["Talihsizlik","Zorunluluk","Acımasızlık"], level:"B2", category:"Soyut İsimler", tip:"Seren + dipity — İtalyanca kökenli" },
  { id:2, en:"Eloquent", tr:"Belagatlı, etkileyici", example_en:"She gave an eloquent speech.", wrong:["Sessiz","Kaba","Karmaşık"], level:"B1", category:"Sıfatlar", tip:"El- önek: iyi konuşan" },
  { id:3, en:"Resilience", tr:"Dayanıklılık", example_en:"Resilience is key to success.", wrong:["Kırılganlık","Sabırsızlık","Tembellik"], level:"B1", category:"Soyut İsimler", tip:"Resilient sıfatından türemiş" },
  { id:4, en:"Ephemeral", tr:"Geçici, kısa ömürlü", example_en:"Fame can be ephemeral.", wrong:["Kalıcı","Sonsuz","Güçlü"], level:"B2", category:"Sıfatlar", tip:"Yunanca: ephemeros" },
  { id:5, en:"Benevolent", tr:"İyiliksever", example_en:"She was a benevolent leader.", wrong:["Zalim","Bencil","Kayıtsız"], level:"B1", category:"Sıfatlar", tip:"Bene = iyi" },
  { id:6, en:"Tenacious", tr:"Azimli, inatçı", example_en:"He is a tenacious competitor.", wrong:["Kararsız","Tembel","Vazgeçen"], level:"B2", category:"Sıfatlar", tip:"Tenacity isminden türemiş" },
];
const DEMO_TR_EN = [
  { id:1, tr:"Yarın toplantıya katılacağım.", correct:"I will attend the meeting tomorrow.", wrong:["I was attending the meeting tomorrow.","I attend the meeting yesterday.","I would attend the meeting today."], level:"A2", category:"Gelecek Zaman", tip:"will + fiil mastarı" },
  { id:2, tr:"Bu kitabı okumayı bitirdim.", correct:"I finished reading this book.", wrong:["I finish reading this book.","I was finishing to read this book.","I had finished to read this book."], level:"A2", category:"Geçmiş Zaman", tip:"finish + gerund (-ing)" },
  { id:3, tr:"Sabahtan beri çalışıyorum.", correct:"I have been working since morning.", wrong:["I am working since morning.","I work since morning.","I was working since morning."], level:"B1", category:"Present Perfect", tip:"since ile have been + -ing" },
  { id:4, tr:"Geçen yıl İspanya'ya gittim.", correct:"I went to Spain last year.", wrong:["I go to Spain last year.","I was going to Spain last year.","I have gone to Spain last year."], level:"A2", category:"Geçmiş Zaman", tip:"go → went düzensiz fiil" },
];
const DEMO_EN_TR = [
  { id:1, en:"She has been working here for five years.", correct:"Burada beş yıldır çalışıyor.", wrong:["Burada beş yıl önce çalıştı.","Burada beş yıl boyunca çalışacak.","Burada beş yıl çalışmıştı."], level:"B1", category:"Present Perfect", tip:"for + süre — devam eden eylem" },
  { id:2, en:"I wish I had studied harder.", correct:"Keşke daha çok çalışmış olsaydım.", wrong:["Umarım daha çok çalışırım.","Keşke daha çok çalışıyorum.","Daha çok çalışmalıyım."], level:"B2", category:"Dilek Kipi", tip:"wish + past perfect" },
  { id:3, en:"Let's grab a coffee.", correct:"Hadi bir kahve içelim.", wrong:["Kahve almalıyız.","Kahve içmek istiyorum.","Kahveye gidelim mi?"], level:"A1", category:"Öneri", tip:"Let's = Let us" },
  { id:4, en:"I can't help but laugh.", correct:"Gülmeden edemiyorum.", wrong:["Gülemiyorum.","Gülmek istemiyorum.","Gülmek zorunda değilim."], level:"B2", category:"Deyimler", tip:"can't help but + mastar" },
];
const LEADERBOARD_DATA = [
  { name:"Ahmet K.",  xp:840, streak:12, avatar:"AK" },
  { name:"Zeynep M.", xp:720, streak:8,  avatar:"ZM" },
  { name:"Mert T.",   xp:610, streak:5,  avatar:"MT" },
  { name:"Selin A.",  xp:580, streak:7,  avatar:"SA" },
];
const LEVELS = [
  { id:1, name:"Başlangıç", minXP:0,    color:"#94a3b8", icon:"🌱" },
  { id:2, name:"Gelişen",   minXP:100,  color:"#34d399", icon:"🌿" },
  { id:3, name:"Orta",      minXP:250,  color:"#60a5fa", icon:"⚡" },
  { id:4, name:"İleri",     minXP:500,  color:"#f59e0b", icon:"🔥" },
  { id:5, name:"Uzman",     minXP:1000, color:"#a78bfa", icon:"💎" },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const getCurrentLevel = xp => [...LEVELS].reverse().find(l => xp >= l.minXP) || LEVELS[0];
const getNextLevel    = xp => LEVELS.find(l => l.minXP > xp) || null;



// ══════════════════════════════════════════════════════════════
// MUSIC SYSTEM
// ══════════════════════════════════════════════════════════════

// 🎵 Müzik dosyalarını buraya ekle:
// atlas/public/music/ klasörüne MP3 dosyalarını koy
const MUSIC_TRACKS = {
  welcome:     "/music/welcome.mp3",
  login:       "/music/login.mp3",
  menu:        "/music/menu.mp3",
  english:     "/music/english.mp3",
  leaderboard: "/music/leaderboard.mp3",
};

function useMusic(screen, isMuted) {
  const audioRef = useRef(null);
  const fadeRef  = useRef(null);

  const getTrack = (s) => {
    if (s === "welcome" || s === "legal") return MUSIC_TRACKS.welcome;
    if (s === "login")       return MUSIC_TRACKS.login;
    if (s === "menu")        return MUSIC_TRACKS.menu;
    if (s === "english")     return MUSIC_TRACKS.english;
    if (s === "leaderboard") return MUSIC_TRACKS.leaderboard;
    return MUSIC_TRACKS.menu;
  };

  const fadeOut = (audio, cb) => {
    if (!audio) { cb && cb(); return; }
    clearInterval(fadeRef.current);
    let vol = audio.volume;
    fadeRef.current = setInterval(() => {
      vol = Math.max(0, vol - 0.05);
      audio.volume = vol;
      if (vol <= 0) { clearInterval(fadeRef.current); audio.pause(); cb && cb(); }
    }, 40);
  };

  const fadeIn = (audio) => {
    if (!audio) return;
    audio.volume = 0;
    audio.play().catch(()=>{});
    clearInterval(fadeRef.current);
    let vol = 0;
    fadeRef.current = setInterval(() => {
      vol = Math.min(0.6, vol + 0.03);
      audio.volume = vol;
      if (vol >= 0.6) clearInterval(fadeRef.current);
    }, 40);
  };

  useEffect(() => {
    const newSrc = getTrack(screen);
    const prev   = audioRef.current;

    // Aynı şarkı çalıyorsa dokunma
    if (prev && !prev.paused && prev.src.endsWith(newSrc)) return;

    fadeOut(prev, () => {
      const audio = new Audio(newSrc);
      audio.loop  = true;
      audio.volume = 0;
      audioRef.current = audio;
      if (!isMuted) fadeIn(audio);
    });

    return () => { clearInterval(fadeRef.current); };
  }, [screen]); // eslint-disable-line

  // Mute/unmute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) { fadeOut(audio, null); }
    else         { fadeIn(audio); }
  }, [isMuted]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); clearInterval(fadeRef.current); };
  }, []);
}

// 🔊 Sağ üst köşe sabit mute butonu
function MuteButton({ isMuted, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isMuted ? "Müziği Aç" : "Müziği Kapat"}
      style={{
        position:"fixed", top:16, right:16, zIndex:9999,
        width:40, height:40, borderRadius:"50%",
        background:"rgba(255,255,255,0.07)",
        border:"1px solid rgba(255,255,255,0.12)",
        color:"rgba(255,255,255,0.7)",
        fontSize:18, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.3s", backdropFilter:"blur(10px)",
      }}
      onMouseEnter={e=>{ e.currentTarget.style.background="rgba(245,158,11,0.15)"; e.currentTarget.style.borderColor="rgba(245,158,11,0.4)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
    >
      {isMuted ? "🔇" : "🔊"}
    </button>
  );
}


const STARS = Array.from({length:60},(_,i)=>({ id:i, x:Math.random()*100, y:Math.random()*100, s:Math.random()*2+0.5, d:Math.random()*3+2, delay:Math.random()*5 }));

function StarBG() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 20% 50%,rgba(26,5,51,0.9) 0%,transparent 55%),radial-gradient(ellipse at 80% 20%,rgba(13,31,60,0.7) 0%,transparent 50%),radial-gradient(ellipse at 50% 80%,rgba(10,30,20,0.5) 0%,transparent 50%),#080810"}} />
      {STARS.map(s=>(
        <div key={s.id} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,width:s.s,height:s.s,borderRadius:"50%",background:"#fff",opacity:0,animation:`starTwinkle ${s.d}s ${s.delay}s infinite ease-in-out`}} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1: WELCOME
// ══════════════════════════════════════════════════════════════
function WelcomeScreen({ onNext }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setTimeout(()=>setReady(true), 300); }, []);
  return (
    <div style={{position:"relative",zIndex:10,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",textAlign:"center"}}>
      <div style={{opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(-20px)",transition:"all 1.2s cubic-bezier(0.16,1,0.3,1)"}}>
        <div style={{fontSize:70,marginBottom:16,animation:"pulse 3s infinite"}}>🌟</div>
        <h1 style={{fontSize:"clamp(40px,9vw,80px)",fontWeight:900,letterSpacing:"10px",margin:"0 0 8px",background:"linear-gradient(135deg,#f59e0b 0%,#fbbf24 30%,#818cf8 60%,#f59e0b 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmer 4s linear infinite"}}>
          ATLAS
        </h1>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:"clamp(11px,2vw,14px)",letterSpacing:"6px",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",marginBottom:56}}>
          Öğren · Oyna · Kazan
        </p>
      </div>
      <div style={{opacity:ready?1:0,transition:"opacity 1.5s 0.5s",width:"min(280px,70vw)",height:1,background:"linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)",marginBottom:56}} />
      <div style={{opacity:ready?1:0,transition:"opacity 1s 0.8s",maxWidth:420,marginBottom:56}}>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:"clamp(14px,2.5vw,17px)",lineHeight:1.9,color:"rgba(255,255,255,0.55)",fontWeight:300}}>
          Bilgini test et, arkadaşlarınla yarış,<br/>her gün yeni bir maceraya adım at.
        </p>
      </div>
      <div style={{opacity:ready?1:0,transition:"opacity 1s 1.1s"}}>
        <button className="btn-primary" onClick={onNext}>✦ Yolculuğa Başla ✦</button>
      </div>
      <div style={{position:"absolute",bottom:28,opacity:ready?0.25:0,transition:"opacity 1s 1.5s",fontFamily:"'Raleway',sans-serif",fontSize:11,letterSpacing:3,textTransform:"uppercase",color:"#f0f0ff"}}>
        v1.0 · Beta
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2: LEGAL
// ══════════════════════════════════════════════════════════════
function LegalScreen({ onAccept }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{position:"relative",zIndex:10,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",animation:"fadeSlideUp 0.6s ease"}}>
      <div style={{maxWidth:540,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:36,marginBottom:12}}>📜</div>
          <h2 style={{fontSize:"clamp(18px,4vw,26px)",letterSpacing:5,color:"#fbbf24",margin:"0 0 10px"}}>KULLANIM KOŞULLARI</h2>
          <div style={{width:50,height:1,background:"rgba(245,158,11,0.4)",margin:"0 auto"}} />
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"24px",maxHeight:"42vh",overflowY:"auto",marginBottom:28,fontFamily:"'Raleway',sans-serif",fontSize:13,lineHeight:1.9,color:"rgba(255,255,255,0.6)"}}>
          <p><strong style={{color:"#fbbf24"}}>1. Genel Kullanım</strong><br/>Bu platform eğitim ve kişisel gelişim amacıyla tasarlanmıştır. Yalnızca davet edilen kullanıcılar erişim sağlayabilir.</p>
          <p><strong style={{color:"#fbbf24"}}>2. Gizlilik</strong><br/>Kullanıcı verileriniz yalnızca platform içinde kullanılır, üçüncü taraflarla paylaşılmaz. Google hesabınız yalnızca kimlik doğrulama için kullanılır.</p>
          <p><strong style={{color:"#fbbf24"}}>3. İçerik</strong><br/>Platformdaki tüm içerikler eğitim amaçlıdır. Kullanıcılar uygunsuz davranışlardan sorumludur.</p>
          <p><strong style={{color:"#fbbf24"}}>4. Rekabet Kuralları</strong><br/>Liderboard sıralamaları adil oyun ilkesine dayanır. Hile veya sistem açığı kullanımı hesap askıya alınmasına neden olabilir.</p>
          <p><strong style={{color:"#fbbf24"}}>5. Değişiklikler</strong><br/>Platform kuralları önceden haber verilmeksizin güncellenebilir.</p>
        </div>
        <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:32,cursor:"pointer"}} onClick={()=>setChecked(p=>!p)}>
          <div style={{width:22,height:22,border:`2px solid ${checked?"#f59e0b":"rgba(255,255,255,0.2)"}`,borderRadius:6,background:checked?"#f59e0b":"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.3s",marginTop:2}}>
            {checked && <span style={{color:"#0a0a14",fontSize:13,fontWeight:900}}>✓</span>}
          </div>
          <p style={{fontFamily:"'Raleway',sans-serif",fontSize:14,color:"rgba(255,255,255,0.55)",lineHeight:1.6,margin:0}}>Kullanım koşullarını okudum ve kabul ediyorum.</p>
        </div>
        <div style={{textAlign:"center"}}>
          <button className="btn-primary" onClick={onAccept} disabled={!checked} style={{opacity:checked?1:0.3,cursor:checked?"pointer":"not-allowed"}}>
            Devam Et →
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3: LOGIN
// ══════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => onLogin({ name:"Demo Kullanıcı", email:"demo@gmail.com", avatar:"DK" }), 1200);
  };
  return (
    <div style={{position:"relative",zIndex:10,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",animation:"fadeSlideUp 0.6s ease"}}>
      <div style={{textAlign:"center",maxWidth:400,width:"100%"}}>
        <div style={{fontSize:48,marginBottom:20}}>🔮</div>
        <h2 style={{fontSize:"clamp(20px,5vw,30px)",letterSpacing:6,color:"#fbbf24",marginBottom:10}}>HOŞ GELDİN</h2>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:14,color:"rgba(255,255,255,0.35)",marginBottom:48,letterSpacing:1}}>Maceraya devam etmek için giriş yap</p>
        <button onClick={handleLogin} disabled={loading} style={{width:"100%",maxWidth:300,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",gap:14,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"#f0f0ff",padding:"16px 32px",borderRadius:50,fontFamily:"'Raleway',sans-serif",fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",transition:"all 0.3s",opacity:loading?0.7:1}}>
          {loading ? (
            <span style={{animation:"pulse 1s infinite"}}>Giriş yapılıyor...</span>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile Giriş Yap
            </>
          )}
        </button>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.18)",marginTop:36,letterSpacing:1}}>Yalnızca davet edilen kullanıcılar erişebilir</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4: MAIN MENU
// ══════════════════════════════════════════════════════════════
function MainMenu({ user, onSelect, userXP, streak }) {
  const [ready, setReady] = useState(false);
  useEffect(()=>{ setTimeout(()=>setReady(true),100); },[]);
  const level = getCurrentLevel(userXP);

  const MODULES = [
    { id:"english", icon:"🇬🇧", title:"İNGİLİZCE PRATİK", desc:"Kelime kartları, çeviri, turnuva", active:true },
    { id:"turkish", icon:"📚", title:"TÜRK DİLİ & EDEBİYATI", desc:"Dil bilgisi, şiir, yazım", active:false },
    { id:"general", icon:"🧠", title:"GENEL KÜLTÜR", desc:"Trivia, bulmacalar, zeka soruları", active:false },
    { id:"art",     icon:"🎨", title:"SANAT & YARATICILIK", desc:"Sanat tarihi, yaratıcı ifade", active:false },
    { id:"geo",     icon:"🌍", title:"COĞRAFYA & TARİH", desc:"Dünya tarihi, haritalar", active:false },
  ];

  return (
    <div style={{position:"relative",zIndex:10,minHeight:"100vh",padding:"24px 20px 80px"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",maxWidth:640,margin:"0 auto 32px",animation:"fadeIn 0.6s ease"}}>
        <div>
          <h1 style={{fontSize:"clamp(20px,4vw,26px)",letterSpacing:6,color:"#fbbf24",margin:0}}>ATLAS</h1>
          <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:3,margin:"4px 0 0"}}>ÖĞRENME PLATFORMU</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right"}}>
            <p style={{fontFamily:"'Raleway',sans-serif",fontSize:13,color:"rgba(255,255,255,0.6)",margin:0}}>{user.name}</p>
            <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:level.color,margin:"2px 0 0"}}>{level.icon} {level.name} · {userXP} XP</p>
          </div>
          <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#f59e0b,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cinzel',serif",fontWeight:700,fontSize:14,color:"#0a0a14"}}>
            {user.avatar}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{maxWidth:640,margin:"0 auto 28px",display:"flex",gap:12,animation:"fadeSlideUp 0.5s 0.1s ease both"}}>
        {[["🔥",streak,"Günlük Seri"],["⭐",userXP,"Toplam XP"],["🏆","-","Sıralama"]].map(([icon,val,label])=>(
          <div key={label} style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:18,color:"#fbbf24",fontWeight:600}}>{val}</div>
            <div style={{fontFamily:"'Raleway',sans-serif",fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Module cards */}
      <div style={{maxWidth:640,margin:"0 auto",display:"flex",flexDirection:"column",gap:12}}>
        {MODULES.map((m,i)=>(
          <div key={m.id}
            onClick={()=>m.active && onSelect(m.id)}
            style={{
              background: m.active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${m.active ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)"}`,
              borderRadius:18, padding:"20px 22px", cursor:m.active?"pointer":"not-allowed",
              opacity:m.active?1:0.45, transition:"all 0.3s",
              animation:ready?`menuCardIn 0.5s ${i*0.08}s ease both`:"none",
              display:"flex", alignItems:"center", gap:18,
            }}
            onMouseEnter={e=>{ if(m.active){ e.currentTarget.style.borderColor="rgba(245,158,11,0.4)"; e.currentTarget.style.transform="translateX(4px)"; }}}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=m.active?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.04)"; e.currentTarget.style.transform="translateX(0)"; }}>
            <span style={{fontSize:36,flexShrink:0,filter:m.active?"none":"grayscale(1)"}}>{m.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
                <h3 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(13px,2.5vw,15px)",color:m.active?"#fbbf24":"rgba(255,255,255,0.3)",margin:0,letterSpacing:2}}>{m.title}</h3>
                {m.active
                  ? <span style={{fontFamily:"'Raleway',sans-serif",fontSize:10,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"2px 10px",borderRadius:20,letterSpacing:2}}>AKTİF</span>
                  : <span style={{fontFamily:"'Raleway',sans-serif",fontSize:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.25)",padding:"2px 10px",borderRadius:20,letterSpacing:2}}>YAKINDA</span>
                }
              </div>
              <p style={{fontFamily:"'Raleway',sans-serif",fontSize:13,color:"rgba(255,255,255,0.35)",margin:0,lineHeight:1.5}}>{m.desc}</p>
            </div>
            {m.active && <span style={{color:"rgba(245,158,11,0.4)",fontSize:18,flexShrink:0}}>→</span>}
            {!m.active && <span style={{fontSize:20,flexShrink:0}}>🔨</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// GAME COMPONENTS
// ══════════════════════════════════════════════════════════════
function XPBar({ xp }) {
  const cur = getCurrentLevel(xp);
  const nxt = getNextLevel(xp);
  const pct = nxt ? Math.round(((xp-cur.minXP)/(nxt.minXP-cur.minXP))*100) : 100;
  return (
    <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"12px 16px",border:"1px solid rgba(255,255,255,0.07)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:13,color:cur.color}}>{cur.icon} {cur.name}</span>
        <span style={{fontFamily:"'Raleway',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)"}}>{xp} XP {nxt&&`/ ${nxt.minXP}`}</span>
      </div>
      <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${cur.color},${nxt?.color||cur.color})`,borderRadius:3,transition:"width 0.6s ease"}} />
      </div>
    </div>
  );
}

const LETTERS = ["A","B","C","D"];
const LCOLORS = ["#60a5fa","#f59e0b","#34d399","#a78bfa"];

function OptionBtn({ opt, idx, selected, isCorrect, onSelect }) {
  const isSelected = selected === opt;
  let bg = "rgba(255,255,255,0.03)", border = "rgba(255,255,255,0.08)", color = "rgba(255,255,255,0.8)";
  if (selected) {
    if (isCorrect)       { bg="rgba(52,211,153,0.1)"; border="rgba(52,211,153,0.5)"; color="#34d399"; }
    else if (isSelected) { bg="rgba(251,113,133,0.1)"; border="rgba(251,113,133,0.5)"; color="#fb7185"; }
  }
  return (
    <button onClick={()=>onSelect(opt)} style={{background:bg,border:`1.5px solid ${border}`,borderRadius:14,padding:"14px 18px",textAlign:"left",fontFamily:"'Raleway',sans-serif",fontSize:"clamp(12px,2.5vw,14px)",color,cursor:selected?"default":"pointer",transition:"all 0.25s",lineHeight:1.5,display:"flex",alignItems:"center",gap:14,width:"100%"}}
      onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background="rgba(255,255,255,0.07)"; }}
      onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background=bg; }}>
      <span style={{width:32,height:32,borderRadius:8,background:LCOLORS[idx]+"22",border:`1px solid ${LCOLORS[idx]}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cinzel',serif",fontSize:13,color:LCOLORS[idx],fontWeight:700,flexShrink:0}}>{LETTERS[idx]}</span>
      <span style={{flex:1}}>{opt}</span>
      {selected && isCorrect  && <span>✅</span>}
      {selected && isSelected && !isCorrect && <span>❌</span>}
    </button>
  );
}

function FlashcardGame({ data, onXP }) {
  const [deck]    = useState(()=>shuffle(data).slice(0,8));
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [options, setOptions]   = useState([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [done, setDone]         = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [usedFifty, setUsedFifty] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hidden, setHidden]     = useState([]);

  const card = deck[idx];
  useEffect(()=>{ if(!card) return; setOptions(shuffle([card.tr,...card.wrong.slice(0,3)])); setSelected(null); setShowHint(false); setHidden([]); setUsedHint(false); setUsedFifty(false); },[idx]);

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    if (opt===card.tr) { setSessionXP(p=>p+20); onXP(20); }
    setTimeout(()=>{ idx+1>=deck.length ? setDone(true) : setIdx(p=>p+1); }, 1600);
  };

  if (done) return <DoneScreen xp={sessionXP} onRetry={()=>{setIdx(0);setDone(false);setSessionXP(0);}} />;
  if (!card||options.length===0) return null;

  return (
    <div style={{maxWidth:520,margin:"0 auto"}}>
      <ProgressBar current={idx} total={deck.length} xp={sessionXP} />
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <Chip label={card.category} color="#818cf8" />
        <Chip label={card.level} color="#fbbf24" />
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"32px 24px",textAlign:"center",marginBottom:18,minHeight:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>Bu kelimenin Türkçe anlamı?</p>
        <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(28px,7vw,44px)",color:"#f0f0ff",letterSpacing:3,margin:"0 0 14px"}}>{card.en}</h2>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:13,color:"rgba(255,255,255,0.35)",fontStyle:"italic",margin:0}}>"{card.example_en}"</p>
        {showHint && <div style={{marginTop:14,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:10,padding:"8px 16px",animation:"fadeSlideUp 0.3s ease"}}><p style={{fontFamily:"'Raleway',sans-serif",fontSize:12,color:"#fbbf24",margin:0}}>💡 {card.tip}</p></div>}
      </div>
      <div style={{display:"flex",gap:10,marginBottom:16,justifyContent:"center"}}>
        <LifelineBtn label="50 : 50" color="#60a5fa" used={usedFifty} onClick={()=>{ if(usedFifty) return; setUsedFifty(true); setHidden(shuffle(options.filter(o=>o!==card.tr)).slice(0,2)); }} />
        <LifelineBtn label="💡 İpucu" color="#fbbf24" used={usedHint} onClick={()=>{ if(usedHint) return; setUsedHint(true); setShowHint(true); }} />
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {options.map((opt,i)=>
          hidden.includes(opt)
            ? <div key={i} style={{height:52,borderRadius:14,background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.03)",opacity:0.15}} />
            : <OptionBtn key={i} opt={opt} idx={i} selected={selected} isCorrect={opt===card.tr} onSelect={handleSelect} />
        )}
      </div>
    </div>
  );
}

function TranslationGame({ mode, data, onXP }) {
  const [deck]    = useState(()=>shuffle(data).slice(0,6));
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [options, setOptions]   = useState([]);
  const [sessionXP, setSessionXP] = useState(0);
  const [done, setDone]         = useState(false);

  const q = deck[idx];
  useEffect(()=>{ if(!q) return; setOptions(shuffle([q.correct,...q.wrong.slice(0,3)])); setSelected(null); },[idx]);

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    if (opt===q.correct) { setSessionXP(p=>p+20); onXP(20); }
    setTimeout(()=>{ idx+1>=deck.length ? setDone(true) : setIdx(p=>p+1); }, 1600);
  };

  if (done) return <DoneScreen xp={sessionXP} onRetry={()=>{setIdx(0);setDone(false);setSessionXP(0);}} />;
  if (!q||options.length===0) return null;

  return (
    <div style={{maxWidth:540,margin:"0 auto"}}>
      <ProgressBar current={idx} total={deck.length} xp={sessionXP} />
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <Chip label={mode==="tr_en"?"🇹🇷 TR → 🇬🇧 EN":"🇬🇧 EN → 🇹🇷 TR"} color="#818cf8" />
        {q.category && <Chip label={q.category} color="#fbbf24" />}
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"28px 24px",marginBottom:20}}>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>{mode==="tr_en"?"İngilizce karşılığı?":"Türkçe karşılığı?"}</p>
        <p style={{fontFamily:"'Cinzel',serif",fontSize:"clamp(14px,3vw,18px)",color:"#f0f0ff",lineHeight:1.7,margin:0}}>{mode==="tr_en"?q.tr:q.en}</p>
        {selected&&q.tip&&<div style={{marginTop:14,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:10,padding:"8px 14px",animation:"fadeSlideUp 0.3s ease"}}><p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"#fbbf24",margin:0}}>💡 {q.tip}</p></div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {options.map((opt,i)=><OptionBtn key={i} opt={opt} idx={i} selected={selected} isCorrect={opt===q.correct} onSelect={handleSelect} />)}
      </div>
    </div>
  );
}

function Leaderboard({ userXP, userName }) {
  const board = [...LEADERBOARD_DATA, { name:userName||"Sen", xp:userXP, streak:1, avatar:"BN", isMe:true }]
    .sort((a,b)=>b.xp-a.xp).map((u,i)=>({...u,rank:i+1}));
  return (
    <div style={{maxWidth:500,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <h3 style={{fontFamily:"'Cinzel',serif",fontSize:18,color:"#fbbf24",letterSpacing:4,margin:0}}>HAFTALIK SIRALAMA</h3>
        <p style={{fontFamily:"'Raleway',sans-serif",fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:6}}>Her Pazartesi sıfırlanır · Şampiyon arşivlenir</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {board.map((u,i)=>(
          <div key={u.name} style={{background:u.isMe?"rgba(245,158,11,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${u.isMe?"rgba(245,158,11,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,animation:`menuCardIn 0.5s ${i*0.07}s ease both`}}>
            <div style={{width:36,textAlign:"center",fontFamily:"'Cinzel',serif",fontSize:u.rank<=3?20:15,color:["#fbbf24","#94a3b8","#b45309","rgba(255,255,255,0.3)"][Math.min(u.rank-1,3)]}}>
              {u.rank<=3?["🥇","🥈","🥉"][u.rank-1]:u.rank}
            </div>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${["#f59e0b","#818cf8","#34d399","#60a5fa","#fb7185"][i%5]},rgba(0,0,0,0.3))`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cinzel',serif",fontSize:13,fontWeight:700,color:"#0a0a14",flexShrink:0}}>
              {u.avatar}
            </div>
            <div style={{flex:1}}>
              <p style={{fontFamily:"'Raleway',sans-serif",fontSize:14,color:u.isMe?"#fbbf24":"rgba(255,255,255,0.8)",margin:"0 0 2px",fontWeight:u.isMe?600:400}}>{u.name} {u.isMe&&<span style={{fontSize:11,opacity:0.6}}>(Sen)</span>}</p>
              <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",margin:0}}>🔥 {u.streak} günlük seri</p>
            </div>
            <div style={{textAlign:"right"}}>
              <p style={{fontFamily:"'Cinzel',serif",fontSize:16,color:"#fbbf24",margin:0}}>{u.xp}</p>
              <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",margin:0}}>XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Small reusable components ──────────────────────────────────
function ProgressBar({ current, total, xp }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div style={{display:"flex",gap:5}}>{Array.from({length:total},(_,i)=><div key={i} style={{width:18,height:4,borderRadius:2,background:i<current?"#34d399":i===current?"#fbbf24":"rgba(255,255,255,0.1)",transition:"background 0.3s"}} />)}</div>
      <span style={{fontFamily:"'Raleway',sans-serif",fontSize:12,color:"#34d399"}}>+{xp} XP</span>
    </div>
  );
}
function Chip({ label, color }) {
  return <span style={{fontFamily:"'Raleway',sans-serif",fontSize:11,background:`${color}15`,border:`1px solid ${color}30`,color,padding:"3px 12px",borderRadius:20,letterSpacing:1}}>{label}</span>;
}
function LifelineBtn({ label, color, used, onClick }) {
  return (
    <button onClick={onClick} disabled={used} style={{background:used?"rgba(255,255,255,0.02)":`${color}15`,border:`1px solid ${used?"rgba(255,255,255,0.05)":`${color}35`}`,color:used?"rgba(255,255,255,0.2)":color,padding:"8px 18px",borderRadius:20,fontFamily:"'Raleway',sans-serif",fontSize:12,cursor:used?"not-allowed":"pointer",transition:"all 0.3s"}}>
      {label}
    </button>
  );
}
function DoneScreen({ xp, onRetry }) {
  return (
    <div style={{textAlign:"center",padding:"40px 20px",animation:"fadeSlideUp 0.5s ease"}}>
      <div style={{fontSize:60,marginBottom:16}}>🏆</div>
      <h3 style={{fontFamily:"'Cinzel',serif",fontSize:22,color:"#fbbf24",letterSpacing:3}}>Tur Tamamlandı!</h3>
      <p style={{fontFamily:"'Raleway',sans-serif",color:"rgba(255,255,255,0.5)",marginBottom:24}}>Bu turda <strong style={{color:"#34d399"}}>+{xp} XP</strong> kazandın</p>
      <button className="btn-primary" onClick={onRetry}>Tekrar Oyna</button>
    </div>
  );
}
function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.5)",padding:"8px 16px",borderRadius:20,cursor:"pointer",fontFamily:"'Raleway',sans-serif",fontSize:13}}>← Geri</button>;
}

// ══════════════════════════════════════════════════════════════
// ENGLISH MODULE
// ══════════════════════════════════════════════════════════════
function EnglishModule({ onBack, userXP, onXP, userName }) {
  const [tab, setTab] = useState("home");
  const gameData = { flashcards:DEMO_FLASHCARDS, trEn:DEMO_TR_EN, enTr:DEMO_EN_TR };

  const TABS = [
    { id:"home",        icon:"🏠", label:"Ana" },
    { id:"flashcard",   icon:"🃏", label:"Kelimeler" },
    { id:"tr_en",       icon:"🔄", label:"TR→EN" },
    { id:"en_tr",       icon:"🔁", label:"EN→TR" },
    { id:"leaderboard", icon:"🏆", label:"Sıralama" },
  ];

  return (
    <div style={{minHeight:"100vh",paddingBottom:80}}>
      {/* Sub-header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(8,8,16,0.93)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"12px 20px"}}>
        <div style={{maxWidth:600,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:18,padding:"4px 8px"}}>←</button>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:15,color:"#fbbf24",letterSpacing:3}}>ATLAS</span>
            <span style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:2}}>· İNG PRATİK</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontFamily:"'Raleway',sans-serif",fontSize:13,color:getCurrentLevel(userXP).color}}>{getCurrentLevel(userXP).icon} {userXP} XP</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{position:"relative",zIndex:10,maxWidth:600,margin:"0 auto",padding:"24px 16px"}}>

        {tab === "home" && (
          <div style={{animation:"fadeSlideUp 0.4s ease"}}>
            <XPBar xp={userXP} />

            {/* Mode grid */}
            <div style={{marginTop:22,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {id:"flashcard",icon:"🃏",title:"Kelime Kartları",desc:"KMO tarzı 4 şıklı",xp:"+20 XP",color:"#818cf8",count:gameData.flashcards.length},
                {id:"tr_en",icon:"🇹🇷",title:"TR → İNG",desc:"Cümle çevirisi",xp:"+20 XP",color:"#34d399",count:gameData.trEn.length},
                {id:"en_tr",icon:"🇬🇧",title:"İNG → TR",desc:"Cümle çevirisi",xp:"+20 XP",color:"#60a5fa",count:gameData.enTr.length},
                {id:"leaderboard",icon:"🏆",title:"Liderboard",desc:"Haftalık sıralama",xp:"Bu hafta",color:"#fbbf24",count:null},
              ].map((m,i)=>(
                <div key={m.id} onClick={()=>setTab(m.id)} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:18,padding:"18px 14px",cursor:"pointer",transition:"all 0.3s",animation:`menuCardIn 0.5s ${i*0.08}s ease both`}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${m.color}55`;e.currentTarget.style.transform="translateY(-3px)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.transform="translateY(0)";}}>
                  <div style={{fontSize:26,marginBottom:10}}>{m.icon}</div>
                  <h3 style={{fontFamily:"'Cinzel',serif",fontSize:12,color:"#f0f0ff",margin:"0 0 5px",letterSpacing:1}}>{m.title}</h3>
                  <p style={{fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(255,255,255,0.3)",margin:"0 0 10px"}}>{m.desc}</p>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontFamily:"'Raleway',sans-serif",fontSize:10,color:m.color,background:`${m.color}15`,padding:"2px 8px",borderRadius:20}}>{m.xp}</span>
                    {m.count&&<span style={{fontFamily:"'Raleway',sans-serif",fontSize:10,color:"rgba(255,255,255,0.2)"}}>{m.count} soru</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Daily goal */}
            <div style={{marginTop:18,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.14)",borderRadius:14,padding:"14px 18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontFamily:"'Cinzel',serif",fontSize:11,color:"#fbbf24",letterSpacing:2,margin:"0 0 3px"}}>🎯 GÜNLÜK GÖREV</p>
                  <p style={{fontFamily:"'Raleway',sans-serif",fontSize:12,color:"rgba(255,255,255,0.4)",margin:0}}>100 XP kazan</p>
                </div>
                <p style={{fontFamily:"'Cinzel',serif",fontSize:15,color:"#fbbf24",margin:0}}>{Math.min(userXP,100)}/100</p>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,marginTop:10,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(userXP,100)}%`,background:"linear-gradient(90deg,#f59e0b,#fbbf24)",borderRadius:2,transition:"width 0.6s"}} />
              </div>
            </div>
          </div>
        )}

        {tab === "flashcard" && (
          <div style={{animation:"fadeSlideUp 0.4s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}><BackBtn onClick={()=>setTab("home")} /><h2 style={{fontFamily:"'Cinzel',serif",fontSize:14,color:"#818cf8",letterSpacing:3,margin:0}}>🃏 KELİME KARTLARI</h2></div>
            <FlashcardGame key={`fc-${tab}`} data={gameData.flashcards} onXP={onXP} />
          </div>
        )}
        {tab === "tr_en" && (
          <div style={{animation:"fadeSlideUp 0.4s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}><BackBtn onClick={()=>setTab("home")} /><h2 style={{fontFamily:"'Cinzel',serif",fontSize:14,color:"#34d399",letterSpacing:3,margin:0}}>🔄 TR → İNG</h2></div>
            <TranslationGame key={`tr-${tab}`} mode="tr_en" data={gameData.trEn} onXP={onXP} />
          </div>
        )}
        {tab === "en_tr" && (
          <div style={{animation:"fadeSlideUp 0.4s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}><BackBtn onClick={()=>setTab("home")} /><h2 style={{fontFamily:"'Cinzel',serif",fontSize:14,color:"#60a5fa",letterSpacing:3,margin:0}}>🔁 İNG → TR</h2></div>
            <TranslationGame key={`en-${tab}`} mode="en_tr" data={gameData.enTr} onXP={onXP} />
          </div>
        )}
        {tab === "leaderboard" && (
          <div style={{animation:"fadeSlideUp 0.4s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22}}><BackBtn onClick={()=>setTab("home")} /><h2 style={{fontFamily:"'Cinzel',serif",fontSize:14,color:"#fbbf24",letterSpacing:3,margin:0}}>🏆 LİDERBOARD</h2></div>
            <Leaderboard userXP={userXP} userName={userName} />
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"rgba(8,8,16,0.95)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,0.06)",padding:"8px 0"}}>
        <div style={{maxWidth:600,margin:"0 auto",display:"flex",justifyContent:"space-around"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"6px 10px",color:tab===t.id?"#fbbf24":"rgba(255,255,255,0.3)",transition:"color 0.2s"}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <span style={{fontFamily:"'Raleway',sans-serif",fontSize:9,letterSpacing:1}}>{t.label}</span>
              {tab===t.id&&<div style={{width:4,height:4,borderRadius:"50%",background:"#fbbf24"}} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [user, setUser]     = useState(null);
  const [userXP, setUserXP] = useState(0);
  const [streak]            = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const addXP = useCallback(amt => setUserXP(p => p + amt), []);

  useMusic(screen, isMuted);

  return (
    <div style={{fontFamily:"'Cinzel','Georgia',serif",minHeight:"100vh",background:"#080810",color:"#f0f0ff",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Raleway:wght@300;400;600&display=swap');
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
        @keyframes menuCardIn  { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes starTwinkle { 0%,100%{opacity:0} 50%{opacity:0.85} }
        @keyframes pulse       { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes shimmer     { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .btn-primary { background:linear-gradient(135deg,#f59e0b,#d97706); color:#0a0a14; border:none; padding:14px 38px; border-radius:50px; font-family:'Cinzel',serif; font-weight:600; font-size:14px; letter-spacing:2px; cursor:pointer; transition:all 0.3s; text-transform:uppercase; }
        .btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(245,158,11,0.45); }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(245,158,11,0.3);border-radius:2px}
      `}</style>

      <StarBG />
      <MuteButton isMuted={isMuted} onToggle={()=>setIsMuted(p=>!p)} />

      {screen === "welcome" && <WelcomeScreen onNext={()=>setScreen("legal")} />}
      {screen === "legal"   && <LegalScreen   onAccept={()=>setScreen("login")} />}
      {screen === "login"   && <LoginScreen    onLogin={u=>{ setUser(u); setScreen("menu"); }} />}
      {screen === "menu"    && <MainMenu user={user} onSelect={id=>{ if(id==="english") setScreen("english"); }} userXP={userXP} streak={streak} />}
      {screen === "english" && <EnglishModule onBack={()=>setScreen("menu")} userXP={userXP} onXP={addXP} userName={user?.name} />}
    </div>
  );
}
