import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, onSnapshot, collection, addDoc, setDoc, updateDoc, serverTimestamp, writeBatch, increment } from "firebase/firestore";
import { 
  Settings, CheckSquare, Square, Skull, Flower, Zap, Anchor, Scissors, Wifi, Clock, ArrowRight, AlertTriangle, Trash2, RefreshCcw, LogOut, User, Lock, MessageCircle, ShieldCheck, AlarmClock, Instagram, FileText, Globe, Copy, BarChart2, Moon, WifiOff
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
const getLockDoc = () => doc(db, 'artifacts', appId, 'public', 'data', 'config', 'global_lock');
const getMetricsDoc = () => doc(db, 'artifacts', appId, 'public', 'data', 'config', 'analytics');

// --- LÓGICA DE HORÁRIO ---
const checkIsOutsideSchedule = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (Dom), 1 (Seg), ..., 4 (Qui), 5 (Sex), 6 (Sáb)
  const hour = now.getHours();

  // Janela 1: Começa Quinta/Sexta/Sábado/Domingo às 19:00 e vai até meia-noite
  const isStartDay = [4, 5, 6, 0].includes(day) && hour >= 19;
  
  // Janela 2: Continua Sexta/Sábado/Domingo/Segunda até às 02:59:59 (fim da noite anterior)
  const isEndDay = [5, 6, 0, 1].includes(day) && hour < 3;

  return !(isStartDay || isEndDay);
};

// --- BLINDAGEM DE ARMAZENAMENTO (3 CAMADAS) ---
const safeStorage = {
  getItem: (key) => { 
    try { 
      let val = localStorage.getItem(key);
      if (!val) val = sessionStorage.getItem(key);
      if (!val) {
        const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
        if (match) val = match[2];
      }
      return val; 
    } catch (e) { return null; } 
  },
  setItem: (key, value) => { 
    try { 
      localStorage.setItem(key, value); 
      sessionStorage.setItem(key, value);
      document.cookie = key + "=" + value + "; max-age=31536000; path=/";
    } catch (e) {} 
  },
  removeItem: (key) => { 
    try { 
      localStorage.removeItem(key); 
      sessionStorage.removeItem(key);
      document.cookie = key + "=; max-age=0; path=/";
    } catch (e) {} 
  }
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
  {id: 30, name: "Flash 30 - PLANET", src: "https://i.postimg.cc/fWxxdsKK/PLANET.png/400x400/111/fff?text=PLANET" },
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

// --- COMPONENTE DO REGULAMENTO (REUTILIZÁVEL) ---
const RegulationModal = ({ onClose }) => (
  <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
    <div style={{backgroundColor: '#121212', width: '90%', maxWidth: '380px', maxHeight: '80vh', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column', color: '#ddd'}}>
      <div style={{padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h3 style={{margin: 0, color: '#ff003c', fontSize: '15px', fontWeight: '800'}}>REGULAMENTO OFICIAL</h3>
        <button onClick={onClose} style={{background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', lineHeight: 1}}>&times;</button>
      </div>
      <div style={{padding: '20px', overflowY: 'auto', fontSize: '12.5px', lineHeight: '1.6', textAlign: 'left'}}>
        <p style={{marginBottom: '15px', fontWeight:'bold'}}>REGULAMENTO OFICIAL – CAMPANHA "FLASH TATTOO SUMAR ESTÚDIO"</p>
        <p style={{marginBottom: '15px'}}>Este documento estabelece as regras e condições para participação na campanha promocional realizada pelo SUMAR ESTÚDIO, doravante denominado "ESTÚDIO". Ao participar da ação digital, o usuário concorda integralmente com os termos abaixo.</p>
        
        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>1. DO PERÍODO E VIGÊNCIA</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>1.1. A campanha terá início em 26/02/2026 e encerramento previsto para 31/03/2026.</li>
          <li>1.2. A ação poderá ser encerrada antecipadamente caso o limite total de 20 (vinte) cupons premiados seja atingido antes da data final.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>2. DA MECÂNICA DA PARTICIPAÇÃO</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>2.1. A campanha ocorre exclusivamente via plataforma digital do Estúdio, sendo o acesso estritamente limitado à leitura do QR Code oficial presencialmente.</li>
          <li>2.2. A distribuição dos prêmios segue a ordem de chegada e conclusão do cadastro no sistema (ordem cronológica de validação).</li>
          <li>2.3. O sistema disponibiliza 20 (vinte) vagas, distribuídas da seguinte forma:<br/>– As 10 (dez) primeiras validações confirmadas recebem 100% de desconto (Tatuagem Grátis).<br/>Da 11ª à 20ª validação confirmada ganham: 50% de desconto.<br/>Os prêmios estão sujeitos às condições, limites de valor e regras previstas no Item 3 deste regulamento.</li>
          <li>2.4. O sistema possui um cronômetro de segurança de 10 minutos. Caso o participante não conclua o processo dentro deste tempo, a vaga é liberada para outro usuário.</li>
          <li>2.5. O sistema só permite 1 participação por pessoa e irá bloquear qualquer tentativa de nova participação.</li>
          <li>2.6. O sistema esta projetado para cancelar a participação do candidato em caso de atualização de pagina, fechamento de aba e vencimento do tempo de produção. Cada participante terá uma chance única e exclusiva sem direito a novas tentativas.</li>
          <li>2.7. O sistema opera com uma trava de segurança temporal. Após um lead gerado, o acesso pode ser suspenso temporariamente para novas entradas, sendo reestabelecido automaticamente para dar chance a outros grupos.</li>
          <li>2.8. O sistema funciona exclusivamente de quinta a domingo, das 19h às 03h. Fora deste período, a plataforma permanecerá inativa.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>3. DOS PRÊMIOS E VALORES</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
           <li>3.1. Tatuagem Grátis (1º ao 10º lugar):<br> Isenção total do valor da tatuagem, respeitado o limite máximo de R$ 200,00 por procedimento.</li>
           <li>3.2. Desconto de 50% (11º ao 20º lugar):<br>O desconto de 50% será aplicado sobre o valor da arte escolhida, limitado ao desconto mínimo de R$ 55,00 e máximo de R$ 100,00.</li>
           <li>3.3. Limite de valor da promoção: <br>A campanha é válida exclusivamente para tatuagens cujo valor final seja de até R$ 200,00.<br>Valores superiores poderão ser complementados pelo cliente, mediante pagamento da diferença.</li>
           <li>3.4. DOS CUSTOS ADICIONAIS E CUIDADOS:<br>Despesas como transporte, alimentação, pomadas cicatrizantes, medicamentos ou quaisquer outros cuidados pré e pós-procedimento são de responsabilidade exclusiva do participante.<br>O Sumar Estúdio não realiza reembolso de valores relacionados a esses itens.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>4. DAS ARTES E PROCEDIMENTO</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>4.1. A promoção é válida exclusivamente para as artes (Flashs) disponíveis no catálogo da campanha.</li>
          <li>4.2. Alterações: Não serão permitidas alterações no desenho (mudança de traço, elementos, etc). As únicas adaptações permitidas referem-se ao tamanho e enquadramento anatômico, desde que respeitem o teto de valor (Item 3.3).</li>
          <li>4.3. A promoção é válida exclusivamente para tatuagens novas (pele limpa), não contemplando procedimentos de cobertura (cover-up) ou reforma de trabalhos anteriores.<br>A viabilidade da região do corpo escolhida deverá ser previamente avaliada pelo estúdio.</li>
          <li>4.4. O procedimento deverá ser realizado em sessão única.<br>Caso seja necessária nova sessão por motivo relacionado ao cliente, poderá ser cobrada taxa adicional referente a material e biossegurança.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>5. DO AGENDAMENTO E VALIDAÇÃO</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>5.1. Após a confirmação na tela, o ganhador tem o prazo de 24 horas para entrar em contato via WhatsApp e confirmar a validação do cupom.</li>
          <<li>5.2. Prazos:<br>O agendamento da data deve ser feito em até 24 horas após o contato inicial.<br>A realização da tatuagem deve ocorrer dentro de 1 mês (30 dias) a contar da data de confirmação.</li>
          <li>5.3. Transferência de Titularidade: O ganhador deve informar, no momento do primeiro contato via WhatsApp, quem será a pessoa tatuada (nome completo e dados). Caso o ganhador não informe os dados ou decida alterar a pessoa beneficiada após a confirmação, o prêmio será cancelado e a vaga disponibilizada novamente na plataforma.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>6. CANCELAMENTO E "NO-SHOW"</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>6.1. O não comparecimento na data e hora agendadas, sem aviso prévio ou justificativa aceita pelo estúdio, resultará no cancelamento automático do prêmio.</li>
          <li>6.2. En caso de cancelamento por não comparecimento, a vaga será reaberta no sistema para um novo participante, mantendo a regra de distribuição dos prêmios (10 grátis / 10 descontos).</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>7. DO DIREITO DE USO DE IMAGEM</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>7.1. Ao participar desta campanha e realizar o procedimento, o(a) participante autoriza, de forma gratuita, irrevogável, irretratável e universal, o uso de sua imagem e voz, bem como das imagens da tatuagem realizada (antes, durante e depois do procedimento).</li>
          <li>7.2. O Sumar Estúdio fica autorizado a utilizar o material captado para fins de divulgação, publicidade, composição de portfólio e marketing em quaisquer meios de comunicação, incluindo, mas não se limitando a: redes sociais (Instagram, TikTok, Facebook, etc.), site oficial, materiais impressos e exposições.</li>
          <li>7.3. A presente autorização é concedida a título gratuito, não gerando ao participante qualquer direito a remuneração, indenização, royalties ou compensação financeira de qualquer natureza pelo uso de sua imagem associada ao trabalho artístico do Estúdio.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>8. ISENÇÃO DOS LOCAIS DE DIVULGAÇÃO</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>8.1. Os estabelecimentos onde os QR Codes estão fixados são apenas pontos de divulgação passiva, não tendo qualquer responsabilidade sobre a promoção, entrega de prêmios ou suporte técnico.</li>
          <li>8.2. É proibida a participação de funcionários dos estabelecimentos parceiros. Cadastros identificados serão cancelados e a vaga repassada ao próximo participante.</li>
        </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>9. DA PRIVACIDADE E PROTEÇÃO DE DADOS</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>9.1. A campanha observa os princípios da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</li>
          <li>9.2. A participação na campanha não exige cadastro prévio, criação de conta ou fornecimento automático de dados pessoais para simples acesso à plataforma.</li>
          <li>9.3. O sistema não realiza coleta automática de e-mails, telefones ou geração de banco de dados para fins de publicidade.</li>
          <li>9.4. O contato com o Estúdio ocorre exclusivamente por iniciativa do participante, via WhatsApp, caso este deseje validar seu cupom premiado.</li>
          <li>9.5. Os dados informados para fins de agendamento e validação do prêmio serão utilizados exclusivamente para a execução da campanha, não sendo compartilhados com terceiros nem utilizados para envio de comunicações promocionais futuras sem autorização expressa do participante.</li>
          <li>9.6. O Estúdio preza pela confidencialidade, privacidade e segurança das informações eventualmente fornecidas.</li>
            </ul>

        <h4 style={{color: '#fff', margin: '15px 0 5px', fontSize: '13px'}}>10. DISPOSIÇÕES TÉCNICAS E GERAIS</h4>
        <ul style={{paddingLeft: '20px', margin: '5px 0'}}>
          <li>10.1. Falhas Tecnológicas: O Estúdio não se responsabiliza por falhas na conexão de internet do participante, travamentos de dispositivos, falhas de bateria ou oscilações de rede que impeçam a conclusão do cadastro dentro do tempo limite ou o envio do formulário.</li>
          <li>10.2. Apenas participantes que chegarem à tela de "Sucesso" e possuírem o registro validado junto ao estúdio terão direito ao prêmio.</li>
          <li>10.3. O Estúdio reserva-se o direito de desclassificar qualquer participante que utilize meios robóticos, ilícitos ou que violem os termos de uso para obter vantagens na campanha.</li>
          <li>10.4. Os casos omissos neste regulamento serão resolvidos pela administração do Sumar Estúdio.</li>
            </ul>

        <div style={{marginTop: '20px', fontSize: '11px', color: '#888', textAlign: 'center', borderTop: '1px solid #333', paddingTop: '10px'}}>
          Sumar Estúdio<br/>Recife/PE
        </div>
      </div>
    </div>
  </div>
);

// ####################################################################################
// ########################### INICIO DO CÓDIGO ANDROID ###############################
// ####################################################################################
function AppAndroid() {
  const [user, setUser] = useState(null);
  
  // Detecção de Navegadores Instáveis (Safari ou In-App)
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  const isSocialBrowser = /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
  const isRestrictedBrowser = isSafari || isSocialBrowser;

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
  const [evaluatingAccess, setEvaluatingAccess] = useState(true); 
  const [metrics, setMetrics] = useState({ home_load: 0, restricted_browser: 0, overload_lock: 0, reentry_attempt: 0 });
  const timerRef = useRef(null);
  
  // Controle de Trava Global
  const [lastConfirmedAt, setLastConfirmedAt] = useState(0);
  const [isLockLoaded, setIsLockLoaded] = useState(false);

  // A imunidade de administrador agora é temporária (safeSession)
  const [isSafeDevice, setIsSafeDevice] = useState(() => safeSession.getItem('sumar_admin_immunity') === 'true');
  const [isBlocked, setIsBlocked] = useState(() => safeStorage.getItem('sumar_promo_blocked') === 'true');
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = safeStorage.getItem('sumar_timer');
    return saved !== null ? parseInt(saved, 10) : 600; 
  });

  // Função centralizada para registro de métricas
  const logMetric = async (field) => {
    if (!user) return;
    try {
      await updateDoc(getMetricsDoc(), { [field]: increment(1) });
    } catch (e) {
      await setDoc(getMetricsDoc(), { [field]: 1 }, { merge: true });
    }
  };

  // --- LÓGICA ATÔMICA DE MASCARAMENTO E PREVENÇÃO DE COMPARTILHAMENTO ---
  useLayoutEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id');
    const qrToken = urlParams.get('qr');
    const accessToken = urlParams.get('access');
    
    // A imunidade de administrador agora é temporária (safeSession)
    const isImmune = safeSession.getItem('sumar_admin_immunity') === 'true';
    const now = Date.now();

    // Se for o admin imune, passa direto e limpa a URL de qualquer token
    if (isImmune) {
      if (rawId || qrToken || accessToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setEvaluatingAccess(false);
      return;
    }

    // 1. Hard Redirect (QR Code Físico -> Token Temporal 30s)
    if (rawId === 'estudio') {
      window.location.replace(window.location.origin + window.location.pathname + '?qr=' + now);
      return;
    }

    // 2. Validação Android (30 segundos de limite)
    if (qrToken) {
      if (now - parseInt(qrToken, 10) <= 30000) {
        safeSession.setItem('sumar_qr_validated', 'true');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
        setView('qr_required');
      }
    } 
    // 3. Validação iOS / Botão Copiar (60 segundos de limite)
    else if (accessToken) {
      if (now - parseInt(accessToken, 10) <= 60000) {
        safeSession.setItem('sumar_qr_validated', 'true');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        window.history.replaceState({}, document.title, window.location.pathname);
        setView('qr_required');
      }
    } 
    // 4. Fluxo normal (sem tokens na URL, valida se a sessão já está autorizada)
    else {
      const isValidated = safeSession.getItem('sumar_qr_validated') === 'true';
      if (!isValidated) {
        setView('qr_required');
      }
    }
    
    setEvaluatingAccess(false);
  }, []);

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
    const unsubscribeLeads = onSnapshot(leadsRef, (snap) => {
      const list = [];
      const now = Date.now();
      snap.forEach(d => {
        const data = d.data();
        let currentStatus = data.status || 'Pendente';
        // Regra de Exclusão de 24h para leads Pendentes
        if (currentStatus === 'Pendente' && data.created_at) {
           const leadTime = data.created_at.toMillis();
           if ((now - leadTime) > 24 * 60 * 60 * 1000) {
              currentStatus = 'Expirado';
           }
        }
        list.push({ id: d.id, ...data, status: currentStatus });
      });
      list.sort((a, b) => (a.participant_n || 0) - (b.participant_n || 0));
      setLeads(list);
    });
    
    const lockRef = getLockDoc();
    const unsubscribeLock = onSnapshot(lockRef, (snap) => {
      if (snap.exists()) { setLastConfirmedAt(snap.data().timestamp || 0); }
      setIsLockLoaded(true);
    });

    const metricsRef = getMetricsDoc();
    const unsubscribeMetrics = onSnapshot(metricsRef, (snap) => {
      if (snap.exists()) setMetrics(snap.data());
    });

    return () => { unsubscribeLeads(); unsubscribeLock(); unsubscribeMetrics(); };
  }, [user]);

  useEffect(() => {
    // A trava de reincidência agora só será aplicada via startConnection no loading final
    if (timeLeft === 0 && !['home', 'success', 'admin', 'loading', 'expired', 'qr_required'].includes(view)) {
      safeStorage.setItem('sumar_promo_blocked', 'true');
      setIsBlocked(true);
      setView('expired');
    }
    if (timeLeft >= 0 && timeLeft <= 600) { safeStorage.setItem('sumar_timer', timeLeft.toString()); }
  }, [timeLeft, view]);

  useEffect(() => {
    const timerActiveStages = ['connection_failed', 'result', 'catalog', 'form'];
    if (timerActiveStages.includes(view) && !isBlocked) {
      if (view === 'connection_failed' && !safeStorage.getItem('sumar_startTime')) {
        safeStorage.setItem('sumar_startTime', Date.now().toString());
        safeSession.setItem('sumar_sessionActive', 'true');
      }
      timerRef.current = setInterval(() => {
        const start = parseInt(safeStorage.getItem('sumar_startTime') || '0', 10);
        if (start > 0) {
           const elapsed = Math.floor((Date.now() - start) / 1000);
           const remaining = 600 - elapsed;
           setTimeLeft(remaining > 0 ? remaining : 0);
        } else { setTimeLeft(p => (p > 0 ? p - 1 : 0)); }
      }, 1000);
    } else { if (timerRef.current) clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, isBlocked]);

  // Logging silencioco de Métricas de Tela Principal
  const hasLoggedHome = useRef(false);
  useEffect(() => {
    if (view === 'home' && !hasLoggedHome.current && user && !evaluatingAccess) {
      logMetric('home_load');
      hasLoggedHome.current = true;
    }
  }, [view, user, evaluatingAccess]);

  const hasLoggedReentry = useRef(false);
  useEffect(() => {
    if (view === 'expired' && !hasLoggedReentry.current && user) {
      logMetric('reentry_attempt');
      hasLoggedReentry.current = true;
    }
  }, [view, user]);

  const isGlobalLocked = (Date.now() - lastConfirmedAt) < 2220000;
  
  // HIERARQUIA DE RENDERIZAÇÃO DE BLOQUEIOS IMEDIATOS

  // 1. FORA DO ESTABELECIMENTO / SEM TOKEN (Corta o mal pela raiz)
  if (view === 'qr_required') return <QRRequiredScreen onAdmin={() => setView('admin')} onReg={() => setShowRegulations(true)} regVisible={showRegulations} onRegClose={() => setShowRegulations(false)} />;

  // 2. TRAVA DE HORÁRIO (A regra suprema)
  if (checkIsOutsideSchedule() && !isSafeDevice && view !== 'admin') {
    return <ScheduleLockScreen onAdmin={() => setView('admin')} onReg={() => setShowRegulations(true)} regVisible={showRegulations} onRegClose={() => setShowRegulations(false)} />;
  }

  // 3. SOBRECARGA DE SISTEMA (Trava de Leads)
  if (isGlobalLocked && ['home', 'loading'].includes(view) && !isAdminUnlocked) return <LeadLockScreen onAdmin={() => setView('admin')} onReg={() => setShowRegulations(true)} regVisible={showRegulations} onRegClose={() => setShowRegulations(false)} onLog={() => logMetric('overload_lock')} />;

  // 4. NAVEGADOR RESTRITO / IOS
  if (isRestrictedBrowser && !isSafeDevice) return <AppIOS onLog={() => logMetric('restricted_browser')} />;

  const startConnection = () => {
    setView('loading');
    setLoadingProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 6; 
      if (p > 100) p = 100;
      setLoadingProgress(p);
      if (p < 20) setStatusMsg("Escaneando canais de rede...");
      else if (p < 40) setStatusMsg("Validando SSL do Estúdio...");
      else if (p < 60) setStatusMsg("Otimizando gateway de acesso...");
      else if (p < 80) setStatusMsg("Sincronizando banco de vagas...");
      else setStatusMsg("Finalizando túnel seguro...");
      if (p >= 100) {
        clearInterval(interval);
        // Verificação Psicológica Final (após os 37 min ou em refresh)
        const alreadyAccessed = safeStorage.getItem('sumar_already_accessed') === 'true';
        if (alreadyAccessed || isBlocked) {
          safeStorage.setItem('sumar_promo_blocked', 'true');
          setIsBlocked(true);
          setView('expired');
        } else {
          safeStorage.setItem('sumar_already_accessed', 'true');
          setView('connection_failed');
        }
      }
    }, 120);
  };

  const determinePrize = () => {
    const activeLeads = leads.filter(l => l.status !== 'Expirado');
    const confirmedFree = activeLeads.filter(l => l.prize === 'free').length;
    const confirmedDiscount = activeLeads.filter(l => l.prize === 'discount').length;
    
    // O número cronológico é baseado no total real, para não repetir em caso de desistência
    const currentParticipantNum = leads.length + 1; 
    setParticipantNumber(currentParticipantNum);
    
    if (confirmedFree < 10) { setPrizeType('free'); setIsLuckyWin(currentParticipantNum > 10); }
    else if (confirmedDiscount < 10) { setPrizeType('discount'); setIsLuckyWin(currentParticipantNum > 20); }
    else { setPrizeType('none'); setIsLuckyWin(false); }
    setView('result');
  };

  const handleFinalConfirm = async () => {
    if (!customerName) return alert("Por favor, informe seu nome!");
    if (!selectedFlash) return alert("Selecione uma arte!");
    const activeTakenImages = leads.filter(l => l.status !== 'Expirado').map(l => l.selected_flash);
    if (activeTakenImages.includes(selectedFlash.name)) {
      alert("Desculpe! Esta arte acabou de ser selecionada por outro participante. Por favor, escolha outra.");
      setView('catalog'); setSelectedFlash(null); return;
    }
    try {
      const leadsRef = getLeadsCollection();
      const lockRef = getLockDoc();
      await addDoc(leadsRef, { name: customerName, prize: prizeType, selected_flash: selectedFlash.name, participant_n: participantNumber, status: 'Pendente', created_at: serverTimestamp() });
      await setDoc(lockRef, { timestamp: Date.now() });
      const prizeLabel = prizeType === 'free' ? 'FLASH TATTOO GRÁTIS' : '50% DE DESCONTO';
      const msg = `Oi! Sou ${customerName}, ${participantNumber}º da promo. Validei meu cupom de ${prizeLabel}! Arte: ${selectedFlash.name}. Imagem: ${selectedFlash.src}`;
      window.open(`https://wa.me/5581994909686?text=${encodeURIComponent(msg)}`, '_blank');
      setView('success');
    } catch (e) { alert("Erro ao salvar."); }
  };

  const unlockAdmin = () => { 
    const hashPass = btoa(adminPass.split('').reverse().join(''));
    if (hashPass === 'MTIzUmFtdVM=') { 
      setIsAdminUnlocked(true); 
    } else { 
      alert("Acesso negado."); 
    } 
  };

  const grantAdminImmunity = () => {
    safeStorage.removeItem('sumar_promo_blocked'); safeStorage.removeItem('sumar_timer'); safeStorage.removeItem('sumar_startTime'); safeStorage.removeItem('sumar_already_accessed'); safeSession.removeItem('sumar_sessionActive');
    
    // Limpa registros antigos permanentes para evitar "imortalidade" após os testes
    safeStorage.removeItem('sumar_admin_immunity'); 
    
    // Grava apenas na sessão temporária
    safeSession.setItem('sumar_admin_immunity', 'true'); 
    
    setIsSafeDevice(true); setIsBlocked(false); setTimeLeft(600); 
    alert("IMUNIDADE DE ADMINISTRADOR ATIVADA! (Sessão temporária)"); setView('home');
  };

  const confirmLead = async (id) => {
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'leads', id), { status: 'Confirmado' });
    } catch (e) { alert("Erro ao confirmar."); }
  };

  const deleteSelectedLeads = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Apagar ${selectedLeadIds.length} contatos?`)) return;
    try {
      const batch = writeBatch(db);
      selectedLeadIds.forEach(id => { const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'leads', id); batch.delete(docRef); });
      await batch.commit(); setSelectedLeadIds([]);
    } catch (e) { alert("Erro ao apagar."); }
  };

  const resetMetrics = async () => {
    if (!window.confirm("Zerar todas as estatísticas?")) return;
    try {
      await setDoc(getMetricsDoc(), { home_load: 0, restricted_browser: 0, overload_lock: 0, reentry_attempt: 0 });
    } catch (e) { alert("Erro ao zerar estatísticas."); }
  };

  if (view === 'admin') {
    const activeFreeCount = leads.filter(l => l.prize === 'free' && l.status !== 'Expirado').length;
    const activeDiscountCount = leads.filter(l => l.prize === 'discount' && l.status !== 'Expirado').length;

    return (
      <div style={styles.container}>
        <BackgroundDrift />
        <div style={styles.box}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'12px', flexShrink: 0}}><h2 style={{color:'#ff003c', margin:0, fontSize: '16px', fontWeight: '800'}}>PAINEL OPERACIONAL</h2><button onClick={() => setView('home')} style={{background:'none', border:'none', color:'#888', textDecoration:'underline', cursor:'pointer', fontSize:'11px'}}>SAIR</button></div>
          {!isAdminUnlocked ? (
            <div style={styles.contentCenter}><p style={{fontSize: '12px', color: '#666', textAlign: 'center', marginBottom: '15px'}}>Insira a senha.</p><input type="password" placeholder="Senha" style={styles.input} value={adminPass} onChange={e => setAdminPass(e.target.value)} /><button onClick={unlockAdmin} style={styles.btn}>AUTENTICAR</button></div>
          ) : (
            <div style={{display:'flex', flexDirection: 'column', height: '100%'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'15px', flexShrink: 0}}>
                <div style={{background:'rgba(0,0,0,0.3)', padding:'10px', textAlign:'center', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)'}}><div style={{fontSize:'10px', color:'#ffd700', marginBottom: '5px'}}>FREE</div><div style={{fontSize:'20px', fontWeight:'900'}}>{activeFreeCount}/10</div></div>
                <div style={{background:'rgba(0,0,0,0.3)', padding:'10px', textAlign:'center', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.05)'}}><div style={{fontSize:'10px', color:'#44aaff', marginBottom: '5px'}}>50% OFF</div><div style={{fontSize:'20px', fontWeight:'900'}}>{activeDiscountCount}/10</div></div>
              </div>
              <div style={styles.scrollArea}>
                {leads.map(l => ( 
                  <div key={l.id} style={{display:'flex', gap:'12px', padding:'12px', borderBottom:'1px solid rgba(255,255,255,0.05)', alignItems: 'center', backgroundColor: selectedLeadIds.includes(l.id) ? 'rgba(255, 0, 60, 0.05)' : 'transparent', borderRadius: '8px'}}>
                    <div onClick={() => setSelectedLeadIds(prev => prev.includes(l.id) ? prev.filter(i => i !== l.id) : [...prev, l.id])} style={{cursor: 'pointer', flexShrink: 0}}>
                      {selectedLeadIds.includes(l.id) ? <CheckSquare size={16} color="#ff003c" /> : <Square size={16} color="#555" />}
                    </div>
                    <div style={{flex: 1, fontSize:'12px'}}>
                      <div style={{fontWeight:'700', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span>{l.name}</span>
                        <span style={{fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', backgroundColor: l.status === 'Confirmado' ? 'rgba(0, 200, 83, 0.1)' : l.status === 'Expirado' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 215, 0, 0.1)', color: l.status === 'Confirmado' ? '#00c853' : l.status === 'Expirado' ? '#ff4444' : '#ffd700'}}>
                          {l.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{color:'#666', fontSize: '10px'}}>{l.prize === 'free' ? 'Grátis' : '50% Off'} | {l.selected_flash}</div>
                    </div>
                    {l.status === 'Pendente' && (
                        <button onClick={(e) => { e.stopPropagation(); confirmLead(l.id); }} style={{background: '#00c853', border: 'none', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', flexShrink: 0}}>
                          CONFIRMAR
                        </button>
                    )}
                  </div> 
                ))}
              </div>
              
              <div style={{ borderTop: '1px solid #333', paddingTop: '10px', flexShrink: 0 }}>
                 <h3 style={{fontSize: '11px', color: '#fff', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '5px'}}><BarChart2 size={14} color="#aaa"/>MÉTRICAS DE TRÁFEGO</h3>
                 <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', fontSize:'10px', color:'#aaa', marginBottom:'10px'}}>
                    <div>Acesso Home: {metrics?.home_load || 0}</div>
                    <div>Bloqueio Navegador: {metrics?.restricted_browser || 0}</div>
                    <div>Bloqueio Trava Lead: {metrics?.overload_lock || 0}</div>
                    <div>Bloqueio Reacesso: {metrics?.reentry_attempt || 0}</div>
                 </div>
                 <button onClick={resetMetrics} style={{...styles.btn, backgroundColor:'transparent', border: '1px solid #aaa', color: '#aaa', height: '30px', fontSize: '10px'}}>ZERAR ESTATÍSTICAS</button>
              </div>

              <div style={{flexShrink: 0, marginTop: '10px', borderTop: '1px solid #222', paddingTop: '10px'}}>
                <button onClick={deleteSelectedLeads} disabled={selectedLeadIds.length === 0} style={{...styles.btn, backgroundColor:'transparent', border: '1px solid #ff003c', color: '#ff003c', height: '40px', fontSize: '12px', opacity: selectedLeadIds.length > 0 ? 1 : 0.3, marginBottom: '10px'}}><Trash2 size={14} /> APAGAR ({selectedLeadIds.length})</button>
                <button onClick={grantAdminImmunity} style={{...styles.btn, backgroundColor: '#00c853', height: '45px'}}><ShieldCheck size={18} style={{marginRight: '8px'}}/> ATIVAR IMUNIDADE ADM</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'expired') {
    return (
      <div style={styles.container}>
        <BackgroundDrift />
        <div style={styles.box}>
          <button onClick={() => setView('admin')} style={styles.adminToggle}><Settings size={18}/></button>
          <div style={styles.contentCenter}>
            <AlarmClock size={42} color="#ff4444" style={{ margin: '0 auto 10px', display: 'block' }} />
            <h1 style={{ color: '#ff003c', fontWeight: '900', fontSize: '22px', margin: '0 0 10px 0', letterSpacing: '1px', textAlign: 'center' }}>ACESSO NEGADO</h1>
            <p style={{ fontSize: '13px', color: '#f0f0f0', marginBottom: '10px', fontWeight: '500', textAlign: 'center' }}>Detectamos um acesso prévio, abandono de sessão ou o tempo limite de segurança foi atingido.</p>
            <p style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.4', marginBottom: '20px', textAlign: 'center' }}>Por questões de segurança da rede e integridade da promoção, sua participação nesta sessão foi invalidada.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button onClick={() => window.open(`https://wa.me/5581994909686?text=${encodeURIComponent("Meu acesso bloqueou, mas ainda quero uma tattoo!")}`, '_blank')} style={{ ...styles.btn, backgroundColor: '#25D366', height: '48px' }}><MessageCircle size={18} /> FALAR NO WHATSAPP</button>
              <button onClick={() => window.open(`https://www.instagram.com/tattosumar/`, '_blank')} style={{ ...styles.btn, backgroundColor: 'transparent', border: '1px solid #e1306c', color: '#e1306c', height: '48px', boxShadow: 'none' }}><Instagram size={18} /> CONHECER O INSTAGRAM</button>
            </div>
            <button onClick={() => setShowRegulations(true)} style={{background: 'none', border: 'none', color: '#666', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: '5px', marginTop: '15px' }}>Ler regulamento completo</button>
            <p style={{ fontSize: '10px', color: '#444', marginTop: '15px', fontStyle: 'italic', textAlign: 'center' }}>Sumar Estúdio - Segurança de Dados Ativa</p>
          </div>
        </div>
        {showRegulations && <RegulationModal onClose={() => setShowRegulations(false)} />}
      </div>
    );
  }

  if (view === 'home' || view === 'loading') {
    return (
      <div style={styles.container}><BackgroundDrift /><div style={styles.box}><button onClick={() => setView('admin')} style={styles.adminToggle}><Settings size={18}/></button>
          {view === 'home' ? (
            <div style={{...styles.contentCenter, textAlign:'center'}}><div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px'}}><Wifi size={40} color="#ff003c" style={{ filter: 'drop-shadow(0 0 10px rgba(255,0,60,0.5))'}} /></div><h1 style={{fontSize:'36px', fontWeight:'900', margin:'0 0 5px 0', letterSpacing: '-2px', color: '#fff'}}>SUMAR</h1><div style={{fontSize:'12px', color: '#888', letterSpacing: '2px', marginBottom:'15px'}}>ESTÚDIO DE TATUAGEM</div><p style={{fontSize:'13px', color:'#aaa', marginBottom:'20px', lineHeight: '1.6'}}>Conecte-se à nossa rede para liberar seu acesso.</p><button onClick={startConnection} disabled={!termsAccepted || evaluatingAccess || !isLockLoaded} style={{...styles.btn, opacity: (termsAccepted && !evaluatingAccess && isLockLoaded) ? 1 : 0.5, cursor: (termsAccepted && !evaluatingAccess && isLockLoaded) ? 'pointer' : 'not-allowed', marginBottom: '10px', marginTop: '20px' }}>INICIAR CONEXÃO <ArrowRight size={18}/></button><button onClick={() => setShowRegulations(true)} style={{background: 'none', border: 'none', color: '#666', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: '5px'}}>Ler regulamento completo</button><div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}><input type="checkbox" disabled={!isLockLoaded || evaluatingAccess} checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{width: '18px', height: '18px', accentColor: '#ff003c', cursor: (!isLockLoaded || evaluatingAccess) ? 'not-allowed' : 'pointer'}} id="termsCheck"/><label htmlFor="termsCheck" style={{fontSize: '12px', color: '#ccc', cursor: (!isLockLoaded || evaluatingAccess) ? 'not-allowed' : 'pointer', fontWeight: '500'}}>Li e concordo com os termos</label></div></div>
          ) : (
            <div style={{...styles.contentCenter, textAlign:'center'}}><h2 style={{fontSize:'20px', fontWeight: '800', marginBottom:'20px', color: '#fff'}}>CONECTANDO...</h2><div style={{width:'80%', height:'8px', backgroundColor:'rgba(255,255,255,0.05)', borderRadius: '10px', marginBottom:'15px', overflow: 'hidden', margin: '0 auto 15px'}}><div style={{height:'100%', backgroundColor:'#ff003c', width: `${loadingProgress}%`, transition:'width 0.2s', boxShadow: '0 0 15px #ff003c'}}></div></div><p style={{fontSize:'12px', color:'#666', fontStyle: 'italic'}}>{statusMsg}</p></div>
          )}
        </div>
        {showRegulations && <RegulationModal onClose={() => setShowRegulations(false)} />}
      </div>
    );
  }

  return (
    <div style={styles.container}><BackgroundDrift /><div style={styles.box}><div style={styles.timer}><Clock size={12}/> {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
        {view === 'connection_failed' && (
          <div style={{...styles.contentCenter, textAlign:'center'}}><div style={{ backgroundColor: 'rgba(255,  0, 60, 0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px'}}><AlertTriangle size={28} color="#ff003c" /></div><h1 style={{fontSize:'24px', fontWeight: '900', margin:'0 0 10px 0', color: '#fff'}}>ERRO DE REDE</h1><div style={{fontSize:'13px', color:'#ccc', marginBottom:'15px', lineHeight: '1.4'}}>Não conseguimos validar seu acesso Wi-Fi.<br /><strong>Até porque não somos uma empresa de internet. 🙂</strong><br /><br />Mas, se você estiver entre os 10 primeiros a validar<br />o cupom, você ganha uma FLASH TATTOO.</div><div style={{backgroundColor:'rgba(255, 255, 255, 0.03)', padding:'15px', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'15px'}}><p style={{fontSize:'12px', color:'#fff', fontWeight: '800', marginBottom:'5px'}}>Tá desconfiado?</p><p style={{fontSize:'13px', color:'#888', marginBottom:'15px'}}>Confere o Insta, volta aqui e valida.<br />Mas corre. O cronômetro ali<br />em cima não dá segunda chance.</p><a href="https://www.instagram.com/tattosumar/" target="_blank" rel="noopener noreferrer" style={{color: '#ff003c', fontWeight:'800', textDecoration:'none', fontSize:'14px', borderBottom: '2px solid #ff003c'}}>@TATTOSUMAR</a></div><button onClick={determinePrize} style={styles.btn}>DESCOBRIR MINHA COLOCAÇÃO</button></div>
        )}
        {view === 'result' && (
          <div style={{...styles.contentCenter, textAlign:'center'}}>{prizeType === 'none' ? (<div><h1 style={{fontSize: '50px'}}>😔</h1><p style={{fontSize: '14px', lineHeight: '1.6', marginBottom: '20px'}}>Sentimos muito, as vagas esgotaram. Mas nos chamando por aqui, você ainda pode ter uma negociação especial no estúdio.</p><button onClick={() => window.open(`https://wa.me/5581994909686?text=${encodeURIComponent('Oi! Perdi a vaga na promo, mas ainda quero uma tattoo com desconto!')}`, '_blank')} style={{...styles.btn, backgroundColor: '#25D366'}}>FALE CONOSCO</button></div>) : (<div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}><div style={{marginBottom:'10px', fontSize:'12px', color:'#ff003c', fontWeight: '800', letterSpacing: '2px'}}>CUPOM LIBERADO</div><div style={{marginBottom:'15px', fontSize:'14px', color:'#fff', fontWeight: '500'}}>{isLuckyWin ? (`Você foi o ${participantNumber}º participante`) : (`Você foi o ${participantNumber}º participante e ganhou:`)}</div><div style={{backgroundColor:'#fff', color:'#000', padding:'20px', borderRadius: '16px', fontWeight:'900', fontSize:'18px', transform:'rotate(-1deg)', boxShadow:'10px 10px 0px #ff003c', marginBottom:'25px', lineHeight: '1.2', width: '90%'}}>{isLuckyWin ? (<><div style={{fontSize: '14px', color: '#ff003c', marginBottom: '8px'}}>QUE SORTE ALGUÉM DESISTIU DE UMA DAS VAGAS E AGORA VOCÊ GANHOU:</div>{prizeType === 'free' ? 'UMA TATUAGEM GRÁTIS' : '50% DE DESCONTO'}</>) : (prizeType === 'free' ? 'FLASH TATTOO GRÁTIS' : '50% DE DESCONTO')}<div style={{fontSize:'12px', marginTop:'8px', color:'#666', fontWeight: '600'}}>(Válido para uma das artes disponíveis a seguir)</div></div><button onClick={() => setView('catalog')} style={styles.btn}>RESGATAR AGORA</button></div>)}</div>
        )}
        {view === 'catalog' && (
          <div style={{display: 'flex', flexDirection: 'column', height: '100%', paddingTop: '60px', width: '100%', boxSizing: 'border-box'}}><h2 style={{fontSize:'20px', fontWeight: '900', marginBottom:'15px', textAlign: 'center', color: '#fff', flexShrink: 0}}>ESCOLHA SUA ARTE</h2><div style={styles.scrollArea}><div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>{CATALOG_IMAGES.map(img => { const activeTakenImages = leads.filter(l => l.status !== 'Expirado').map(l => l.selected_flash); const isTaken = activeTakenImages.includes(img.name); return ( <div key={img.id} onClick={() => !isTaken && setSelectedFlash(img)} style={{ borderRadius: '12px', border: isTaken ? '1px solid #222' : (selectedFlash?.id === img.id ? '2px solid #ff003c' : '1px solid rgba(255,255,255,0.1)'), padding:'6px', background:'rgba(255,255,255,0.02)', cursor: isTaken ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', position: 'relative', opacity: isTaken ? 0.3 : 1 }}><img src={img.src} alt={img.name} style={{ width:'100%', borderRadius: '8px', filter: isTaken ? 'grayscale(100%)' : (selectedFlash?.id === img.id ? 'none' : 'grayscale(100%) opacity(0.5)') }} />{isTaken && ( <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#ff003c', color: 'white', fontSize: '9px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', zIndex: 2 }}><Lock size={10} /> ESGOTADO</div> )}</div> ); })}</div></div><button onClick={() => selectedFlash ? setView('form') : alert("Selecione uma arte!")} style={styles.btn}>PRÓXIMO PASSO</button></div>
        )}
        {view === 'form' && (
          <div style={{...styles.contentCenter, textAlign: 'center'}}><h2 style={{fontSize:'22px', fontWeight: '900', marginBottom:'10px', color: '#fff'}}>RESERVA FINAL</h2><p style={{fontSize:'13px', color:'#888', marginBottom:'20px'}}>Informe seu nome para o agendamento:</p><input type="text" placeholder="Seu Nome" style={styles.input} value={customerName} onChange={e => setCustomerName(e.target.value)} /><p style={{fontSize:'12px', color:'#ff003c', marginBottom:'20px', lineHeight: '1.4', fontWeight: '500'}}>Ao confirmar você será direcionado ao WhatsApp do estúdio para validação do cupom.<br />Envie a mensagem automática para confirmar a participação.</p><button onClick={handleFinalConfirm} style={styles.btn}>VALIDAR PROMOÇÃO</button></div>
        )}
        {view === 'success' && (
          <div style={{...styles.contentCenter, textAlign:'center'}}><div style={{ backgroundColor: 'rgba(0, 255, 100, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px'}}><CheckSquare size={36} color="#00ff64" /></div><h2 style={{fontSize:'24px', fontWeight: '900', color: '#00ff64'}}>RESERVADO COM SUCESSO!</h2><p style={{fontSize:'14px', color:'#aaa', margin:'20px 0'}}>Sua vaga foi bloqueada por 24h.</p></div>
        )}
      </div>
      {showRegulations && <RegulationModal onClose={() => setShowRegulations(false)} />}
    </div>
  );
}

// --- TELAS DE BLOQUEIO EXTERNALIZADAS PARA PRIORIZAÇÃO ---

const ScheduleLockScreen = ({ onAdmin, onReg, regVisible, onRegClose }) => (
  <div style={styles.container}>
    <BackgroundDrift />
    <div style={styles.box}>
      <button onClick={onAdmin} style={styles.adminToggle}><Settings size={18}/></button>
      <div style={styles.contentCenter}>
        <div style={{ backgroundColor: 'rgba(255, 0, 60, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><WifiOff size={32} color="#ff003c" /></div>
        <h1 style={{ color: '#ff003c', fontWeight: '900', fontSize: '20px', margin: '0 0 10px 0', letterSpacing: '1px', textAlign: 'center' }}>SERVIÇO INDISPONÍVEL</h1>
        <p style={{ fontSize: '13px', color: '#f0f0f0', marginBottom: '10px', fontWeight: '500', textAlign: 'center' }}>Sinal interrompido ou indisponível no momento.</p>
        <p style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.4', marginBottom: '20px', textAlign: 'center' }}>O acesso à rede é uma liberação da <strong style={{color: '#fff'}}>SUMAR</strong>.<br /><br />A conectividade só é permitida dentro de uma janela de tempo limitada, no período em que o estabelecimento estiver funcionando.</p>
        <button onClick={onReg} style={{background: 'none', border: 'none', color: '#666', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: '5px', marginTop: '10px' }}>Ler regulamento completo</button>
        <p style={{ fontSize: '10px', color: '#444', marginTop: '25px', fontStyle: 'italic', textAlign: 'center' }}>Sumar - Infraestrutura de Rede</p>
      </div>
    </div>
    {regVisible && <RegulationModal onClose={onRegClose} />}
  </div>
);

const LeadLockScreen = ({ onAdmin, onReg, regVisible, onRegClose, onLog }) => {
  useEffect(() => { if (onLog) onLog(); }, []);
  return (
    <div style={styles.container}>
      <BackgroundDrift />
      <div style={styles.box}>
        <button onClick={onAdmin} style={styles.adminToggle}><Settings size={18}/></button>
        <div style={styles.contentCenter}>
          <Wifi size={42} color="#ff003c" style={{ margin: '0 auto 10px', display: 'block' }} />
          <h1 style={{ color: '#ff003c', fontWeight: '900', fontSize: '20px', margin: '0 0 10px 0', letterSpacing: '1px', textAlign: 'center' }}>SISTEMA SOBRECARREGADO</h1>
          <p style={{ fontSize: '13px', color: '#f0f0f0', marginBottom: '10px', fontWeight: '500', textAlign: 'center' }}>Chegamos ao limite de acessos simultâneos na rede.</p>
          <p style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.4', marginBottom: '10px', textAlign: 'center' }}>Para garantir a estabilidade da conexão, estamos limitando novas entradas temporariamente.</p>
          <div style={{ backgroundColor: 'rgba(255, 0, 60, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255, 0, 60, 0.1)', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ fontSize: '11px', color: '#ff003c', textAlign: 'center', margin: 0, fontWeight: '700' }}>Tente novamente em alguns minutos.</p>
          </div>
          <button onClick={onReg} style={{background: 'none', border: 'none', color: '#666', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: '5px', marginTop: '10px' }}>Ler regulamento completo</button>
          <p style={{ fontSize: '10px', color: '#444', marginTop: '25px', fontStyle: 'italic', textAlign: 'center' }}>Sumar Estúdio - Gerenciamento de Tráfego</p>
        </div>
      </div>
      {regVisible && <RegulationModal onClose={onRegClose} />}
    </div>
  );
};

const QRRequiredScreen = ({ onAdmin, onReg, regVisible, onRegClose }) => (
  <div style={styles.container}>
    <BackgroundDrift />
    <div style={styles.box}>
      <button onClick={onAdmin} style={styles.adminToggle}><Settings size={18}/></button>
      <div style={styles.contentCenter}>
        <div style={{ backgroundColor: 'rgba(255, 0, 60, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Wifi size={32} color="#ff003c" /></div>
        <h1 style={{ color: '#ff003c', fontWeight: '900', fontSize: '20px', margin: '0 0 10px 0', letterSpacing: '1px', textAlign: 'center' }}>ACESSO EXTERNO NEGADO</h1>
        <p style={{ fontSize: '13px', color: '#f0f0f0', marginBottom: '10px', fontWeight: '500', textAlign: 'center' }}>Esta é uma rede privada do Sumar Estúdio.</p>
        <p style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.4', marginBottom: '20px', textAlign: 'center' }}>Por medidas de segurança, não permitimos conexões através de links compartilhados externamente.</p>
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }}>
           <p style={{ fontSize: '13px', color: '#fff', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>Como conectar?</p>
           <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.4', textAlign: 'center' }}>Você precisa estar presencialmente no local e escanear o QR Code oficial para entrar na rede.</p>
        </div>
        <button onClick={onReg} style={{background: 'none', border: 'none', color: '#666', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: '5px', marginTop: '10px' }}>Ler regulamento completo</button>
        <p style={{ fontSize: '10px', color: '#444', marginTop: '25px', fontStyle: 'italic', textAlign: 'center' }}>Sumar Estúdio - Segurança de Dados Ativa</p>
      </div>
    </div>
    {regVisible && <RegulationModal onClose={onRegClose} />}
  </div>
);

// ####################################################################################
// ######################### BLOCO IOS (PÁGINA DE ERRO) ###############################
// ####################################################################################
function AppIOS({ onLog }) {
  const [copied, setCopied] = useState(false);
  const [showRegulations, setShowRegulations] = useState(false);

  useEffect(() => { if (onLog) onLog(); }, []);

  const handleCopy = () => {
    const el = document.createElement('textarea');
    const now = Date.now();
    // Gera URL temporal de 60s em vez de copiar a URL fixa com token
    el.value = window.location.origin + window.location.pathname + '?access=' + now; 
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={styles.container}>
      <BackgroundDrift />
      <div style={styles.box}>
        <div style={styles.contentCenter}>
          <div style={{ backgroundColor: 'rgba(255, 0, 60, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Globe size={32} color="#ff003c" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 10px 0', color: '#fff', textAlign: 'center' }}>NAVEGADOR NÃO SUPORTADO</h1>
          <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '20px', lineHeight: '1.6', textAlign: 'center' }}>Infelizmente o site não suporta o acesso a essa página.</p>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
             <p style={{ fontSize: '13px', color: '#fff', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>Sugerimos que:</p>
             <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.4', textAlign: 'center' }}>Abra este link em outro navegador ou em outro dispositivo.</p>
          </div>
          <button onClick={handleCopy} style={{ ...styles.btn, backgroundColor: copied ? '#00c853' : '#333', boxShadow: 'none' }}>
            {copied ? <><CheckSquare size={18} /> LINK COPIADO!</> : <><Copy size={18} /> COPIAR LINK</>}
          </button>
          <button onClick={() => setShowRegulations(true)} style={{background: 'none', border: 'none', color: '#666', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer', padding: '5px', marginTop: '15px' }}>Ler regulamento completo</button>
          <p style={{ fontSize: '10px', color: '#444', marginTop: '25px', fontStyle: 'italic', textAlign: 'center' }}>Sumar Estúdio - Segurança de Dados Ativa</p>
        </div>
      </div>
      {showRegulations && <RegulationModal onClose={() => setShowRegulations(false)} />}
    </div>
  );
}

export default function App() {
  return <AppAndroid />;
}
