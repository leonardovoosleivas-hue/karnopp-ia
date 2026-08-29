import React, { useState, useMemo, useEffect, useRef } from "react";
import { Home, Users, TrendingUp, Sparkles, AlertTriangle, Search, MessageSquare, BarChart3, Send, Plus, X } from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------- DADOS (populados a partir do Supabase; começam vazios) ----------
let IMOVEIS = [];
let CLIENTES = [];

function mapImovel(row) {
  return {
    id: row.id, titulo: row.titulo, bairro: row.bairro, preco: row.preco,
    quartos: row.quartos, area: row.area, caracteristicas: row.caracteristicas || [],
    diasNoMercado: row.dias_no_mercado || 0, interessados: row.interessados || 0,
  };
}
function mapCliente(row) {
  return {
    id: row.id, nome: row.nome, idade: row.idade || null,
    orcamentoMin: row.orcamento_min, orcamentoMax: row.orcamento_max,
    bairrosDesejados: row.bairros_desejados || [], quartosMin: row.quartos_min,
    prioridades: row.prioridades || [], estagio: row.estagio || "—",
    ultimaInteracao: row.ultima_interacao || "—",
  };
}
async function carregarDados() {
  const { data: imoveisData } = await supabase.from("imoveis").select("*").order("id");
  const { data: clientesData } = await supabase.from("clientes").select("*").order("id");
  IMOVEIS = (imoveisData || []).map(mapImovel);
  CLIENTES = (clientesData || []).map(mapCliente);
}
async function inserirImovel(campos) {
  const { error } = await supabase.from("imoveis").insert([{
    titulo: campos.titulo, bairro: campos.bairro, preco: Number(campos.preco),
    quartos: Number(campos.quartos), area: Number(campos.area),
    caracteristicas: campos.caracteristicas.split(",").map(s => s.trim()).filter(Boolean),
    dias_no_mercado: 0,
  }]);
  return error;
}
async function inserirCliente(campos) {
  const { error } = await supabase.from("clientes").insert([{
    nome: campos.nome, orcamento_min: Number(campos.orcamentoMin), orcamento_max: Number(campos.orcamentoMax),
    bairros_desejados: campos.bairrosDesejados.split(",").map(s => s.trim()).filter(Boolean),
    quartos_min: Number(campos.quartosMin),
    prioridades: campos.prioridades.split(",").map(s => s.trim()).filter(Boolean),
    estagio: campos.estagio || "pesquisa",
  }]);
  return error;
}


function calcularScore(cliente, imovel) {
  let score = 0; let motivos = [];
  if (imovel.preco >= cliente.orcamentoMin && imovel.preco <= cliente.orcamentoMax) { score += 40; motivos.push("dentro do orçamento"); }
  else {
    const diff = imovel.preco < cliente.orcamentoMin ? cliente.orcamentoMin - imovel.preco : imovel.preco - cliente.orcamentoMax;
    if (diff / cliente.orcamentoMax < 0.1) { score += 25; motivos.push("levemente fora do orçamento"); }
  }
  if (cliente.bairrosDesejados.includes(imovel.bairro)) { score += 30; motivos.push(`bairro desejado`); }
  if (imovel.quartos >= cliente.quartosMin) { score += 15; }
  const m = cliente.prioridades.filter(p => imovel.caracteristicas.includes(p));
  if (m.length) { score += Math.min(15, m.length * 8); motivos.push(...m); }
  return { score: Math.min(100, Math.round(score)), motivos };
}
function melhorScoreCliente(cliente) { return Math.max(...IMOVEIS.map(im => calcularScore(cliente, im).score)); }
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function responderPergunta(texto) {
  const t = texto.toLowerCase();
  const bairro = [...new Set(IMOVEIS.map(i => i.bairro))].find(b => t.includes(b.toLowerCase()));
  if (bairro) {
    const lista = IMOVEIS.filter(i => i.bairro === bairro);
    const medio = Math.round(lista.reduce((s, i) => s + i.preco, 0) / lista.length);
    return `${bairro} tem ${lista.length} imóvel(is) no estoque, preço médio de ${fmt(medio)}.`;
  }
  if (t.includes("mais caro")) { const im = [...IMOVEIS].sort((a, b) => b.preco - a.preco)[0]; return `O imóvel mais caro no estoque é "${im.titulo}", por ${fmt(im.preco)}.`; }
  if (t.includes("mais barato")) { const im = [...IMOVEIS].sort((a, b) => a.preco - b.preco)[0]; return `O imóvel mais barato é "${im.titulo}", por ${fmt(im.preco)}.`; }
  if (t.includes("parado") || t.includes("mais tempo")) { const im = [...IMOVEIS].sort((a, b) => b.diasNoMercado - a.diasNoMercado)[0]; return `"${im.titulo}" está há mais tempo no mercado: ${im.diasNoMercado} dias.`; }
  const cliente = CLIENTES.find(c => t.includes(c.nome.toLowerCase().split(" ")[0]));
  if (cliente) {
    const melhor = IMOVEIS.map(im => ({ im, ...calcularScore(cliente, im) })).sort((a, b) => b.score - a.score)[0];
    return `Para ${cliente.nome}, o melhor match é "${melhor.im.titulo}" com ${melhor.score}% de compatibilidade.`;
  }
  if (t.includes("oportunidade")) return "3 oportunidades ativas: 1 cliente com alta intenção de compra, 1 imóvel com múltiplos interessados, 1 imóvel parado há mais de 40 dias.";
  if (t.includes("comprador")) return "Para o imóvel mais recente cadastrado, o cliente com maior compatibilidade é Carla Nogueira, com 85% de match.";
  return "Ainda não encontrei essa informação nos dados atuais. Tente perguntar sobre um bairro, um cliente pelo nome, ou \"imóvel mais caro\".";
}

// ---------- TOKENS — elevado, com acento dourado ----------
const C = {
  bg0: "#0a0a0d", bg1: "#111116", panel: "#17171e", panelHover: "#1d1d25",
  border: "rgba(255,255,255,0.09)", borderGold: "rgba(217,79,63,0.4)",
  text: "#f3f2ee", textDim: "#9c9aa5", textFaint: "#5c5a66",
  gold: "#d94f3f", goldSoft: "rgba(217,79,63,0.16)", goldGlow: "rgba(217,79,63,0.6)",
};
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', monospace";
const SANS = "-apple-system, 'Inter', system-ui, sans-serif";

function NucleoIA() {
  return (
    <div style={{ position: "relative", width: 210, height: 210, margin: "0 auto" }}>
      <svg viewBox="0 0 210 210" width="210" height="210" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.goldGlow} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.goldGlow} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.gold} stopOpacity="0" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <circle cx="105" cy="105" r="98" fill="url(#coreGlow)" />
        <circle cx="105" cy="105" r="99" fill="none" stroke={C.border} strokeWidth="1" />
        {/* radar sweep */}
        <g style={{ transformOrigin: "105px 105px", animation: "sweep 4s linear infinite" }}>
          <path d="M 105 105 L 105 12 A 93 93 0 0 1 171 39 Z" fill="url(#sweepGrad)" opacity="0.5" />
        </g>
        {/* tick marks */}
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={i} x1="105" y1="10" x2="105" y2={i % 6 === 0 ? "18" : "15"}
            stroke={i % 6 === 0 ? C.gold : C.border} strokeWidth={i % 6 === 0 ? 1.4 : 1}
            style={{ transformOrigin: "105px 105px", transform: `rotate(${i * 15}deg)` }} />
        ))}
        <circle cx="105" cy="105" r="79" fill="none" stroke={C.borderGold} strokeWidth="1" strokeDasharray="1 7" style={{ transformOrigin: "105px 105px", animation: "rotL 36s linear infinite" }} />
        <circle cx="105" cy="105" r="58" fill="none" stroke={C.border} strokeWidth="1" strokeDasharray="6 3" style={{ transformOrigin: "105px 105px", animation: "rotR 50s linear infinite" }} />
        <circle cx="105" cy="105" r="40" fill={C.panel} stroke={C.gold} strokeWidth="1.4" style={{ transformOrigin: "105px 105px", animation: "pulseCore 3s ease-in-out infinite", filter: `drop-shadow(0 0 8px ${C.goldGlow})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, animation: "orbit 8s linear infinite" }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, boxShadow: `0 0 12px ${C.goldGlow}` }} />
      </div>
      <div style={{ position: "absolute", inset: 0, animation: "orbit 13s linear infinite reverse" }}>
        <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.text, opacity: 0.6, boxShadow: `0 0 6px ${C.goldGlow}` }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
        <div style={{ fontFamily: SANS, fontSize: 29, fontWeight: 600, color: C.text, letterSpacing: 1 }}>K</div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 2.5, color: C.gold, textTransform: "uppercase", fontWeight: 600 }}>Karnopp</div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 2, color: C.textFaint, marginTop: 1 }}>● IA ATIVA</div>
      </div>
    </div>
  );
}

const ESTADOS = ["ANALISANDO CLIENTES…", "ENCONTRANDO MATCHES…", "MAPEANDO OPORTUNIDADES…", "PROCESSAMENTO CONCLUÍDO"];
function usePensando() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % ESTADOS.length), 2600); return () => clearInterval(t); }, []);
  return ESTADOS[i];
}
function SectionLabel({ text, icon }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 14.5, letterSpacing: 2, color: C.gold, textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>{icon}{text}</div>;
}
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 13px", marginBottom: 14, background: C.panel }}>
      <Search size={14} color={C.textFaint} />
      <input value={value} onChange={onChange} placeholder={placeholder} style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontFamily: SANS, fontSize: 18.5, width: "100%" }} />
    </div>
  );
}
function StatCard({ label, value, onClick }) {
  return (
    <div onClick={onClick} className="k-card" style={{
      background: `linear-gradient(160deg, ${C.panel}, ${C.bg1})`, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "16px 12px", textAlign: "center", cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ fontFamily: SANS, fontSize: 27, fontWeight: 500, color: C.text }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 0.8, color: C.textFaint, textTransform: "uppercase", marginTop: 5 }}>{label}</div>
    </div>
  );
}

function Insights({ irPara }) {
  const matches = IMOVEIS.flatMap(im => CLIENTES.map(c => ({ im, c, ...calcularScore(c, im) })));
  const altos = matches.filter(m => m.score >= 80).sort((a, b) => b.score - a.score);
  const valorOportunidades = altos.reduce((s, m) => s + m.im.preco, 0);
  const destaque = altos[0];
  const antesDepois = [
    { antes: "Corretor cruza planilhas manualmente", depois: "IA cruza tudo em segundos" },
    { antes: "Cliente ideal descoberto por acaso", depois: "Cliente ideal apontado automaticamente" },
    { antes: "Imóvel parado sem saber o motivo", depois: "Alerta de baixa procura em tempo real" },
  ];
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: 2, color: C.textFaint, textTransform: "uppercase" }}>Esta semana, a IA encontrou</div>
        <div style={{ fontFamily: SANS, fontSize: 38, fontWeight: 500, color: C.gold, marginTop: 6, textShadow: `0 0 24px ${C.goldGlow}` }}>{fmt(valorOportunidades)}</div>
        <div style={{ fontFamily: MONO, fontSize: 12.5, color: C.textDim, marginTop: 4 }}>em oportunidades de alta compatibilidade ({altos.length} matches acima de 80%)</div>
      </div>

      {destaque && (
        <div onClick={() => irPara("matches")} className="k-card" style={{ cursor: "pointer", border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: "18px", marginBottom: 24, background: `linear-gradient(160deg, ${C.panel}, ${C.bg1})` }}>
          <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1.5, color: C.gold, textTransform: "uppercase", marginBottom: 10 }}>Case em destaque</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge score={destaque.score} size={64} />
            <div>
              <div style={{ fontFamily: SANS, fontSize: 19.5, color: C.text }}>{destaque.c.nome}</div>
              <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textDim, margin: "2px 0" }}>combina com</div>
              <div style={{ fontFamily: SANS, fontSize: 19.5, color: C.text }}>{destaque.im.titulo}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontFamily: MONO, fontSize: 15.5, color: C.textDim }}>
            {destaque.motivos.slice(0, 3).join(" · ")}
          </div>
        </div>
      )}

      <SectionLabel text="Antes vs. depois da Karnopp IA" />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        {antesDepois.map((r, idx) => (
          <div key={idx} style={{ display: "flex", padding: "13px 14px", gap: 10, borderTop: idx === 0 ? "none" : `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ flex: 1, fontFamily: SANS, fontSize: 14.5, color: C.textFaint, textDecoration: "line-through" }}>{r.antes}</div>
            <div style={{ flex: 1, fontFamily: SANS, fontSize: 17.5, color: C.text, fontWeight: 500 }}>{r.depois}</div>
          </div>
        ))}
      </div>

      <button onClick={() => irPara("geral")} className="k-tab" style={{
        width: "100%", padding: "14px", border: `1px solid ${C.borderGold}`, borderRadius: 10, cursor: "pointer",
        background: C.goldSoft, color: C.gold, fontFamily: SANS, fontSize: 16.5, fontWeight: 600,
      }}>Entrar na central de inteligência →</button>
    </div>
  );
}

function VisaoGeral({ irPara }) {
  const pensando = usePensando();
  const ATIVIDADE = [
    { t: "09:41", e: "Novo match encontrado — 94% de compatibilidade" },
    { t: "09:22", e: "Imóvel cadastrado — Vila Madalena" },
    { t: "08:57", e: "Oportunidade detectada — Itaim Bibi" },
    { t: "08:30", e: "Cliente atualizado — orçamento revisado" },
  ];
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: 2, color: C.textFaint, textTransform: "uppercase" }}>Pensando</div>
        <div key={pensando} style={{ fontFamily: MONO, fontSize: 15.5, letterSpacing: 1, color: C.gold, marginTop: 2, animation: "fadeIn 400ms ease" }}>{pensando}</div>
      </div>
      <NucleoIA />
      <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 11.5, letterSpacing: 2, color: C.textFaint, textTransform: "uppercase", margin: "6px 0 20px" }}>Distribuindo inteligência</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 24 }}>
        <StatCard label="Clientes" value="1.842" onClick={() => irPara("clientes")} />
        <StatCard label="Imóveis" value="672" onClick={() => irPara("imoveis")} />
        <StatCard label="Corretores" value="32" onClick={() => irPara("corretores")} />
        <StatCard label="Matches" value="128" onClick={() => irPara("matches")} />
        <StatCard label="Oportunidades" value="23" onClick={() => irPara("oportunidades")} />
        <StatCard label="Alertas" value="7" onClick={() => irPara("oportunidades")} />
      </div>
      <SectionLabel text="Atividade em tempo real" />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {ATIVIDADE.map((a, idx) => (
          <div key={idx} style={{ display: "flex", gap: 12, padding: "14px 16px", alignItems: "baseline", borderTop: idx === 0 ? "none" : `1px solid ${C.border}`, background: C.panel }}>
            <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.textFaint, minWidth: 34 }}>{a.t}</span>
            <span style={{ fontFamily: SANS, fontSize: 15.5, color: C.textDim, fontWeight: 500 }}>{a.e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gauge({ score, size = 78 }) {
  const r = size * 0.4, c = 2 * Math.PI * r, cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.border} strokeWidth="3" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.gold} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 700ms ease", filter: `drop-shadow(0 0 4px ${C.goldGlow})` }} />
      <text x={cx} y={cx + 5} textAnchor="middle" fill={C.text} fontSize={size * 0.2} fontFamily={SANS} fontWeight="300">{score}%</text>
    </svg>
  );
}

function EstadoVazio({ texto }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", border: `1px dashed ${C.border}`, borderRadius: 12 }}>
      <Sparkles size={24} color={C.textFaint} style={{ marginBottom: 12 }} />
      <div style={{ fontFamily: SANS, fontSize: 14.5, color: C.textDim, lineHeight: 1.6 }}>{texto}</div>
    </div>
  );
}

function Matches() {
  const [clienteId, setClienteId] = useState(CLIENTES[0]?.id);
  if (CLIENTES.length === 0) {
    return <EstadoVazio texto="Nenhum cliente cadastrado ainda. Cadastre um cliente na aba Clientes para ver os matches." />;
  }
  if (IMOVEIS.length === 0) {
    return <EstadoVazio texto="Nenhum imóvel cadastrado ainda. Cadastre um imóvel na aba Imóveis para ver os matches." />;
  }
  const cliente = CLIENTES.find(c => c.id === Number(clienteId)) || CLIENTES[0];
  const ranking = useMemo(() => IMOVEIS.map(im => ({ imovel: im, ...calcularScore(cliente, im) })).sort((a, b) => b.score - a.score), [cliente]);
  const top = ranking[0];
  return (
    <div>
      <SectionLabel text="Cliente" />
      <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ width: "100%", padding: "12px 13px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 16.5, background: C.panel, color: C.text, fontFamily: SANS, marginBottom: 20 }}>
        {CLIENTES.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <div style={{ border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: "20px 18px", marginBottom: 22, background: `linear-gradient(160deg, ${C.panel}, ${C.bg1})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Gauge score={top.score} />
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1.5, color: C.gold, textTransform: "uppercase" }}>Melhor match</div>
            <div style={{ fontFamily: SANS, fontSize: 18.5, color: C.text, marginTop: 3 }}>{top.imovel.titulo}</div>
            <div style={{ fontFamily: MONO, fontSize: 13.5, color: C.textDim, marginTop: 2 }}>{fmt(top.imovel.preco)}</div>
          </div>
        </div>
        {top.motivos.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontFamily: MONO, fontSize: 15.5, color: C.textDim, lineHeight: 1.8 }}>
            {top.motivos.map((m, i) => <div key={i}>· {m}</div>)}
          </div>
        )}
      </div>
      <SectionLabel text="Ranking completo" />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {ranking.map((r, idx) => (
          <div key={r.imovel.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderTop: idx === 0 ? "none" : `1px solid ${C.border}`, background: C.panel }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.textFaint }}>{String(idx + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: SANS, fontSize: 15.5, color: C.textDim, fontWeight: 500 }}>{r.imovel.titulo}</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 17.5, color: C.gold, fontWeight: 600 }}>{r.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Oportunidades() {
  const [selecionada, setSelecionada] = useState(null);
  const OPS = [
    { titulo: "Cliente com alta intenção de compra", detalhe: "Carla Nogueira · 3 visitas em 7 dias", prioridade: "alta", recomendacao: "Cliente demonstrou interesse recorrente nos mesmos bairros e já visitou 3 imóveis compatíveis em uma semana — padrão típico de decisão próxima.", acao: "Agendar contato direto do corretor nas próximas 48h." },
    { titulo: "Novo imóvel compatível com 4 clientes", detalhe: "Apto 2q Vila Madalena", prioridade: "media", recomendacao: "O imóvel recém-cadastrado atingiu compatibilidade acima de 70% com 4 clientes da base ativa.", acao: "Enviar o imóvel para os 4 clientes compatíveis antes da divulgação pública." },
    { titulo: "Imóvel sem interação relevante há 45 dias", detalhe: "Casa Alto de Pinheiros", prioridade: "atencao", recomendacao: "Tempo no mercado acima da média do bairro, sem novos interessados nas últimas semanas.", acao: "Revisar preço ou destacar características no anúncio." },
  ];
  const cor = { alta: C.gold, media: C.textDim, atencao: "#c96a6a" };

  if (selecionada) {
    const s = selecionada;
    return (
      <div>
        <button onClick={() => setSelecionada(null)} style={{ background: "none", border: "none", color: C.gold, fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, cursor: "pointer", padding: 0, marginBottom: 16 }}>← voltar</button>
        <div style={{ border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: "18px", background: `linear-gradient(160deg, ${C.panel}, ${C.bg1})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {s.prioridade === "atencao" ? <AlertTriangle size={15} color={cor[s.prioridade]} /> : <Sparkles size={15} color={cor[s.prioridade]} />}
            <div style={{ fontFamily: SANS, fontSize: 18.5, color: C.text }}>{s.titulo}</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textFaint, marginBottom: 16 }}>{s.detalhe}</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 0.8, color: C.gold, textTransform: "uppercase", marginBottom: 5 }}>Análise da IA</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.textDim, lineHeight: 1.6 }}>{s.recomendacao}</div>
          </div>
          <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 0.8, color: C.gold, textTransform: "uppercase", marginBottom: 5 }}>Ação sugerida</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, lineHeight: 1.6 }}>{s.acao}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionLabel text="Oportunidades detectadas" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {OPS.map((o, i) => (
          <div key={i} onClick={() => setSelecionada(o)} className="k-card" style={{ cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 17px", background: C.panel }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              {o.prioridade === "atencao" ? <AlertTriangle size={13} color={cor[o.prioridade]} /> : <Sparkles size={13} color={cor[o.prioridade]} />}
              <span style={{ fontFamily: SANS, fontSize: 16.5, color: C.text }}>{o.titulo}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textFaint, paddingLeft: 21 }}>{o.detalhe}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerfilCliente({ cliente, voltar }) {
  const ranking = useMemo(() => IMOVEIS.map(im => ({ imovel: im, ...calcularScore(cliente, im) })).sort((a, b) => b.score - a.score), [cliente]);
  return (
    <div>
      <button onClick={voltar} style={{ background: "none", border: "none", color: C.gold, fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, cursor: "pointer", padding: 0, marginBottom: 16 }}>← voltar</button>

      <div style={{ border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: "18px", marginBottom: 22, background: `linear-gradient(160deg, ${C.panel}, ${C.bg1})` }}>
        <div style={{ fontFamily: SANS, fontSize: 22, color: C.text, marginBottom: 3 }}>{cliente.nome}</div>
        <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textFaint, marginBottom: 14 }}>{cliente.idade} anos · estágio: {cliente.estagio} · última interação {cliente.ultimaInteracao}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Orçamento</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{fmt(cliente.orcamentoMin)} – {fmt(cliente.orcamentoMax)}</div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Quartos mín.</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{cliente.quartosMin}+</div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Bairros desejados</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{cliente.bairrosDesejados.join(", ")}</div>
          </div>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Prioridades</div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{cliente.prioridades.join(", ")}</div>
          </div>
        </div>
      </div>

      <SectionLabel text="Melhores imóveis para este cliente" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {ranking.map((r, idx) => (
          <div key={r.imovel.id} className="k-card" style={{ border: `1px solid ${idx === 0 ? C.borderGold : C.border}`, borderRadius: 10, padding: "16px 17px", background: C.panel }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 16.5, color: C.text }}>{r.imovel.titulo}</div>
                <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textDim, marginTop: 3 }}>{fmt(r.imovel.preco)} · {r.imovel.quartos}q · {r.imovel.area}m²</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 17.5, color: C.gold, fontWeight: 600 }}>{r.score}%</span>
            </div>
            {r.motivos.length > 0 && (
              <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 12.5, color: C.textFaint }}>{r.motivos.slice(0, 3).join(" · ")}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormularioCliente({ fechar, atualizar }) {
  const [campos, setCampos] = useState({ nome: "", orcamentoMin: "", orcamentoMax: "", bairrosDesejados: "", quartosMin: "", prioridades: "", estagio: "pesquisa" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setCampos(c => ({ ...c, [k]: e.target.value }));

  async function salvar() {
    if (!campos.nome || !campos.orcamentoMin || !campos.orcamentoMax) { setErro("Preencha ao menos nome e orçamento."); return; }
    setSalvando(true);
    const erroInsert = await inserirCliente(campos);
    setSalvando(false);
    if (erroInsert) { setErro(erroInsert.message); return; }
    atualizar();
    fechar();
  }

  const campo = (label, key, placeholder) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
      <input value={campos[key]} onChange={set(key)} placeholder={placeholder} style={{ width: "100%", padding: "11px 13px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg1, color: C.text, fontFamily: SANS, fontSize: 14, outline: "none" }} />
    </div>
  );

  return (
    <div style={{ border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: 18, marginBottom: 18, background: C.panel }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: SANS, fontSize: 16, color: C.text, fontWeight: 600 }}>Cadastrar cliente</div>
        <button onClick={fechar} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={C.textFaint} /></button>
      </div>
      {campo("Nome", "nome", "Ex: João Silva")}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>{campo("Orçamento mín. (R$)", "orcamentoMin", "500000")}</div>
        <div style={{ flex: 1 }}>{campo("Orçamento máx. (R$)", "orcamentoMax", "700000")}</div>
      </div>
      {campo("Bairros desejados (separados por vírgula)", "bairrosDesejados", "Vila Madalena, Pinheiros")}
      {campo("Quartos mínimos", "quartosMin", "2")}
      {campo("Prioridades (separadas por vírgula)", "prioridades", "varanda, pet friendly")}
      {erro && <div style={{ fontFamily: SANS, fontSize: 12.5, color: "#e07a70", marginBottom: 10 }}>{erro}</div>}
      <button onClick={salvar} disabled={salvando} style={{ width: "100%", padding: 13, borderRadius: 8, border: "none", cursor: "pointer", background: C.gold, color: "#1a0a08", fontFamily: SANS, fontSize: 14.5, fontWeight: 700 }}>
        {salvando ? "Salvando…" : "Salvar cliente"}
      </button>
    </div>
  );
}

function ClientesView({ atualizar }) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const filtrados = useMemo(() => CLIENTES.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.bairrosDesejados.some(b => b.toLowerCase().includes(busca.toLowerCase()))), [busca]);

  if (selecionado) return <PerfilCliente cliente={selecionado} voltar={() => setSelecionado(null)} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel text="Clientes" icon={<Users size={12} color={C.gold} />} />
        <button onClick={() => setMostrarForm(v => !v)} className="k-card" style={{ display: "flex", alignItems: "center", gap: 5, border: `1px solid ${C.borderGold}`, background: C.goldSoft, color: C.gold, borderRadius: 8, padding: "7px 11px", fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Novo
        </button>
      </div>
      {mostrarForm && <FormularioCliente fechar={() => setMostrarForm(false)} atualizar={atualizar} />}
      <SearchBar value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou bairro…" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {filtrados.map(c => {
          const score = melhorScoreCliente(c);
          return (
            <div key={c.id} onClick={() => setSelecionado(c)} className="k-card" style={{ cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 17px", background: C.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 17.5, color: C.text }}>{c.nome}</div>
                  <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textDim, marginTop: 3 }}>{fmt(c.orcamentoMin)} – {fmt(c.orcamentoMax)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 12.5, color: C.textFaint, marginTop: 2 }}>{c.bairrosDesejados.join(" · ")}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 16.5, color: C.gold, border: `1px solid ${C.borderGold}`, borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>{score}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: MONO, fontSize: 14.5, letterSpacing: 0.5, color: C.textFaint, textTransform: "uppercase" }}>Estágio: {c.estagio}</span>
                <span style={{ fontFamily: MONO, fontSize: 14.5, color: C.textFaint }}>{c.ultimaInteracao}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerfilImovel({ imovel, voltar }) {
  const ranking = useMemo(() => CLIENTES.map(c => ({ cliente: c, ...calcularScore(c, imovel) })).sort((a, b) => b.score - a.score), [imovel]);
  return (
    <div>
      <button onClick={voltar} style={{ background: "none", border: "none", color: C.gold, fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, cursor: "pointer", padding: 0, marginBottom: 16 }}>← voltar</button>

      <div style={{ border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: "18px", marginBottom: 22, background: `linear-gradient(160deg, ${C.panel}, ${C.bg1})` }}>
        <div style={{ fontFamily: SANS, fontSize: 22, color: C.text, marginBottom: 3 }}>{imovel.titulo}</div>
        <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textFaint, marginBottom: 14 }}>{imovel.bairro} · há {imovel.diasNoMercado} dias no mercado · {imovel.interessados} interessados</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Preço</div><div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{fmt(imovel.preco)}</div></div>
          <div><div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Área</div><div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{imovel.area}m² · {imovel.quartos}q</div></div>
          <div style={{ gridColumn: "1 / -1" }}><div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1, color: C.gold, textTransform: "uppercase" }}>Características</div><div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, marginTop: 3 }}>{imovel.caracteristicas.join(", ")}</div></div>
        </div>
      </div>

      <SectionLabel text="Melhores clientes para este imóvel" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {ranking.map((r, idx) => (
          <div key={r.cliente.id} className="k-card" style={{ border: `1px solid ${idx === 0 ? C.borderGold : C.border}`, borderRadius: 10, padding: "16px 17px", background: C.panel }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 16.5, color: C.text }}>{r.cliente.nome}</div>
                <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textDim, marginTop: 3 }}>{fmt(r.cliente.orcamentoMin)} – {fmt(r.cliente.orcamentoMax)}</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 17.5, color: C.gold, fontWeight: 600 }}>{r.score}%</span>
            </div>
            {r.motivos.length > 0 && (
              <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 12.5, color: C.textFaint }}>{r.motivos.slice(0, 3).join(" · ")}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormularioImovel({ fechar, atualizar }) {
  const [campos, setCampos] = useState({ titulo: "", bairro: "", preco: "", quartos: "", area: "", caracteristicas: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const set = (k) => (e) => setCampos(c => ({ ...c, [k]: e.target.value }));

  async function salvar() {
    if (!campos.titulo || !campos.bairro || !campos.preco) { setErro("Preencha ao menos título, bairro e preço."); return; }
    setSalvando(true);
    const erroInsert = await inserirImovel(campos);
    setSalvando(false);
    if (erroInsert) { setErro(erroInsert.message); return; }
    atualizar();
    fechar();
  }

  const campo = (label, key, placeholder) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, marginBottom: 5, textTransform: "uppercase" }}>{label}</div>
      <input value={campos[key]} onChange={set(key)} placeholder={placeholder} style={{ width: "100%", padding: "11px 13px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg1, color: C.text, fontFamily: SANS, fontSize: 14, outline: "none" }} />
    </div>
  );

  return (
    <div style={{ border: `1px solid ${C.borderGold}`, borderRadius: 12, padding: 18, marginBottom: 18, background: C.panel }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: SANS, fontSize: 16, color: C.text, fontWeight: 600 }}>Cadastrar imóvel</div>
        <button onClick={fechar} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={C.textFaint} /></button>
      </div>
      {campo("Título", "titulo", "Ex: Apto 2q Vila Madalena")}
      {campo("Bairro", "bairro", "Vila Madalena")}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>{campo("Preço (R$)", "preco", "620000")}</div>
        <div style={{ flex: 1 }}>{campo("Quartos", "quartos", "2")}</div>
        <div style={{ flex: 1 }}>{campo("Área (m²)", "area", "68")}</div>
      </div>
      {campo("Características (separadas por vírgula)", "caracteristicas", "varanda, vaga, pet friendly")}
      {erro && <div style={{ fontFamily: SANS, fontSize: 12.5, color: "#e07a70", marginBottom: 10 }}>{erro}</div>}
      <button onClick={salvar} disabled={salvando} style={{ width: "100%", padding: 13, borderRadius: 8, border: "none", cursor: "pointer", background: C.gold, color: "#1a0a08", fontFamily: SANS, fontSize: 14.5, fontWeight: 700 }}>
        {salvando ? "Salvando…" : "Salvar imóvel"}
      </button>
    </div>
  );
}

function ImoveisView({ atualizar }) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const filtrados = useMemo(() => IMOVEIS.filter(im => im.titulo.toLowerCase().includes(busca.toLowerCase()) || im.bairro.toLowerCase().includes(busca.toLowerCase())), [busca]);

  if (selecionado) return <PerfilImovel imovel={selecionado} voltar={() => setSelecionado(null)} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel text="Imóveis" icon={<Home size={12} color={C.gold} />} />
        <button onClick={() => setMostrarForm(v => !v)} className="k-card" style={{ display: "flex", alignItems: "center", gap: 5, border: `1px solid ${C.borderGold}`, background: C.goldSoft, color: C.gold, borderRadius: 8, padding: "7px 11px", fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Novo
        </button>
      </div>
      {mostrarForm && <FormularioImovel fechar={() => setMostrarForm(false)} atualizar={atualizar} />}
      <SearchBar value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por título ou bairro…" />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {filtrados.map(im => (
          <div key={im.id} onClick={() => setSelecionado(im)} className="k-card" style={{ cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 17px", background: C.panel }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 17.5, color: C.text }}>{im.titulo}</div>
                <div style={{ fontFamily: MONO, fontSize: 15.5, color: C.textDim, marginTop: 3 }}>{fmt(im.preco)} · {im.quartos}q · {im.area}m²</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 15.5, color: im.diasNoMercado > 30 ? C.textDim : C.gold, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px" }}>{im.diasNoMercado}d</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: MONO, fontSize: 14.5, color: C.textFaint }}>{im.interessados} interessados</span>
              <span style={{ fontFamily: MONO, fontSize: 14.5, color: C.textFaint }}>{im.bairro}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalisesView() {
  const porBairro = useMemo(() => {
    const mapa = {};
    IMOVEIS.forEach(im => { if (!mapa[im.bairro]) mapa[im.bairro] = { bairro: im.bairro, qtd: 0 }; mapa[im.bairro].qtd += 1; });
    const procura = {};
    CLIENTES.forEach(c => c.bairrosDesejados.forEach(b => { procura[b] = (procura[b] || 0) + 1; }));
    return Object.values(mapa).map(m => ({ bairro: m.bairro, estoque: m.qtd, procura: procura[m.bairro] || 0 })).sort((a, b) => b.procura - a.procura);
  }, []);
  const maxV = Math.max(...porBairro.flatMap(b => [b.estoque, b.procura]), 1);
  return (
    <div>
      <SectionLabel text="Procura vs. estoque por bairro" icon={<BarChart3 size={12} color={C.gold} />} />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px", background: C.panel, marginBottom: 22 }}>
        {porBairro.map(b => (
          <div key={b.bairro} style={{ marginBottom: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 15.5, color: C.textDim, marginBottom: 5 }}>
              <span>{b.bairro}</span><span>{b.procura} clientes / {b.estoque} imóveis</span>
            </div>
            <div style={{ display: "flex", gap: 3, height: 6 }}>
              <div style={{ width: `${(b.estoque / maxV) * 100}%`, background: C.textFaint, borderRadius: 3 }} />
              <div style={{ width: `${(b.procura / maxV) * 100}%`, background: C.gold, borderRadius: 3, boxShadow: `0 0 6px ${C.goldGlow}` }} />
            </div>
          </div>
        ))}
      </div>
      <SectionLabel text="Resumo executivo" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
        <StatCard label="Precisão do match" value="87%" />
        <StatCard label="Tempo médio de venda" value="34d" />
        <StatCard label="Conversão" value="12%" />
        <StatCard label="Ticket médio" value="R$ 890k" />
      </div>
    </div>
  );
}

function FalarComIA() {
  const [mensagens, setMensagens] = useState([{ de: "ia", texto: "Central Karnopp pronta. Pergunte sobre um bairro, cliente ou imóvel." }]);
  const [input, setInput] = useState("");
  const fimRef = useRef(null);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  function enviar(texto) {
    if (!texto.trim()) return;
    setMensagens(m => [...m, { de: "user", texto }]);
    setInput("");
    const resposta = responderPergunta(texto);
    setTimeout(() => setMensagens(m => [...m, { de: "ia", texto: resposta }]), 400);
  }

  return (
    <div>
      <SectionLabel text="Falar com Karnopp" icon={<MessageSquare size={12} color={C.gold} />} />
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.panel, padding: "14px", height: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ alignSelf: m.de === "ia" ? "flex-start" : "flex-end", maxWidth: "82%" }}>
            <div style={{
              fontFamily: SANS, fontSize: 15.5, color: m.de === "ia" ? C.textDim : C.text,
              border: m.de === "ia" ? `1px solid ${C.border}` : `1px solid ${C.borderGold}`, borderRadius: 10, padding: "9px 12px",
              background: m.de === "ia" ? C.bg1 : C.goldSoft,
            }}>{m.texto}</div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar(input)}
          placeholder="Pergunte algo…" style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", color: C.text, fontFamily: SANS, fontSize: 16.5, outline: "none" }} />
        <button onClick={() => enviar(input)} className="k-card" style={{ border: `1px solid ${C.borderGold}`, borderRadius: 10, background: C.goldSoft, padding: "0 15px", cursor: "pointer" }}>
          <Send size={15} color={C.gold} />
        </button>
      </div>
    </div>
  );
}

const CORRETORES = [
  { id: 1, nome: "Você (Admin)", cargo: "Administrador" },
  { id: 2, nome: "Juliano Karnopp", cargo: "Diretor" },
  { id: 3, nome: "Patrícia Souza", cargo: "Corretora" },
  { id: 4, nome: "Diego Ramos", cargo: "Corretor" },
];

function TelaLogin({ onEntrar }) {
  const [selecionado, setSelecionado] = useState(null);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 5, color: C.text, fontWeight: 600 }}>KARNOPP</div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.gold, marginTop: 4, marginBottom: 28 }}>INTELIGÊNCIA IMOBILIÁRIA</div>
        <NucleoIA />
        <div style={{ fontFamily: SANS, fontSize: 15, color: C.textDim, margin: "26px 0 16px" }}>Selecione seu acesso</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
          {CORRETORES.map(c => (
            <button key={c.id} onClick={() => setSelecionado(c)} className="k-card" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "13px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: selecionado?.id === c.id ? `1px solid ${C.borderGold}` : `1px solid ${C.border}`,
              background: selecionado?.id === c.id ? C.goldSoft : C.panel,
            }}>
              <span style={{ fontFamily: SANS, fontSize: 14.5, color: C.text, fontWeight: 500 }}>{c.nome}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.textFaint }}>{c.cargo}</span>
            </button>
          ))}
        </div>
        <button disabled={!selecionado} onClick={() => onEntrar(selecionado)} style={{
          width: "100%", padding: "15px", borderRadius: 10, border: "none", cursor: selecionado ? "pointer" : "not-allowed",
          background: selecionado ? C.gold : C.panel, color: selecionado ? "#1a0a08" : C.textFaint,
          fontFamily: SANS, fontSize: 15, fontWeight: 700,
        }}>Entrar na Central</button>
        <div style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, marginTop: 14 }}>login de demonstração — autenticação real na próxima etapa</div>
      </div>
    </div>
  );
}

function CorretoresView() {
  return (
    <div>
      <SectionLabel text="Corretores" icon={<Users size={12} color={C.gold} />} />
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {CORRETORES.map(c => (
          <div key={c.id} className="k-card" style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 17px", background: C.panel }}>
            <div style={{ fontFamily: SANS, fontSize: 15.5, color: C.text, fontWeight: 500 }}>{c.nome}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, marginTop: 3 }}>{c.cargo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KarnoppIA() {
  const [usuario, setUsuario] = useState(null);
  const [aba, setAba] = useState("insights");
  const [carregando, setCarregando] = useState(true);
  const [versaoDados, setVersaoDados] = useState(0);
  const atualizarDados = () => carregarDados().then(() => setVersaoDados(v => v + 1));

  useEffect(() => {
    if (usuario) { setCarregando(true); carregarDados().then(() => setCarregando(false)); }
  }, [usuario]);

  if (!usuario) {
    return (
      <div style={{ fontFamily: SANS, background: `radial-gradient(ellipse at 50% -10%, #221310 0%, ${C.bg0} 55%)`, minHeight: "100%" }}>
        <style>{`
          @keyframes rotL { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          @keyframes rotR { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
          @keyframes pulseCore { 0%,100% { opacity: 0.6; transform: scale(1);} 50% { opacity: 0.95; transform: scale(1.05);} }
          @keyframes orbit { from { transform: rotate(0deg) translateX(90px) rotate(0deg);} to { transform: rotate(360deg) translateX(90px) rotate(-360deg);} }
          @keyframes sweep { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          .k-card { transition: transform 120ms ease, border-color 120ms ease, background 120ms ease; }
          .k-card:active { transform: scale(0.97); }
        `}</style>
        <TelaLogin onEntrar={setUsuario} />
      </div>
    );
  }

  if (carregando) {
    return (
      <div style={{ fontFamily: SANS, background: C.bg0, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <style>{`
          @keyframes rotL { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
          @keyframes rotR { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
          @keyframes pulseCore { 0%,100% { opacity: 0.6; transform: scale(1);} 50% { opacity: 0.95; transform: scale(1.05);} }
          @keyframes orbit { from { transform: rotate(0deg) translateX(90px) rotate(0deg);} to { transform: rotate(360deg) translateX(90px) rotate(-360deg);} }
          @keyframes sweep { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        `}</style>
        <NucleoIA />
        <div style={{ fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: 1.5 }}>CARREGANDO DADOS DO BANCO…</div>
      </div>
    );
  }

  const tabs = [
    { id: "insights", label: "Insights", icon: <Sparkles size={15} /> },
    { id: "geral", label: "Visão Geral", icon: <TrendingUp size={15} /> },
    { id: "clientes", label: "Clientes", icon: <Users size={15} /> },
    { id: "imoveis", label: "Imóveis", icon: <Home size={15} /> },
    { id: "matches", label: "Matches", icon: <Sparkles size={15} /> },
    { id: "oportunidades", label: "Oportunidades", icon: <AlertTriangle size={15} /> },
    { id: "corretores", label: "Corretores", icon: <Users size={15} /> },
    { id: "analises", label: "Análises", icon: <BarChart3 size={15} /> },
    { id: "ia", label: "Falar com IA", icon: <MessageSquare size={15} /> },
  ];

  return (
    <div style={{ fontFamily: SANS, background: `radial-gradient(ellipse at 50% -10%, #221310 0%, ${C.bg0} 55%)`, minHeight: "100%", padding: "18px 14px 44px" }}>
      <style>{`
        @keyframes rotL { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes rotR { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
        @keyframes pulseCore { 0%,100% { opacity: 0.6; transform: scale(1);} 50% { opacity: 0.95; transform: scale(1.05);} }
        @keyframes orbit { from { transform: rotate(0deg) translateX(90px) rotate(0deg);} to { transform: rotate(360deg) translateX(90px) rotate(-360deg);} }
        @keyframes sweep { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .k-card { transition: transform 120ms ease, border-color 120ms ease, background 120ms ease; }
        .k-card:active { transform: scale(0.97); }
        .k-tab { transition: all 180ms ease; }
        .k-tab:active { transform: scale(0.95); }
        .tabbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 4, color: C.text, fontWeight: 500 }}>KARNOPP</div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 2, color: C.gold, marginTop: 3 }}>INTELIGÊNCIA IMOBILIÁRIA</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, margin: "10px 0 6px" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.gold, boxShadow: `0 0 6px ${C.goldGlow}`, animation: "pulseCore 3s ease-in-out infinite" }} />
          <span style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: 1.5, color: C.textFaint }}>IA OPERACIONAL — 100%</span>
        </div>
        <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 12, color: C.gold, marginBottom: 20 }}>{usuario.nome} · {usuario.cargo}</div>

        <div className="tabbar" style={{ display: "flex", gap: 8, marginBottom: 22, overflowX: "auto", paddingBottom: 4 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setAba(t.id)} className="k-tab" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap",
              padding: "12px 16px", border: aba === t.id ? `1px solid ${C.borderGold}` : `1px solid ${C.border}`,
              cursor: "pointer", background: aba === t.id ? C.goldSoft : C.panel, borderRadius: 24,
              fontFamily: SANS, fontSize: 15.5, fontWeight: 500,
              color: aba === t.id ? C.gold : C.textDim, flexShrink: 0,
            }}>{t.icon}{t.label}</button>
          ))}
        </div>

        {aba === "insights" && <Insights irPara={setAba} />}
        {aba === "geral" && <VisaoGeral irPara={setAba} />}
        {aba === "clientes" && <ClientesView key={"c" + versaoDados} atualizar={atualizarDados} />}
        {aba === "imoveis" && <ImoveisView key={"i" + versaoDados} atualizar={atualizarDados} />}
        {aba === "matches" && <Matches />}
        {aba === "oportunidades" && <Oportunidades />}
        {aba === "corretores" && <CorretoresView />}
        {aba === "analises" && <AnalisesView />}
        {aba === "ia" && <FalarComIA />}
      </div>
    </div>
  );
}
