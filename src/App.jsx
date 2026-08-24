import React, { useState, useMemo, useEffect, useRef } from "react";
import { Home, Users, TrendingUp, Sparkles, AlertTriangle, Search, MessageSquare, Send, BarChart3 } from "lucide-react";

// ---------- DADOS DE DEMONSTRAÇÃO (fictícios) ----------
const IMOVEIS = [
  { id: 1, titulo: "Apto 2q Vila Madalena", bairro: "Vila Madalena", preco: 620000, quartos: 2, area: 68, caracteristicas: ["varanda", "vaga", "pet friendly"], diasNoMercado: 12, interessados: 6 },
  { id: 2, titulo: "Casa 3q Alto de Pinheiros", bairro: "Alto de Pinheiros", preco: 1450000, quartos: 3, area: 180, caracteristicas: ["quintal", "churrasqueira", "2 vagas"], diasNoMercado: 45, interessados: 2 },
  { id: 3, titulo: "Apto 1q Perdizes", bairro: "Perdizes", preco: 380000, quartos: 1, area: 42, caracteristicas: ["mobiliado", "próximo ao metrô"], diasNoMercado: 5, interessados: 9 },
  { id: 4, titulo: "Cobertura Itaim Bibi", bairro: "Itaim Bibi", preco: 2100000, quartos: 3, area: 210, caracteristicas: ["piscina privativa", "vista livre", "2 vagas"], diasNoMercado: 90, interessados: 1 },
  { id: 5, titulo: "Apto 3q Moema", bairro: "Moema", preco: 980000, quartos: 3, area: 110, caracteristicas: ["varanda gourmet", "próximo ao parque", "2 vagas"], diasNoMercado: 20, interessados: 4 },
  { id: 6, titulo: "Casa 2q Vila Mariana", bairro: "Vila Mariana", preco: 720000, quartos: 2, area: 95, caracteristicas: ["quintal pequeno", "1 vaga"], diasNoMercado: 8, interessados: 5 },
  { id: 7, titulo: "Apto 2q Pinheiros", bairro: "Pinheiros", preco: 710000, quartos: 2, area: 72, caracteristicas: ["varanda", "academia no prédio", "vaga"], diasNoMercado: 33, interessados: 3 },
];
const CLIENTES = [
  { id: 1, nome: "Carla Nogueira", orcamentoMin: 500000, orcamentoMax: 700000, bairrosDesejados: ["Vila Madalena", "Pinheiros"], quartosMin: 2, prioridades: ["pet friendly", "varanda"], estagio: "decisão", ultimaInteracao: "há 2 dias" },
  { id: 2, nome: "Marcos Andrade", orcamentoMin: 1200000, orcamentoMax: 1700000, bairrosDesejados: ["Alto de Pinheiros", "Itaim Bibi"], quartosMin: 3, prioridades: ["quintal", "2 vagas"], estagio: "pesquisa", ultimaInteracao: "há 9 dias" },
  { id: 3, nome: "Fernanda Lima", orcamentoMin: 300000, orcamentoMax: 420000, bairrosDesejados: ["Perdizes", "Vila Madalena"], quartosMin: 1, prioridades: ["mobiliado", "próximo ao metrô"], estagio: "visitando", ultimaInteracao: "há 1 dia" },
  { id: 4, nome: "Roberto e Ana Diniz", orcamentoMin: 900000, orcamentoMax: 1100000, bairrosDesejados: ["Moema", "Vila Mariana"], quartosMin: 3, prioridades: ["varanda gourmet", "2 vagas"], estagio: "pesquisa", ultimaInteracao: "há 5 dias" },
];

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
function melhorScoreCliente(cliente) {
  return Math.max(...IMOVEIS.map(im => calcularScore(cliente, im).score));
}
const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ---------- TOKENS ----------
const C = {
  bg: "#050505", panel: "#0d0d0d", panelAlt: "#111111",
  line: "rgba(255,255,255,0.09)", lineSoft: "rgba(255,255,255,0.04)",
  text: "#f2f2f0", textDim: "#8c8c88", textFaint: "#57574f", glow: "#d8d8d0",
};
const MONO = "ui-monospace, 'SF Mono', 'Cascadia Code', monospace";
const SANS = "-apple-system, 'Inter', system-ui, sans-serif";

function NucleoIA() {
  return (
    <div style={{ position: "relative", width: 190, height: 190, margin: "0 auto" }}>
      <svg viewBox="0 0 190 190" width="190" height="190" style={{ position: "absolute", inset: 0 }}>
        <circle cx="95" cy="95" r="90" fill="none" stroke={C.lineSoft} strokeWidth="1" />
        <circle cx="95" cy="95" r="70" fill="none" stroke={C.line} strokeWidth="1" strokeDasharray="1 7" style={{ transformOrigin: "95px 95px", animation: "rotL 40s linear infinite" }} />
        <circle cx="95" cy="95" r="52" fill="none" stroke={C.lineSoft} strokeWidth="1" strokeDasharray="6 3" style={{ transformOrigin: "95px 95px", animation: "rotR 55s linear infinite" }} />
        <circle cx="95" cy="95" r="36" fill={C.panelAlt} stroke={C.line} strokeWidth="1" style={{ transformOrigin: "95px 95px", animation: "pulseCore 3.2s ease-in-out infinite" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, animation: "orbit2 9s linear infinite" }}>
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.glow, boxShadow: `0 0 6px ${C.glow}` }} />
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 300, color: C.text }}>K</div>
        <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 2.5, color: C.textDim, textTransform: "uppercase" }}>Karnopp</div>
        <div style={{ fontFamily: MONO, fontSize: 7, letterSpacing: 2, color: C.textFaint, marginTop: 1 }}>● IA ATIVA</div>
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
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.textFaint, textTransform: "uppercase", marginBottom: 10 }}>{icon}{text}</div>;
}
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.line}`, borderRadius: 4, padding: "9px 12px", marginBottom: 14, background: C.panel }}>
      <Search size={13} color={C.textFaint} />
      <input value={value} onChange={onChange} placeholder={placeholder} style={{
        background: "transparent", border: "none", outline: "none", color: C.text,
        fontFamily: SANS, fontSize: 13, width: "100%",
      }} />
    </div>
  );
}
function StatCard({ label, value }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 300, color: C.text }}>{value}</div>
      <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: 1.2, color: C.textFaint, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function VisaoGeral() {
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
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.textFaint, textTransform: "uppercase" }}>Pensando</div>
        <div key={pensando} style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: 1, color: C.textDim, marginTop: 2, animation: "fadeIn 400ms ease" }}>{pensando}</div>
      </div>
      <NucleoIA />
      <div style={{ textAlign: "center", fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.textFaint, textTransform: "uppercase", margin: "6px 0 20px" }}>Distribuindo inteligência</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 22 }}>
        <StatCard label="Clientes" value="1.842" />
        <StatCard label="Imóveis" value="672" />
        <StatCard label="Corretores" value="32" />
        <StatCard label="Matches" value="128" />
        <StatCard label="Oportunidades" value="23" />
        <StatCard label="Alertas" value="7" />
      </div>
      <SectionLabel text="Atividade em tempo real" />
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
        {ATIVIDADE.map((a, idx) => (
          <div key={idx} style={{ display: "flex", gap: 12, padding: "10px 12px", alignItems: "baseline", borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}`, background: C.panel }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.textFaint, minWidth: 34 }}>{a.t}</span>
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.textDim, fontWeight: 300 }}>{a.e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gauge({ score, size = 76 }) {
  const r = size * 0.4, c = 2 * Math.PI * r, cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.lineSoft} strokeWidth="3" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.glow} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 700ms ease" }} />
      <text x={cx} y={cx + 5} textAnchor="middle" fill={C.text} fontSize={size * 0.2} fontFamily={SANS} fontWeight="300">{score}%</text>
    </svg>
  );
}

function Matches() {
  const [clienteId, setClienteId] = useState(CLIENTES[0].id);
  const cliente = CLIENTES.find(c => c.id === Number(clienteId));
  const ranking = useMemo(() => IMOVEIS.map(im => ({ imovel: im, ...calcularScore(cliente, im) })).sort((a, b) => b.score - a.score), [cliente]);
  const top = ranking[0];
  return (
    <div>
      <SectionLabel text="Cliente" />
      <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 4, border: `1px solid ${C.line}`, fontSize: 13.5, background: C.panel, color: C.text, fontFamily: SANS, marginBottom: 20 }}>
        {CLIENTES.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: "18px 16px", marginBottom: 22, background: C.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Gauge score={top.score} />
          <div>
            <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: 1.5, color: C.textFaint, textTransform: "uppercase" }}>Melhor match</div>
            <div style={{ fontFamily: SANS, fontSize: 15, color: C.text, marginTop: 3 }}>{top.imovel.titulo}</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.textDim, marginTop: 2 }}>{fmt(top.imovel.preco)}</div>
          </div>
        </div>
        {top.motivos.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}`, fontFamily: MONO, fontSize: 10.5, color: C.textDim, lineHeight: 1.8 }}>
            {top.motivos.map((m, i) => <div key={i}>· {m}</div>)}
          </div>
        )}
      </div>
      <SectionLabel text="Ranking completo" />
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, overflow: "hidden" }}>
        {ranking.map((r, idx) => (
          <div key={r.imovel.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderTop: idx === 0 ? "none" : `1px solid ${C.lineSoft}`, background: C.panel }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textFaint }}>{String(idx + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.textDim, fontWeight: 300 }}>{r.imovel.titulo}</span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 12, color: C.glow }}>{r.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Oportunidades() {
  const OPS = [
    { titulo: "Cliente com alta intenção de compra", detalhe: "Carla Nogueira · 3 visitas em 7 dias", prioridade: "alta" },
    { titulo: "Novo imóvel compatível com 4 clientes", detalhe: "Apto 2q Vila Madalena", prioridade: "media" },
    { titulo: "Imóvel sem interação relevante há 45 dias", detalhe: "Casa Alto de Pinheiros", prioridade: "atencao" },
  ];
  const cor = { alta: C.text, media: C.textDim, atencao: C.textFaint };
  return (
    <div>
      <SectionLabel text="Oportunidades detectadas" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {OPS.map((o, i) => (
          <div key={i} style={{ border: `1px solid ${C.line}`, borderRadius: 4, padding: "13px 14px", background: C.panel }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              {o.prioridade === "atencao" ? <AlertTriangle size={12} color={cor[o.prioridade]} /> : <Sparkles size={12} color={cor[o.prioridade]} />}
              <span style={{ fontFamily: SANS, fontSize: 13.5, color: C.text }}>{o.titulo}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.textFaint, paddingLeft: 20 }}>{o.detalhe}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- NOVO: CLIENTES (CRM) ----------
function ClientesView() {
  const [busca, setBusca] = useState("");
  const filtrados = useMemo(() => CLIENTES.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.bairrosDesejados.some(b => b.toLowerCase().includes(busca.toLowerCase()))
  ), [busca]);
  return (
    <div>
      <SectionLabel text="Clientes" icon={<Users size={11} color={C.textFaint} />} />
      <SearchBar value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou bairro…" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.map(c => {
          const score = melhorScoreCliente(c);
          return (
            <div key={c.id} style={{ border: `1px solid ${C.line}`, borderRadius: 4, padding: "12px 14px", background: C.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: C.text }}>{c.nome}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.textDim, marginTop: 3 }}>{fmt(c.orcamentoMin)} – {fmt(c.orcamentoMax)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.textFaint, marginTop: 2 }}>{c.bairrosDesejados.join(" · ")}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, color: C.glow, border: `1px solid ${C.line}`, borderRadius: 4, padding: "2px 7px" }}>{score}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.lineSoft}` }}>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: 0.5, color: C.textFaint, textTransform: "uppercase" }}>Estágio: {c.estagio}</span>
                <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint }}>{c.ultimaInteracao}</span>
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && <div style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, textAlign: "center", padding: 20 }}>nenhum cliente encontrado</div>}
      </div>
    </div>
  );
}

// ---------- NOVO: IMÓVEIS ----------
function ImoveisView() {
  const [busca, setBusca] = useState("");
  const filtrados = useMemo(() => IMOVEIS.filter(im =>
    im.titulo.toLowerCase().includes(busca.toLowerCase()) || im.bairro.toLowerCase().includes(busca.toLowerCase())
  ), [busca]);
  return (
    <div>
      <SectionLabel text="Imóveis" icon={<Home size={11} color={C.textFaint} />} />
      <SearchBar value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por título ou bairro…" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtrados.map(im => (
          <div key={im.id} style={{ border: `1px solid ${C.line}`, borderRadius: 4, padding: "12px 14px", background: C.panel }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 14, color: C.text }}>{im.titulo}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.textDim, marginTop: 3 }}>{fmt(im.preco)} · {im.quartos}q · {im.area}m²</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, color: im.diasNoMercado > 30 ? C.textDim : C.glow, border: `1px solid ${C.line}`, borderRadius: 4, padding: "2px 7px" }}>{im.diasNoMercado}d</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.lineSoft}` }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint }}>{im.interessados} interessados</span>
              <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint }}>{im.bairro}</span>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && <div style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, textAlign: "center", padding: 20 }}>nenhum imóvel encontrado</div>}
      </div>
    </div>
  );
}

// ---------- NOVO: ANÁLISES ----------
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
      <SectionLabel text="Procura vs. estoque por bairro" icon={<BarChart3 size={11} color={C.textFaint} />} />
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, padding: "14px", background: C.panel, marginBottom: 20 }}>
        {porBairro.map(b => (
          <div key={b.bairro} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 10.5, color: C.textDim, marginBottom: 4 }}>
              <span>{b.bairro}</span><span>{b.procura} clientes / {b.estoque} imóveis</span>
            </div>
            <div style={{ display: "flex", gap: 3, height: 5 }}>
              <div style={{ width: `${(b.estoque / maxV) * 100}%`, background: C.textFaint, borderRadius: 2 }} />
              <div style={{ width: `${(b.procura / maxV) * 100}%`, background: C.glow, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
      <SectionLabel text="Resumo executivo" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <StatCard label="Precisão do match" value="87%" />
        <StatCard label="Tempo médio de venda" value="34d" />
        <StatCard label="Conversão" value="12%" />
        <StatCard label="Ticket médio" value="R$ 890k" />
      </div>
    </div>
  );
}

// ---------- NOVO: FALAR COM A IA (demo simulada) ----------
const RESPOSTAS_DEMO = {
  "analisar mercado": "Vila Madalena e Perdizes têm a maior procura em relação ao estoque disponível no momento — oportunidade de captação nesses bairros.",
  "buscar imóveis": "3 imóveis correspondem a critérios recentes de busca: Apto 2q Vila Madalena, Apto 2q Pinheiros e Casa 2q Vila Mariana.",
  "encontrar compradores": "Para o imóvel mais recente cadastrado, o cliente com maior compatibilidade é Carla Nogueira, com 85% de match.",
  "ver oportunidades": "3 oportunidades ativas: 1 cliente com alta intenção de compra, 1 imóvel com múltiplos interessados, 1 imóvel parado há mais de 40 dias.",
};
function FalarComIA() {
  const [mensagens, setMensagens] = useState([
    { de: "ia", texto: "Central Karnopp pronta. Selecione uma sugestão abaixo ou digite sua pergunta." },
  ]);
  const [input, setInput] = useState("");
  const fimRef = useRef(null);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens]);

  function enviar(texto) {
    if (!texto.trim()) return;
    setMensagens(m => [...m, { de: "user", texto }]);
    setInput("");
    const chave = Object.keys(RESPOSTAS_DEMO).find(k => texto.toLowerCase().includes(k));
    const resposta = chave ? RESPOSTAS_DEMO[chave] : "Essa é uma demonstração — nessa pergunta específica a IA ainda não tem uma resposta pronta no protótipo.";
    setTimeout(() => setMensagens(m => [...m, { de: "ia", texto: resposta }]), 500);
  }

  return (
    <div>
      <SectionLabel text="Falar com Karnopp" icon={<MessageSquare size={11} color={C.textFaint} />} />
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
        demonstração — respostas pré-definidas, sem IA generativa conectada ainda
      </div>
      <div style={{ border: `1px solid ${C.line}`, borderRadius: 4, background: C.panel, padding: "12px", height: 230, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        {mensagens.map((m, i) => (
          <div key={i} style={{ alignSelf: m.de === "ia" ? "flex-start" : "flex-end", maxWidth: "82%" }}>
            <div style={{
              fontFamily: SANS, fontSize: 12.5, color: m.de === "ia" ? C.textDim : C.text,
              border: `1px solid ${C.line}`, borderRadius: 4, padding: "8px 11px",
              background: m.de === "ia" ? C.panelAlt : "transparent",
            }}>{m.texto}</div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {Object.keys(RESPOSTAS_DEMO).map(k => (
          <button key={k} onClick={() => enviar(k.charAt(0).toUpperCase() + k.slice(1))} style={{
            fontFamily: MONO, fontSize: 9.5, color: C.textDim, background: "transparent",
            border: `1px solid ${C.line}`, borderRadius: 20, padding: "5px 10px", cursor: "pointer",
          }}>{k}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviar(input)}
          placeholder="Digite sua pergunta…" style={{
            flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4,
            padding: "10px 12px", color: C.text, fontFamily: SANS, fontSize: 13, outline: "none",
          }} />
        <button onClick={() => enviar(input)} style={{
          border: `1px solid ${C.line}`, borderRadius: 4, background: C.panel, padding: "0 12px", cursor: "pointer",
        }}><Send size={14} color={C.textDim} /></button>
      </div>
    </div>
  );
}

export default function KarnoppIA() {
  const [aba, setAba] = useState("geral");
  const tabs = [
    { id: "geral", label: "Visão Geral", icon: <TrendingUp size={12} /> },
    { id: "clientes", label: "Clientes", icon: <Users size={12} /> },
    { id: "imoveis", label: "Imóveis", icon: <Home size={12} /> },
    { id: "matches", label: "Matches", icon: <Sparkles size={12} /> },
    { id: "oportunidades", label: "Oportun.", icon: <AlertTriangle size={12} /> },
    { id: "analises", label: "Análises", icon: <BarChart3 size={12} /> },
    { id: "ia", label: "Falar com IA", icon: <MessageSquare size={12} /> },
  ];

  return (
    <div style={{ fontFamily: SANS, background: C.bg, minHeight: "100%", padding: "16px 14px 40px" }}>
      <style>{`
        @keyframes rotL { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        @keyframes rotR { from { transform: rotate(360deg);} to { transform: rotate(0deg);} }
        @keyframes pulseCore { 0%,100% { opacity: 0.55; transform: scale(1);} 50% { opacity: 0.9; transform: scale(1.04);} }
        @keyframes orbit2 { from { transform: rotate(0deg) translateX(86px) rotate(0deg);} to { transform: rotate(360deg) translateX(86px) rotate(-360deg);} }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .tabbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: C.text, fontWeight: 500 }}>KARNOPP</div>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: C.textFaint, marginTop: 2 }}>INTELIGÊNCIA IMOBILIÁRIA</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, margin: "10px 0 16px" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.glow, boxShadow: `0 0 5px ${C.glow}`, animation: "pulseCore 3.2s ease-in-out infinite" }} />
          <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: 1.5, color: C.textFaint }}>IA OPERACIONAL — 100%</span>
        </div>

        <div className="tabbar" style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.line}`, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setAba(t.id)} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap",
              padding: "10px 10px", border: "none", cursor: "pointer", background: "transparent",
              fontFamily: MONO, fontSize: 9.5, letterSpacing: 0.6, textTransform: "uppercase",
              color: aba === t.id ? C.text : C.textFaint,
              borderBottom: aba === t.id ? `1px solid ${C.text}` : "1px solid transparent",
              marginBottom: -1, transition: "all 0.2s", flexShrink: 0,
            }}>{t.icon}{t.label}</button>
          ))}
        </div>

        {aba === "geral" && <VisaoGeral />}
        {aba === "clientes" && <ClientesView />}
        {aba === "imoveis" && <ImoveisView />}
        {aba === "matches" && <Matches />}
        {aba === "oportunidades" && <Oportunidades />}
        {aba === "analises" && <AnalisesView />}
        {aba === "ia" && <FalarComIA />}
      </div>
    </div>
  );
}
