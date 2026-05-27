import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://clxuxrlqbkdadhkpzaly.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseHV4cmxxYmtkYWRoa3B6YWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzg3NjgsImV4cCI6MjA2NDU1NDc2OH0.aMgo3gBA9Rb_H-Oex2nQ8SccmSfMNKv8TwyAixan2Wk";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Erro na requisição");
  }
  return res.status === 204 ? null : res.json();
};

const hashPassword = async (password) => {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

// ─── Cores Copa ────────────────────────────────────
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --verde: #009B3A;
    --amarelo: #FEDF00;
    --azul: #00295F;
    --vermelho: #C8102E;
    --bg: #F5F5F0;
    --card: #FFFFFF;
    --txt: #1A1A1A;
    --txt2: #555;
    --borda: #E0DDD5;
  }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--txt); }
  .bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.03em; }
`;

// ─── Dados Grupos / Jogos Copa 2026 ─────────────────
const GRUPOS = {
  A: ["Estados Unidos", "Jamaica", "Guatemala", "Marrocos"],
  B: ["México", "Equador", "Venezuela", "Nova Zelândia"],
  C: ["Argentina", "Peru", "Chile", "Albânia"],
  D: ["França", "Bélgica", "Israel", "Nigéria"],
  E: ["Alemanha", "Itália", "Costa Rica", "Suécia"],
  F: ["Espanha", "Holanda", "Sérvia", "Costa do Marfim"],
  G: ["Brasil", "Japão", "Colômbia", "Camarões"],
  H: ["Portugal", "Croácia", "Dinamarca", "Senegal"],
  I: ["Inglaterra", "Suíça", "Romênia", "Uruguai"],
  J: ["Coreia do Sul", "Austrália", "Irã", "Gana"],
  K: ["Canadá", "Honduras", "Panamá", "Marrocos 2"],
  L: ["Argélia", "África do Sul", "China", "Turquia"],
};

const FASES_MATA_MATA = [
  { id: "oitavas", label: "Oitavas de Final", jogos: 16, premio: "10%" },
  { id: "quartas", label: "Quartas de Final", jogos: 8, premio: "15%" },
  { id: "semi", label: "Semifinais", jogos: 4, premio: "20%" },
  { id: "final", label: "Grande Final", jogos: 1, premio: "55%" },
];

const PONTUACAO = [
  { pts: 20, desc: "Placar exato" },
  { pts: 12, desc: "Vencedor + saldo de gols" },
  { pts: 8, desc: "Só o vencedor" },
  { pts: 6, desc: "Empate (sem acertar o placar)" },
  { pts: 4, desc: "Acertou gols do perdedor" },
  { pts: 0, desc: "Errou tudo" },
];

// ═══════════════════════════════════════════════════
// COMPONENTES UI
// ═══════════════════════════════════════════════════
const Nav = ({ page, setPage, user, onLogout }) => (
  <nav style={{
    background: "#00295F",
    padding: "0 24px",
    display: "flex", alignItems: "center", gap: 0,
    position: "sticky", top: 0, zIndex: 100,
    borderBottom: "3px solid #FEDF00",
  }}>
    <div onClick={() => setPage("home")} style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 26, color: "#FEDF00",
      cursor: "pointer", padding: "14px 20px 14px 0",
      letterSpacing: "0.05em",
    }}>
      ⚽ BOLÃO COPA 2026
    </div>
    <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
      {[
        ["home", "Início"],
        ["regras", "Regras"],
        ["calendario", "Calendário"],
        ["ranking", "Ranking"],
        user ? ["minha-aposta", "Minha Aposta"] : ["cadastro", "Participar"],
      ].map(([id, label]) => (
        <button key={id} onClick={() => setPage(id)} style={{
          background: page === id ? "#FEDF00" : "transparent",
          color: page === id ? "#00295F" : "#fff",
          border: "none", padding: "8px 16px",
          cursor: "pointer", fontFamily: "'Inter', sans-serif",
          fontWeight: 600, fontSize: 13,
          borderRadius: 4,
          transition: "all 0.15s",
        }}>{label}</button>
      ))}
      {user && (
        <button onClick={onLogout} style={{
          background: "transparent", color: "#aaa",
          border: "none", padding: "8px 12px",
          cursor: "pointer", fontSize: 12,
        }}>Sair</button>
      )}
    </div>
  </nav>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", borderRadius: 12,
    border: "1px solid #E0DDD5",
    padding: "24px", ...style,
  }}>{children}</div>
);

const Badge = ({ children, color = "#009B3A" }) => (
  <span style={{
    background: color + "20", color, fontWeight: 600,
    fontSize: 12, padding: "3px 10px", borderRadius: 20,
    border: `1px solid ${color}40`,
  }}>{children}</span>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 500, color: "#555", display: "block", marginBottom: 6 }}>{label}</label>}
    <input style={{
      width: "100%", padding: "10px 14px",
      border: "1.5px solid #E0DDD5", borderRadius: 8,
      fontSize: 15, fontFamily: "Inter, sans-serif",
      outline: "none", background: "#FAFAFA",
    }} {...props} />
  </div>
);

const Btn = ({ children, variant = "primary", style = {}, ...props }) => {
  const variants = {
    primary: { background: "#009B3A", color: "#fff", border: "none" },
    secondary: { background: "#00295F", color: "#fff", border: "none" },
    outline: { background: "transparent", color: "#009B3A", border: "2px solid #009B3A" },
    amarelo: { background: "#FEDF00", color: "#00295F", border: "none" },
  };
  return (
    <button style={{
      padding: "12px 24px", borderRadius: 8,
      fontWeight: 600, fontSize: 14, cursor: "pointer",
      fontFamily: "Inter, sans-serif",
      transition: "opacity 0.15s",
      ...variants[variant], ...style,
    }} {...props}>{children}</button>
  );
};

// ═══════════════════════════════════════════════════
// PÁGINAS
// ═══════════════════════════════════════════════════

// ─── HOME ──────────────────────────────────────────
const Home = ({ setPage, stats }) => (
  <div>
    {/* Hero */}
    <div style={{
      background: "linear-gradient(135deg, #00295F 0%, #003f8a 60%, #009B3A 100%)",
      padding: "80px 24px", textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
      <h1 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "clamp(48px, 8vw, 96px)",
        color: "#FEDF00", letterSpacing: "0.04em",
        lineHeight: 1, marginBottom: 16,
      }}>BOLÃO COPA 2026</h1>
      <p style={{ color: "#ffffffcc", fontSize: 20, maxWidth: 560, margin: "0 auto 32px" }}>
        Aposte nos resultados de todos os jogos e concorra a prêmios em todas as fases!
      </p>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn variant="amarelo" style={{ fontSize: 16, padding: "14px 36px" }} onClick={() => setPage("cadastro")}>
          FAZER MINHA APOSTA — R$ 10,00
        </Btn>
        <Btn variant="outline" style={{ color: "#fff", border: "2px solid #ffffff60", fontSize: 16, padding: "14px 24px" }} onClick={() => setPage("regras")}>
          Ver as Regras
        </Btn>
      </div>
    </div>

    {/* Stats */}
    <div style={{
      background: "#FEDF00", padding: "20px 24px",
      display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap",
    }}>
      {[
        ["🎟️", stats.totalApostas, "apostas"],
        ["💰", `R$ ${(stats.totalApostas * 10).toFixed(2)}`, "em prêmios"],
        ["📅", "11 Jun – 19 Jul", "Copa 2026"],
        ["⏰", "9 Jun 2026", "prazo para apostar"],
      ].map(([icon, val, label]) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24 }}>{icon}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#00295F" }}>{val}</div>
          <div style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>{label}</div>
        </div>
      ))}
    </div>

    {/* Como funciona */}
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: "#00295F", textAlign: "center", marginBottom: 40 }}>
        COMO FUNCIONA
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {[
          { n: "01", icon: "📝", title: "Cadastre-se", desc: "Crie sua conta com nome e e-mail. Simples e rápido." },
          { n: "02", icon: "⚽", title: "Preencha os Palpites", desc: "Aposte no placar de todos os jogos da Copa — grupos e mata-mata." },
          { n: "03", icon: "💳", title: "Pague R$ 10,00", desc: "Envie via Pix e sua aposta é confirmada." },
          { n: "04", icon: "🏆", title: "Torça e Ganhe", desc: "Prêmios em cada fase: oitavas, quartas, semi e grande final." },
        ].map(({ n, icon, title, desc }) => (
          <Card key={n} style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, background: "#00295F", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, margin: "0 auto 16px",
            }}>{icon}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: "#009B3A", letterSpacing: 2, marginBottom: 4 }}>PASSO {n}</div>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>{title}</div>
            <div style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>{desc}</div>
          </Card>
        ))}
      </div>
    </div>

    {/* Distribuição de prêmios */}
    <div style={{ background: "#00295F", padding: "56px 24px", color: "#fff" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: "#FEDF00", textAlign: "center", marginBottom: 8 }}>
          DISTRIBUIÇÃO DE PRÊMIOS
        </h2>
        <p style={{ textAlign: "center", color: "#ffffffaa", marginBottom: 40 }}>
          O valor total arrecadado é distribuído ao longo de toda a Copa
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {FASES_MATA_MATA.map(f => (
            <div key={f.id} style={{
              background: f.id === "final" ? "#FEDF00" : "rgba(255,255,255,0.08)",
              border: f.id === "final" ? "none" : "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12, padding: 24, textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: f.id === "final" ? "#00295F" : "#FEDF00" }}>
                {f.premio}
              </div>
              <div style={{ fontWeight: 600, color: f.id === "final" ? "#00295F" : "#fff", fontSize: 15 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: f.id === "final" ? "#003f8a" : "#ffffff80", marginTop: 4 }}>{f.jogos} {f.jogos === 1 ? "jogo" : "jogos"}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", color: "#ffffff60", marginTop: 24, fontSize: 13 }}>
          * Prêmios baseados no total arrecadado. Organizador retém 0% — 100% vai para os participantes.
        </p>
      </div>
    </div>

    {/* CTA final */}
    <div style={{ textAlign: "center", padding: "64px 24px", background: "#F5F5F0" }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: "#00295F", marginBottom: 16 }}>
        PRONTO PARA PARTICIPAR?
      </h2>
      <p style={{ color: "#666", fontSize: 16, marginBottom: 32, maxWidth: 400, margin: "0 auto 32px" }}>
        Cadastre-se, preencha seus palpites e torça muito! Prazo: até 9 de junho de 2026.
      </p>
      <Btn variant="primary" style={{ fontSize: 17, padding: "16px 48px" }} onClick={() => setPage("cadastro")}>
        QUERO PARTICIPAR
      </Btn>
    </div>
  </div>
);

// ─── REGRAS ────────────────────────────────────────
const Regras = () => (
  <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>
    <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#00295F", marginBottom: 8 }}>REGRAS DO BOLÃO</h1>
    <p style={{ color: "#666", marginBottom: 40 }}>Leia com atenção antes de participar.</p>

    {[
      {
        titulo: "1. Como Participar",
        itens: [
          "Cada aposta custa R$ 10,00 (dez reais).",
          "Uma aposta cobre TODOS os jogos da Copa do Mundo 2026.",
          "Você pode fazer quantas apostas quiser (cada R$ 10,00 = uma cartela diferente).",
          "Para confirmar a aposta, é necessário realizar o pagamento via Pix.",
          "O prazo para fazer ou editar apostas é até 9 de junho de 2026 (2 dias antes da abertura da Copa).",
        ],
      },
      {
        titulo: "2. Como Preencher",
        itens: [
          "Para cada jogo, você deve indicar o número de gols de cada time.",
          "Na fase de grupos: preencha o placar dos 72 jogos.",
          "No mata-mata: preencha o placar e o time que avança (para desempate em caso de empate).",
          "Os palpites podem ser editados até o prazo final.",
        ],
      },
      {
        titulo: "3. Pontuação",
        conteudo: (
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {PONTUACAO.map(({ pts, desc }) => (
              <div key={pts} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: pts === 20 ? "#009B3A10" : pts === 0 ? "#fee" : "#f9f9f9",
                borderRadius: 8, padding: "12px 16px",
                border: `1px solid ${pts === 20 ? "#009B3A30" : pts === 0 ? "#fcc" : "#eee"}`,
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 32, color: pts === 20 ? "#009B3A" : pts === 0 ? "#C8102E" : "#00295F",
                  minWidth: 56, textAlign: "center",
                }}>
                  {pts}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{desc}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>pontos por jogo</div>
                </div>
                {pts === 20 && <Badge color="#009B3A">Máximo</Badge>}
              </div>
            ))}
          </div>
        ),
      },
      {
        titulo: "4. Premiação",
        itens: [
          "O prêmio total é 100% do valor arrecadado (sem taxa de administração).",
          "Oitavas de Final: 10% do total para o(s) maior(es) pontuador(es) da fase.",
          "Quartas de Final: 15% do total.",
          "Semifinais: 20% do total.",
          "Grande Final: 55% do total — maior prêmio!",
          "Em caso de empate na pontuação, o prêmio é dividido igualmente.",
        ],
      },
      {
        titulo: "5. Pagamento e Confirmação",
        itens: [
          "O pagamento deve ser feito via Pix com o nome cadastrado na conta.",
          "Após o Pix, envie o comprovante para confirmação.",
          "Apostas não pagas até o prazo são automaticamente canceladas.",
          "O nome cadastrado deve coincidir com o nome enviado no Pix para localização no extrato.",
        ],
      },
      {
        titulo: "6. Identificação no Ranking",
        itens: [
          "Você pode escolher um nome de exibição para aparecer no ranking.",
          "Se preferir, pode participar anonimamente — seu nome não aparece publicamente.",
          "O ranking mostra posição, nome (ou Anônimo), pontuação e fase.",
        ],
      },
    ].map(({ titulo, itens, conteudo }) => (
      <Card key={titulo} style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#00295F", marginBottom: 16, letterSpacing: "0.02em" }}>
          {titulo}
        </h2>
        {itens && (
          <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
            {itens.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, fontSize: 15, lineHeight: 1.5, color: "#333" }}>
                <span style={{ color: "#009B3A", fontWeight: 700, flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        )}
        {conteudo}
      </Card>
    ))}
  </div>
);

// ─── CALENDÁRIO ────────────────────────────────────
const Calendario = () => {
  const [grupoAtivo, setGrupoAtivo] = useState("A");
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#00295F", marginBottom: 8 }}>
        CALENDÁRIO DA COPA 2026
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        A Copa do Mundo 2026 terá 48 seleções divididas em 12 grupos (A–L), totalizando 104 jogos.
      </p>

      {/* Seletor de grupos */}
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#009B3A", marginBottom: 16 }}>FASE DE GRUPOS</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {Object.keys(GRUPOS).map(g => (
          <button key={g} onClick={() => setGrupoAtivo(g)} style={{
            padding: "6px 16px", borderRadius: 6, cursor: "pointer",
            background: grupoAtivo === g ? "#00295F" : "#fff",
            color: grupoAtivo === g ? "#FEDF00" : "#333",
            border: "1.5px solid " + (grupoAtivo === g ? "#00295F" : "#ddd"),
            fontWeight: 600, fontSize: 14,
          }}>
            Grupo {g}
          </button>
        ))}
      </div>

      <Card style={{ marginBottom: 40 }}>
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#00295F", marginBottom: 20 }}>
          GRUPO {grupoAtivo}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {GRUPOS[grupoAtivo].map((time, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#F5F5F0", borderRadius: 8, padding: "12px 16px",
            }}>
              <div style={{
                width: 32, height: 32, background: "#00295F", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FEDF00", fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>{i + 1}º</div>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{time}</span>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "#888" }}>
          Cada grupo tem 4 times, com 6 jogos internos (rodadas 1, 2 e 3).
          Os 2 primeiros de cada grupo + 8 melhores terceiros avançam para as oitavas.
        </p>
      </Card>

      {/* Mata-mata */}
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#009B3A", marginBottom: 20 }}>
        MATA-MATA
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {FASES_MATA_MATA.map(f => (
          <Card key={f.id} style={{ borderTop: "4px solid #FEDF00" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#00295F", marginBottom: 8 }}>
              {f.label.toUpperCase()}
            </div>
            <div style={{ color: "#666", fontSize: 14, marginBottom: 12 }}>{f.jogos} {f.jogos === 1 ? "jogo" : "jogos"}</div>
            <Badge color="#009B3A">Prêmio: {f.premio} do total</Badge>
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 32, background: "#00295F", border: "none" }}>
        <div style={{ color: "#FEDF00", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 12 }}>
          📅 DATAS IMPORTANTES
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            ["Abertura da Copa", "11 de Junho de 2026"],
            ["Prazo para apostas", "9 de Junho de 2026"],
            ["Oitavas de Final", "Julho de 2026"],
            ["Grande Final", "19 de Julho de 2026"],
          ].map(([ev, dt]) => (
            <div key={ev} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, color: "#ffffff70", marginBottom: 4 }}>{ev}</div>
              <div style={{ fontWeight: 600, color: "#fff", fontSize: 15 }}>{dt}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── CADASTRO / LOGIN ──────────────────────────────
const Cadastro = ({ onLogin, setPage }) => {
  const [modo, setModo] = useState("cadastro");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const handleCadastro = async () => {
    if (!nome || !email || !senha) { setErro("Preencha todos os campos."); return; }
    if (senha.length < 6) { setErro("Senha deve ter ao menos 6 caracteres."); return; }
    setLoading(true); setErro("");
    try {
      const hash = await hashPassword(senha);
      const users = await sb(`usuarios?email=eq.${encodeURIComponent(email)}`, { headers: { "Accept": "application/json" } });
      if (users.length > 0) { setErro("E-mail já cadastrado. Faça o login."); setLoading(false); return; }
      const [user] = await sb("usuarios", { method: "POST", body: JSON.stringify({ nome, email, senha_hash: hash }) });
      setOk("Cadastro realizado! Agora faça sua aposta.");
      onLogin(user);
      setTimeout(() => setPage("minha-aposta"), 1500);
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true); setErro("");
    try {
      const hash = await hashPassword(senha);
      const users = await sb(`usuarios?email=eq.${encodeURIComponent(email)}&senha_hash=eq.${hash}`);
      if (users.length === 0) { setErro("E-mail ou senha incorretos."); setLoading(false); return; }
      onLogin(users[0]);
      setPage("minha-aposta");
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", padding: "0 24px" }}>
      <Card>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚽</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#00295F" }}>
            {modo === "cadastro" ? "CRIAR CONTA" : "ENTRAR"}
          </h1>
          <p style={{ color: "#888", fontSize: 14 }}>
            {modo === "cadastro" ? "Crie sua conta para participar do bolão" : "Acesse sua conta e veja suas apostas"}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {["cadastro", "login"].map(m => (
            <button key={m} onClick={() => { setModo(m); setErro(""); }} style={{
              flex: 1, padding: "10px", border: "1.5px solid",
              borderColor: modo === m ? "#009B3A" : "#ddd",
              background: modo === m ? "#009B3A10" : "transparent",
              color: modo === m ? "#009B3A" : "#666",
              fontWeight: 600, fontSize: 14, borderRadius: 8, cursor: "pointer",
            }}>
              {m === "cadastro" ? "Cadastrar" : "Login"}
            </button>
          ))}
        </div>

        {modo === "cadastro" && <Input label="Nome completo (usado no Pix)" placeholder="João Silva" value={nome} onChange={e => setNome(e.target.value)} />}
        <Input label="E-mail" type="email" placeholder="joao@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)} />

        {erro && <div style={{ background: "#fee", color: "#C8102E", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{erro}</div>}
        {ok && <div style={{ background: "#e8f9ee", color: "#009B3A", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{ok}</div>}

        <Btn variant="primary" style={{ width: "100%", fontSize: 16 }} onClick={modo === "cadastro" ? handleCadastro : handleLogin} disabled={loading}>
          {loading ? "Aguarde..." : modo === "cadastro" ? "CRIAR CONTA" : "ENTRAR"}
        </Btn>

        {modo === "cadastro" && (
          <p style={{ fontSize: 12, color: "#888", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            Seu nome será usado para identificação no extrato Pix.<br />
            Após o cadastro, você terá até 9 de junho para fazer sua aposta.
          </p>
        )}
      </Card>
    </div>
  );
};

// ─── RANKING ───────────────────────────────────────
const Ranking = () => {
  const [apostas, setApostas] = useState([]);
  const [stats, setStats] = useState({ total: 0, premio: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sb("apostas?pago=eq.true&order=pontos_total.desc&limit=100");
        setApostas(data);
        const total = data.length;
        setStats({ total, premio: total * 10 });
      } catch {
        setApostas([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#00295F", marginBottom: 8 }}>RANKING</h1>

      {/* Cards de stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Total de Apostas", val: stats.total, color: "#00295F" },
          { label: "Prêmio Estimado", val: `R$ ${stats.premio.toFixed(2)}`, color: "#009B3A" },
          { label: "Prêmio Final (55%)", val: `R$ ${(stats.premio * 0.55).toFixed(2)}`, color: "#C8102E" },
          { label: "Prazo Apostas", val: "9 Jun 2026", color: "#FEDF00", txtColor: "#00295F" },
        ].map(({ label, val, color, txtColor }) => (
          <div key={label} style={{
            background: color, borderRadius: 12, padding: "20px",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: txtColor || "#fff", marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 12, color: txtColor ? "#00295F99" : "#ffffff99", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Prêmio por fase */}
      <Card style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#009B3A", marginBottom: 20 }}>
          DISTRIBUIÇÃO DO PRÊMIO
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {FASES_MATA_MATA.map(f => {
            const pct = parseInt(f.premio);
            const val = stats.premio * pct / 100;
            return (
              <div key={f.id} style={{ background: "#F5F5F0", borderRadius: 8, padding: 16, textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#00295F" }}>{f.premio}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                <div style={{ color: "#009B3A", fontWeight: 700, fontSize: 15, marginTop: 4 }}>R$ {val.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabela ranking */}
      <Card>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#00295F", marginBottom: 20 }}>
          CLASSIFICAÇÃO GERAL
        </h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Carregando...</div>
        ) : apostas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#00295F", marginBottom: 8 }}>
              RANKING EM BREVE
            </div>
            <div style={{ color: "#888", fontSize: 15 }}>
              O ranking será preenchido conforme os jogos forem acontecendo.<br />
              Faça sua aposta e apareça aqui!
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F5F5F0" }}>
                  {["#", "Nome", "Grupos", "Oitavas", "Quartas", "Semi", "Final", "Total"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: h === "#" ? "center" : "left", fontWeight: 600, color: "#555", borderBottom: "2px solid #eee" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apostas.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #F0EDE5", background: i < 3 ? `${["#FFF9E6", "#F5F5F5", "#FFF5F0"][i]}` : "transparent" }}>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                      {a.nome_exibicao || <span style={{ color: "#aaa", fontStyle: "italic" }}>Anônimo</span>}
                    </td>
                    {["pontos_grupos", "pontos_oitavas", "pontos_quartas", "pontos_semi", "pontos_final"].map(k => (
                      <td key={k} style={{ padding: "10px 12px", color: "#555" }}>{a[k] || 0}</td>
                    ))}
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#009B3A", fontSize: 16 }}>{a.pontos_total || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── MINHA APOSTA ──────────────────────────────────
const MinhaAposta = ({ user }) => {
  const [apostas, setApostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [criando, setCriando] = useState(false);
  const [ok, setOk] = useState("");
  const [erro, setErro] = useState("");

  const PRAZO = new Date("2026-06-09T23:59:59-03:00");
  const podeEditar = new Date() < PRAZO;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await sb(`apostas?usuario_id=eq.${user.id}&order=criado_em.asc`);
        setApostas(data);
      } catch { setApostas([]); }
      setLoading(false);
    };
    load();
  }, [user.id]);

  const criarAposta = async () => {
    setCriando(true); setErro("");
    try {
      const [nova] = await sb("apostas", {
        method: "POST",
        body: JSON.stringify({ usuario_id: user.id, nome_exibicao: nomeExibicao || null }),
      });
      setApostas(prev => [...prev, nova]);
      setOk("Aposta criada! Agora preencha os palpites e realize o pagamento via Pix.");
      setNomeExibicao("");
    } catch (e) { setErro(e.message); }
    setCriando(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "#888" }}>Carregando...</div>;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#00295F", marginBottom: 8 }}>
        MINHAS APOSTAS
      </h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Olá, <strong>{user.nome}</strong>! {podeEditar ? "Você pode criar e editar apostas até 9 de junho." : "O prazo para apostas encerrou."}
      </p>

      {/* Status prazo */}
      <Card style={{
        marginBottom: 32,
        background: podeEditar ? "#e8f9ee" : "#fff3f3",
        border: `1px solid ${podeEditar ? "#009B3A40" : "#C8102E40"}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 32 }}>{podeEditar ? "⏳" : "🔒"}</div>
          <div>
            <div style={{ fontWeight: 600, color: podeEditar ? "#009B3A" : "#C8102E", fontSize: 16 }}>
              {podeEditar ? "Apostas ABERTAS" : "Apostas ENCERRADAS"}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              {podeEditar
                ? "Prazo: 9 de junho de 2026 às 23h59"
                : "O prazo para apostas já encerrou. Acompanhe o ranking!"}
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de apostas */}
      {apostas.map((a, i) => (
        <Card key={a.id} style={{ marginBottom: 20, borderLeft: "4px solid #009B3A" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#00295F" }}>
                APOSTA #{i + 1}
              </div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                Criada em {new Date(a.criado_em).toLocaleDateString("pt-BR")}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge color={a.pago ? "#009B3A" : "#C8102E"}>{a.pago ? "✓ Pago" : "Aguardando pagamento"}</Badge>
                {a.nome_exibicao && <Badge color="#00295F">👤 {a.nome_exibicao}</Badge>}
                {!a.nome_exibicao && <Badge color="#888">Anônimo no ranking</Badge>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "#009B3A" }}>
                {a.pontos_total || 0} pts
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>pontuação atual</div>
            </div>
          </div>

          {!a.pago && (
            <div style={{ marginTop: 16, background: "#FEDF0020", border: "1px solid #FEDF0060", borderRadius: 8, padding: 16 }}>
              <div style={{ fontWeight: 600, color: "#6b5a00", fontSize: 14, marginBottom: 4 }}>💳 Pagamento via Pix</div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Envie R$ 10,00 via Pix com o nome <strong>{user.nome}</strong> para confirmação.
                Guarde o comprovante!
              </div>
            </div>
          )}
        </Card>
      ))}

      {/* Nova aposta */}
      {podeEditar && (
        <Card style={{ borderTop: "4px solid #FEDF00" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: "#00295F", marginBottom: 8 }}>
            NOVA APOSTA — R$ 10,00
          </h2>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
            Cada aposta cobre todos os jogos da Copa. Quanto mais apostas, mais chances!
          </p>
          <Input
            label="Nome de exibição no ranking (opcional)"
            placeholder="Ex: João da Copa ou deixe vazio para Anônimo"
            value={nomeExibicao}
            onChange={e => setNomeExibicao(e.target.value)}
          />
          {erro && <div style={{ background: "#fee", color: "#C8102E", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{erro}</div>}
          {ok && <div style={{ background: "#e8f9ee", color: "#009B3A", padding: "10px 14px", borderRadius: 8, fontSize: 14, marginBottom: 16 }}>{ok}</div>}
          <Btn variant="primary" style={{ fontSize: 16, padding: "14px 32px" }} onClick={criarAposta} disabled={criando}>
            {criando ? "Criando..." : "CRIAR NOVA APOSTA"}
          </Btn>
        </Card>
      )}

      {/* Info Pix */}
      <Card style={{ marginTop: 24, background: "#00295F", border: "none" }}>
        <div style={{ color: "#FEDF00", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 16 }}>
          📱 COMO PAGAR VIA PIX
        </div>
        <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.8 }}>
          <p>1. Faça um Pix de <strong style={{ color: "#FEDF00" }}>R$ 10,00</strong> por aposta.</p>
          <p>2. No nome do favorecido, use: <strong style={{ color: "#FEDF00" }}>{user.nome}</strong></p>
          <p>3. Guarde o comprovante e aguarde a confirmação.</p>
          <p>4. Após confirmação, seus palpites serão válidos.</p>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalApostas: 0 });

  useEffect(() => {
    sb("apostas?pago=eq.true&select=id").then(data => {
      setStats({ totalApostas: data.length });
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    setUser(null);
    setPage("home");
  };

  const pages = {
    home: <Home setPage={setPage} stats={stats} />,
    regras: <Regras />,
    calendario: <Calendario />,
    cadastro: <Cadastro onLogin={setUser} setPage={setPage} />,
    ranking: <Ranking />,
    "minha-aposta": user ? <MinhaAposta user={user} /> : <Cadastro onLogin={setUser} setPage={setPage} />,
  };

  return (
    <>
      <style>{STYLE}</style>
      <div style={{ minHeight: "100vh", background: "#F5F5F0" }}>
        <Nav page={page} setPage={setPage} user={user} onLogout={handleLogout} />
        {pages[page] || pages.home}
        <footer style={{
          background: "#00295F", color: "#ffffff60",
          textAlign: "center", padding: "24px",
          fontSize: 13, borderTop: "3px solid #FEDF00",
        }}>
          ⚽ Bolão Copa do Mundo 2026 — Apostas até 9 de junho de 2026
        </footer>
      </div>
    </>
  );
}