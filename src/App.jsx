import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, onSnapshot, collection, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { 
  Settings, CheckSquare, Square, Skull, Flower, Zap, Anchor, Scissors, Wifi, Clock, ArrowRight, AlertTriangle, Trash2, RefreshCcw, LogOut, User, Lock, MessageCircle, ShieldCheck, AlarmClock, Instagram, FileText
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE (GLOBAL) ---
const getFirebaseConfig = () => {
  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) { console.error("Config not found"); }
  return {
    apiKey: "AIzaSyBw6ZCcBQRTfcQxbbRCUU7POYN_KmNQ6MA",
    authDomain: "sumar-promo.firebaseapp.com",
    projectId: "sumar-promo",
    storageBucket: "sumar-promo.firebasestorage.app",
    messagingSenderId: "136191422799",
    appId: "1:136191422799:web:bf0e200e39b09b1703153a"
  };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sumar-promo-default';

// --- CONSTANTES E ESTILOS (COMPARTILHADOS) ---
const getLeadsCollection = () => collection(db, 'artifacts', appId, 'public', 'data', 'leads');

const safeStorage = {
  getItem: (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
  setItem: (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} },
  removeItem: (key) => { try { localStorage.removeItem(key); } catch (e) {} }
};

const safeSession = {
  getItem: (key) => { try { return sessionStorage.getItem(key); } catch (e) { return null; } },
  setItem: (key, value) => { try { sessionStorage.setItem(key, value); } catch (e) {} },
  removeItem: (key) => { try { sessionStorage.removeItem(key); } catch (e) {} }
};

const CATALOG_IMAGES = [
  {id: 1, name: "Flash 01 -  ANGEL", src: "https://i.postimg.cc/1fR58VBS/ANGEL.png/400x400/111/fff?text=ANGEL" },
  {id: 2, name: "Flash02 -  BEATLE-1", src: "https://i.postimg.cc/F7FsYkps/BEATLE-1.png/400x400/111/fff?text=BEATLE-1" },
  {id: 3, name: "Flash03 -  BEATLE-2", src: "https://i.postimg.cc/mtZ2P1jZ/BEATLE-2.png/400x400/111/fff?text=BEATLE-2" },
  {id: 4, name: "Flash04 - BLOSSON", src: "https://i.postimg.cc/PPfrCv44/BLOSSON.png/400x400/111/fff?text=BLOSSON" },
  {id: 5, name: "Flash05 -  BONES", src: "https://i.postimg.cc/F7PF3FC4/BONES.png/400x400/111/fff?text=BONES" },
  {id: 6, name: "Flash06 - BUTTERFLY", src: "https://i.postimg.cc/0b52zKng/BUTTERFLY.png/400x400/111/fff?text=BUTTERFLY" },
  {id: 7, name: "Flash07 - CANDLE", src: "https://i.postimg.cc/ZCYKWvHt/CANDLE.png/400x400/111/fff?text=CANDLE" },
  {id: 8, name: "Flash08 - CHERRY", src: "https://i.postimg.cc/jLqdDnXM/CHERRY.png/400x400/111/fff?text=CHERRY" },
  {id: 9, name: "Flash09 - DAISY", src: "https://i.postimg.cc/QHNxFKb6/DAISY.png/400x400/111/fff?text=DAISY" },
  {id: 10, name: "Flash 10 - DEATH-MARK", src: "https://i.postimg.cc/vc8H4xhd/DEATH-MARK.png/400x400/111/fff?text=DEATH-MARK" },
  {id: 11, name: "Flash 11 - EYE", src: "https://i.postimg.cc/PPfrCv40/EYE.png/400x400/111/fff?text=EYE" },
  {id: 12, name: "Flash 12 - EYES", src: "https://i.postimg.cc/KR9cBcpb/EYES.png/400x400/111/fff?text=EYES" },
  {id: 13, name: "Flash 13 - FLAME", src: "https://i.postimg.cc/0b52zKn1/FLAME.png/400x400/111/fff?text=FLAME" },
  {id: 14, name: "Flash 14 - FLOWER", src: "https://i.postimg.cc/hf4PXQrk/FLOWER.png/400x400/111/fff?text=FLOWER" },
  {id: 15, name: "Flash 15 - FRIDA", src: "https://i.postimg.cc/dLWQrQNJ/FRIDA.png/400x400/111/fff?text=FRIDA" },
  {id: 16, name: "Flash 16 - HAT", src: "https://i.postimg.cc/D8fyS4gY/HAT.png/400x400/111/fff?text=HAT" },
  {id: 17, name: "Flash 17 - HEADS", src: "https://i.postimg.cc/QHNxFKmM/HEADS.png/400x400/111/fff?text=HEADS" },
  {id: 18, name: "Flash 18 - HIBISCO", src: "https://i.postimg.cc/3drJk0Bn/HIBISCO.png/400x400/111/fff?text=HIBISCO" },
  {id: 19, name: "Flash 19 - MANTIS", src: "https://i.postimg.cc/nCVcX92H/MANTIS.png/400x400/111/fff?text=MANTIS" },
  {id: 20, name: "Flash 20 - MOON", src: "https://i.postimg.cc/gnckxLDf/MOON.png/400x400/111/fff?text=MOON" },
  {id: 21, name: "Flash 21 - MOTH-1", src: "https://i.postimg.cc/N5GfK2DQ/MOTH-1.png/400x400/111/fff?text=MOTH-1" },
  {id: 22, name: "Flash 22 - MOTH-2", src: "https://i.postimg.cc/Whpbdq8T/MOTH-2.png/400x400/111/fff?text=MOTH-2" },
  {id: 23, name: "Flash 23 - MUSHROOM", src: "https://i.postimg.cc/c6BL1BQz/MUSHROOM.png/400x400/111/fff?text=MUSHROOM" },
  {id: 24, name: "Flash 24 - PLANT", src: "https://i.postimg.cc/D8fyS4gj/PLANT.png/400x400/111/fff?text=PLANT" },
  {id: 25, name: "Flash 25 - POTION", src: "https://i.postimg.cc/Yh2qvLR9/POTION.png/400x400/111/fff?text=POTION" },
  {id: 26, name: "Flash 26 - POTION2", src: "https://i.postimg.cc/Ln46JgTW/POTION2.png/400x400/111/fff?text=POTION2" },
  {id: 27, name: "Flash 27 - SNAKE", src: "https://i.postimg.cc/xq31j3Kh/SNAKE.png/400x400/111/fff?text=SNAKE" },
  {id: 28, name: "Flash 28 - STAR", src: "https://i.postimg.cc/3WFxrFg6/STAR.png/400x400/111/fff?text=STAR" },
  {id: 29, name: "Flash 29 - SUN", src: "https://i.postimg.cc/vc8H4xzN/SUN.png/400x400/111/fff?text=SUN" },
];

const STENCILS = [
  { Icon: Skull, top: '15%', left: '10%', delay: '0s', size: 40 },
  { Icon: Flower, top: '45%', left: '85%', delay: '2s', size: 30 },
  { Icon: Zap, top: '75%', left: '15%', delay: '4s', size: 25 },
  { Icon: Anchor, top: '25%', left: '70%', delay: '1s', size: 35 },
  { Icon: Scissors, top: '85%', left: '60%', delay: '3s', size: 30 },
];

const styles = {
  container: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#050505', color: '#f0f0f0', fontFamily: '"Inter", sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', overflow: 'hidden' },
  stencil: { position: 'absolute', color: 'rgba(255, 255, 255, 0.03)', pointerEvents: 'none', animation: 'drift 20s infinite linear' },
  box: { width: '100%', maxWidth: '420px', height: '100%', maxHeight: '100dvh', backgroundColor: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxSizing: 'border-box', zIndex: 10, position: 'relative', overflow: 'hidden' },
  contentCenter: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', overflowY: 'hidden' },
  scrollArea: { flex: 1, overflowY: 'auto', minHeight: 0, width: '100%', paddingRight: '5px', marginBottom: '10px' },
  btn: { width: '100%', height: '48px', backgroundColor: '#ff003c', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '0', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(255, 0, 60, 0.3)', flexShrink: 0 },
  input: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '14px', color: 'white', marginBottom: '10px', outline: 'none', boxSizing: 'border-box', fontSize: '16px', transition: 'border-color 0.3s' },
  timer: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(255, 0, 60, 0.9)', color: 'white', padding: '4px 12px', borderRadius: '50px', fontWeight: '800', fontSize: '11px', zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  adminToggle: { position: 'absolute', bottom: 20, right: 20, opacity: 0.5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', zIndex: 200, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

const BackgroundDrift = () => (
  <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
    <style>{`
      body { margin: 0; padding: 0; overflow: hidden; background-color: #050505; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
      ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      @keyframes drift { 0% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } 100% { transform: translateY(0) rotate(0deg); } }
    `}</style>
    {STENCILS.map((item, idx) => (
      <item.Icon key={idx} size={item.size} style={{ ...styles.stencil, top: item.top, left: item.left, animationDelay: item.delay }} />
    ))}
  </div>
);

// ####################################################################################
// ########################### INICIO DO CÓDIGO ANDROID ###############################
// ####################################################################################

// ####################################################################################
// ########################### INICIO DO CÓDIGO IOS ###################################
// ####################################################################################

function AppIOS() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Iniciando protocolos...');
  const [prizeType, setPrizeType] = useState(null);
  const [isLuckyWin, setIsLuckyWin] = useState(false);
  const [participantNumber, setParticipantNumber] = useState(null);
  const [leads, setLeads] = useState([]);
  const [adminPass, setAdminPass] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [selectedFlash, setSelectedFlash] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [showRegulations, setShowRegulations] = useState(false); 
  const [termsAccepted, setTermsAccepted] = useState(false); 
  const timerRef = useRef(null);

  // --- BLOQUEIOS RÍGIDOS IOS ---
  const [isSafeDevice, setIsSafeDevice] = useState(() => safeStorage.getItem('sumar_admin_immunity') === 'true');
  
  const [isBlocked, setIsBlocked] = useState(() => {
    // Se já existe flag de bloqueio ou se o usuário já tentou acessar antes nesta sessão/aparelho
    const blocked = safeStorage.getItem('sumar_promo_blocked') === 'true';
    const alreadyHadSession = safeSession.getItem('sumar_session_started') === 'true' && !safeStorage.getItem('sumar_startTime');
    return blocked || alreadyHadSession;
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = safeStorage.getItem('sumar_timer');
    return saved !== null ? parseInt(saved, 10) : 600; 
  });

  // Validação de segurança ao montar o componente
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (!isSafeDevice) {
      // Bloqueio de Re-acesso: Se ele já entrou na conexão uma vez e recarregou a página, bloqueia.
      if (safeStorage.getItem('sumar_already_accessed') === 'true' && !safeSession.getItem('sumar_session_active')) {
        setIsBlocked(true);
        safeStorage.setItem('sumar_promo_blocked', 'true');
      }
    }
  }, [isSafeDevice]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else { await signInAnonymously(auth); }
      } catch (err) { console.error("Auth error"); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const leadsRef = getLeadsCollection();
    const unsubscribe = onSnapshot(leadsRef, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setLeads(list);
    });
    return () => unsubscribe();
  }, [user]);

  // Monitoramento de Bloqueio e Tempo
  useEffect(() => {
    if (isBlocked && !['expired', 'admin', 'success'].includes(view)) { 
        setView('expired'); 
    }

    if (timeLeft <= 0 && !['home', 'success', 'admin', 'loading', 'expired'].includes(view)) {
      safeStorage.setItem('sumar_promo_blocked', 'true');
      setIsBlocked(true);
      setView('expired');
    }
    
    if (timeLeft >= 0 && timeLeft <= 600) { 
        safeStorage.setItem('sumar_timer', timeLeft.toString()); 
    }
  }, [timeLeft, view, isBlocked]);

  useEffect(() => {
    const timerActiveStages = ['connection_failed', 'result', 'catalog', 'form'];
    if (timerActiveStages.includes(view) && !isBlocked) {
      if (!safeStorage.getItem('sumar_startTime')) {
        safeStorage.setItem('sumar_startTime', Date.now().toString());
        safeStorage.setItem('sumar_already_accessed', 'true');
        safeSession.setItem('sumar_session_active', 'true');
      }

      timerRef.current = setInterval(() => {
        const start = parseInt(safeStorage.getItem('sumar_startTime') || '0', 10);
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remaining = 600 - elapsed;
        
        if (remaining <= 0) {
            setTimeLeft(0);
            setIsBlocked(true);
            safeStorage.setItem('sumar_promo_blocked', 'true');
            clearInterval(timerRef.current);
        } else {
            setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, isBlocked]);

  const startConnection = () => {
    // No iOS, marcamos a intenção de acesso no milissegundo que ele clica
    safeSession.setItem('sumar_session_started', 'true');
    
    setView('loading');
    setLoadingProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 5; 
      if (p > 100) p = 100;
      setLoadingProgress(p);
      
      if (p < 30) setStatusMsg("Validando integridade iOS...");
      else if (p < 60) setStatusMsg("Protegendo sessão contra reset...");
      else setStatusMsg("Finalizando conexão segura...");

      if (p >= 100) {
        clearInterval(interval);
        if (safeStorage.getItem('sumar_promo_blocked') === 'true' || isBlocked) {
          setView('expired');
        } else {
          setView('connection_failed');
        }
      }
    }, 100);
  };

  const determinePrize = () => {
    const confirmedFree = leads.filter(l => l.prize === 'free').length;
    const confirmedDiscount = leads.filter(l => l.prize === 'discount').length;
    const currentParticipantNum = confirmedFree + confirmedDiscount + 1;
    setParticipantNumber(currentParticipantNum);
    if (confirmedFree < 10) { setPrizeType('free'); setIsLuckyWin(currentParticipantNum > 10); }
    else if (confirmedDiscount < 10) { setPrizeType('discount'); setIsLuckyWin(currentParticipantNum > 20); }
    else { setPrizeType('none'); setIsLuckyWin(false); }
    setView('result');
  };

  const handleFinalConfirm = async () => {
    if (!customerName) return alert("Por favor, informe seu nome!");
    if (!selectedFlash) return alert("Selecione uma arte!");
    try {
      const leadsRef = getLeadsCollection();
      await addDoc(leadsRef, { name: customerName, prize: prizeType, selected_flash: selectedFlash.name, participant_n: participantNumber, created_at: serverTimestamp() });
      
      // Bloqueio permanente pós-conclusão
      safeStorage.setItem('sumar_promo_blocked', 'true');
      
      const prizeLabel = prizeType === 'free' ? 'FLASH TATTOO GRÁTIS' : '50% DE DESCONTO';
      const msg = `Oi, eu sou ${customerName} e sou o ${participantNumber}º participante. Acabei de validar o meu cupom de ${prizeLabel}! Escolhi a arte: ${selectedFlash.name}.`;
      window.open(`https://wa.me/5581994909686?text=${encodeURIComponent(msg)}`, '_blank');
      setView('success');
    } catch (e) { alert("Erro ao salvar."); }
  };

  const unlockAdmin = () => { if (adminPass === 'SumaR321') { setIsAdminUnlocked(true); } else { alert("Acesso negado."); } };

  const grantAdminImmunity = () => {
    safeStorage.clear(); safeSession.clear();
    safeStorage.setItem('sumar_admin_immunity', 'true'); 
    setIsSafeDevice(true); setIsBlocked(false); setTimeLeft(600); 
    alert("MODO ADMINISTRADOR: BLOQUEIOS REMOVIDOS"); setView('home');
  };

  const deleteSelectedLeads = async () => {
    if (selectedLeadIds.length === 0) return;
    const batch = writeBatch(db);
    selectedLeadIds.forEach(id => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'leads', id)));
    await batch.commit(); setSelectedLeadIds([]);
  };

  // Renderização de Visual (Fiel ao Original)
  if (view === 'admin') { /* ... (Mesmo código do Admin Android) ... */ 
    return (
        <div style={styles.container}>
          <BackgroundDrift />
          <div style={styles.box}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'12px', flexShrink: 0}}>
              <h2 style={{color:'#ff003c', margin:0, fontSize: '16px', fontWeight: '800'}}>PAINEL OPERACIONAL (iOS)</h2>
              <button onClick={() => setView('home')} style={{background:'none', border:'none', color:'#888', textDecoration:'underline', cursor:'pointer', fontSize:'11px'}}>SAIR</button>
            </div>
            {!isAdminUnlocked ? (
              <div style={styles.contentCenter}>
                <input type="password" placeholder="Senha Mestra" style={styles.input} value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                <button onClick={unlockAdmin} style={styles.btn}>AUTENTICAR</button>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection: 'column', height: '100%'}}>
                <div style={styles.scrollArea}>
                  {leads.map(l => (
                    <div key={l.id} onClick={() => setSelectedLeadIds(prev => prev.includes(l.id) ? prev.filter(i => i !== l.id) : [...prev, l.id])} style={{display:'flex', gap:'12px', padding:'12px', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems: 'center', cursor: 'pointer', backgroundColor: selectedLeadIds.includes(l.id) ? 'rgba(255, 0, 60, 0.05)' : 'transparent', borderRadius: '8px'}}>
                      {selectedLeadIds.includes(l.id) ? <CheckSquare size={16} color="#ff003c" /> : <Square size={16} color="#555" />}
                      <div style={{fontSize:'12px'}}><div style={{fontWeight:'700'}}>{l.name}</div><div style={{color:'#666', fontSize: '10px'}}>{l.prize === 'free' ? 'Grátis' : '50% Off'}</div></div>
                    </div>
                  ))}
                </div>
                <button onClick={deleteSelectedLeads} style={{...styles.btn, backgroundColor:'transparent', border: '1px solid #ff003c', color: '#ff003c', marginBottom: '10px'}}>APAGAR SELECIONADOS</button>
                <button onClick={grantAdminImmunity} style={{...styles.btn, backgroundColor: '#00c853'}}>LIMPAR MEU BLOQUEIO (ADM)</button>
              </div>
            )}
          </div>
        </div>
      );
  }

  if (view === 'expired') {
    return (
      <div style={styles.container}><BackgroundDrift /><div style={styles.box}><div style={styles.contentCenter}><AlarmClock size={42} color="#ff4444" /><h1 style={{ color: '#ff003c', fontWeight: '900', textAlign: 'center' }}>ACESSO INVALIDADO</h1><p style={{ textAlign: 'center', fontSize: '13px' }}>Detectamos uma tentativa de re-acesso ou o tempo de segurança expirou. Por integridade da promoção, sua sessão foi encerrada.</p><button onClick={() => window.open('https://wa.me/5581994909686')} style={{ ...styles.btn, backgroundColor: '#25D366' }}>SUPORTE WHATSAPP</button></div></div></div>
    );
  }

  return (
    <div style={styles.container}><BackgroundDrift /><div style={styles.box}>
        {!['home', 'loading', 'admin', 'expired'].includes(view) && <div style={styles.timer}><Clock size={12}/> {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>}
        
        {view === 'home' && (
            <div style={{...styles.contentCenter, textAlign:'center'}}><Wifi size={40} color="#ff003c" /><h1 style={{fontSize:'36px', fontWeight:'900', color: '#fff'}}>SUMAR</h1><p>Conecte-se para liberar seu cupom iOS.</p><button onClick={startConnection} disabled={!termsAccepted} style={{...styles.btn, opacity: termsAccepted ? 1 : 0.5}}>INICIAR CONEXÃO</button><div style={{marginTop: '15px'}}><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} id="termsCheckIOS"/><label htmlFor="termsCheckIOS" style={{fontSize: '12px', color: '#ccc', marginLeft: '8px'}}>Aceito os termos da promoção</label></div><button onClick={() => setView('admin')} style={styles.adminToggle}><Settings size={18}/></button></div>
        )}

        {view === 'loading' && (
            <div style={{...styles.contentCenter, textAlign:'center'}}><h2>CONECTANDO...</h2><div style={{width:'80%', height:'8px', backgroundColor:'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden'}}><div style={{height:'100%', backgroundColor:'#ff003c', width: `${loadingProgress}%`, transition:'width 0.2s'}}></div></div><p>{statusMsg}</p></div>
        )}

        {view === 'connection_failed' && (
          <div style={{...styles.contentCenter, textAlign:'center'}}><AlertTriangle size={28} color="#ff003c" /><h1>ERRO DE REDE</h1><p>Não foi possível validar seu Wi-Fi, mas sua vaga foi reservada por 10 minutos!</p><button onClick={determinePrize} style={styles.btn}>VER MINHA PREMIAÇÃO</button></div>
        )}

        {view === 'result' && (
          <div style={{...styles.contentCenter, textAlign:'center'}}>{prizeType === 'none' ? (<div><h1>😔</h1><p>Vagas esgotadas.</p></div>) : (<div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}><div style={{backgroundColor:'#fff', color:'#000', padding:'20px', borderRadius: '16px', fontWeight:'900', width: '90%'}}>{prizeType === 'free' ? 'TATUAGEM GRÁTIS' : '50% DE DESCONTO'}</div><button onClick={() => setView('catalog')} style={{...styles.btn, marginTop: '20px'}}>ESCOLHER ARTE</button></div>)}</div>
        )}

        {view === 'catalog' && (
          <div style={{display: 'flex', flexDirection: 'column', height: '100%', paddingTop: '60px'}}><h2 style={{textAlign: 'center'}}>CATÁLOGO</h2><div style={styles.scrollArea}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>{CATALOG_IMAGES.map(img => ( <div key={img.id} onClick={() => setSelectedFlash(img)} style={{ border: selectedFlash?.id === img.id ? '2px solid #ff003c' : '1px solid #333', padding:'4px', borderRadius: '8px' }}><img src={img.src} style={{ width:'100%', borderRadius: '4px' }} /></div> ))}</div></div><button onClick={() => selectedFlash ? setView('form') : alert("Selecione!")} style={styles.btn}>CONTINUAR</button></div>
        )}

        {view === 'form' && (
          <div style={{...styles.contentCenter, textAlign: 'center'}}><h2>IDENTIFICAÇÃO</h2><input type="text" placeholder="Seu Nome" style={styles.input} value={customerName} onChange={e => setCustomerName(e.target.value)} /><button onClick={handleFinalConfirm} style={styles.btn}>RESGATAR CUPOM</button></div>
        )}

        {view === 'success' && (
          <div style={{...styles.contentCenter, textAlign:'center'}}><CheckSquare size={40} color="#00ff64" /><h2>SUCESSO!</h2><p>Vaga garantida. O estúdio aguarda seu contato.</p></div>
        )}
      </div>
    </div>
  );
}


// ####################################################################################
// ########################### COMPONENTE DE SELEÇÃO ##################################
// ####################################################################################

export default function App() {
  const [os, setOs] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      setOs('android');
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setOs('ios');
    } else {
      setOs('android'); // Default para outros sistemas (como PC)
    }
  }, []);

  if (os === 'ios') return <AppIOS />;
  if (os === 'android') return <AppAndroid />;
  
  return <div style={{backgroundColor: '#050505', height: '100vh'}} />; // Splash de carregamento rápido
}
