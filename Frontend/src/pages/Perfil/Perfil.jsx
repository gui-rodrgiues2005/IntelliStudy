import React, { useState, useEffect, useRef } from "react";
import {
  User,
  BookOpen,
  Target,
  Clock,
  BarChart2,
  Trash2,
  Award,
  BookMarked,
  Star,
  LockIcon,
  Settings,
  CheckCircle,
  Instagram,
  Github,
  Linkedin,
  FilmIcon
} from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { API_URL } from "../../../config";
import "./Perfil.scss";

/**
 * Componente Perfil
 * - Busca /api/Profile
 * - Modal de edição com campos para redes sociais (instagram, tiktok, linkedin, github)
 * - Envia PUT para /api/User/atualizar-perfil
 * - Exibe estatísticas, atividades e conquistas
 */

function Perfil() {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalEdit, setModalEdit] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);
  const [errors, setErrors] = useState({});
  const socialChipsRef = useRef(null);

  useEffect(() => {
    // Adiciona animação de entrada staggerada
    if (socialChipsRef.current) {
      const chips = socialChipsRef.current.querySelectorAll('.social-chip');
      chips.forEach((chip, index) => {
        chip.style.animationDelay = `${index * 0.1}s`;
      });
    }
  }, [profileData]); // Isso vai rodar sempre que profileData mudar

  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    telefone: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
    github: "",
    currentPassword: "",
    newPassword: ""
  });

  // Ícones mapeados para conquistas (exemplo)
  const achievementIcons = {
    PRIMEIRO_RESUMO: <BookMarked size={18} />,
    PRIMEIRO_SIMULADO: <Target size={18} />,
    DEZ_RESUMOS: <BookMarked size={18} />,
    DEZ_SIMULADOS: <Target size={18} />,
    CINQUENTA_RESUMOS: <BookMarked size={18} />,
    NOTA_MAXIMA: <Star size={18} />,
    default: <Award size={18} />
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/Profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Falha ao buscar dados do perfil.");
        const data = await res.json();
        console.log("📦 Dados do backend:", data);


        // Ajuste de nomes de propriedades caso seu backend retorne diferente
        // (ex.: user.Name vs nome). Aqui assumimos as propriedades que você vem usando.
        setProfileData({
          ...data,
          nome: data.nome ?? data.Name ?? data.name,
          email: data.email ?? data.Email,
          membroDesde: data.createdAt ?? data.CreatedAt ?? data.membroDesde,
          totalResumos: data.totalResumos ?? 0,
          totalSimulados: data.totalSimulados ?? 0,
          horasEstudo: data.horasEstudo ?? 0,
          mediaAcertos: data.mediaAcertos ?? 0,
          atividadesRecentes: Array.isArray(data.atividadesRecentes) ? data.atividadesRecentes : (data.activities ?? []),
          conquistas: Array.isArray(data.conquistas) ? data.conquistas : (data.achievements ?? [])
        });

        // Inicializa formulário com valores existentes (se houver)
        setForm(prev => ({
          ...prev,
          name: (data.nome ?? data.Name ?? data.name) || "",
          email: data.email ?? data.Email ?? "",
          cpf: data.cpf ?? data.Cpf ?? "",
          telefone: data.telefone ?? data.Telefone ?? "",
          instagram: data.instagram ?? data.Instagram ?? "",
          tiktok: data.tiktok ?? data.TikTok ?? "",
          linkedin: data.linkedin ?? data.Linkedin ?? "",
          github: data.gitHub ?? ""
        }));


      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar perfil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Validação básica do nome (pode manter a sua função complexa)
  const validarNome = (nome) => {
    const n = (nome ?? "").trim();
    if (!n) return { valido: false, motivo: "Nome não pode ficar vazio" };
    if (n.length < 2) return { valido: false, motivo: "Nome muito curto" };
    if (n.length > 40) return { valido: false, motivo: "Nome muito longo" };
    return { valido: true, motivo: "" };
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const { valido, motivo } = validarNome(form.name);
    if (!valido) {
      toast.error(motivo);
      return;
    }

    // Monta payload apenas com os campos que queremos enviar
    const payload = {
      name: form.name || undefined,
      email: form.email || undefined,
      cpf: form.cpf || undefined,
      telefone: form.telefone || undefined,
      instagram: form.instagram || undefined,
      tiktok: form.tiktok || undefined,
      linkedin: form.linkedin || undefined,
      github: form.github || undefined
    };

    if (form.newPassword && form.currentPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/User/atualizar-perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao atualizar");

      // Backend deve retornar objeto user — adaptamos caso retorne diferente
      const returnedUser = data.user ?? data.user ?? data;
      // Atualiza estado local com os novos valores (tenta vários caminhos)
      setProfileData(prev => ({
        ...prev,
        nome: returnedUser.Name ?? returnedUser.name ?? returnedUser.nome ?? prev.nome,
        email: returnedUser.Email ?? returnedUser.email ?? prev.email,
        cpf: returnedUser.Cpf ?? returnedUser.cpf ?? prev.cpf,
        telefone: returnedUser.Telefone ?? returnedUser.telefone ?? prev.telefone,
        instagram: returnedUser.Instagram ?? returnedUser.instagram ?? form.instagram ?? prev.instagram,
        tiktok: returnedUser.TikTok ?? returnedUser.tiktok ?? prev.tiktok,
        linkedin: returnedUser.Linkedin ?? returnedUser.linkedin ?? prev.linkedin,
        github: returnedUser.gitHub ?? prev.github
      }));

      setModalEdit(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error(err.message ?? "Erro ao atualizar perfil");
    }
  };

  const handleDeleteAccount = async () => {
    const { value: password } = await Swal.fire({
      title: "Excluir Conta",
      input: "password",
      inputPlaceholder: "Digite sua senha",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e63946",
      cancelButtonColor: "#6c63ff"
    });

    if (!password) return;

    const confirm = await Swal.fire({
      title: "Tem certeza?",
      text: "A exclusão é irreversível.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#e63946",
      cancelButtonColor: "#6c63ff"
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/User/deletar-conta`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao excluir conta");

      Swal.fire("Conta excluída", "Sua conta foi removida.", "success");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      Swal.fire("Erro", err.message ?? "Erro ao excluir conta", "error");
    }
  };

  if (isLoading) return <p className="loading">Carregando perfil...</p>;
  if (!profileData) return <p>Não foi possível carregar o perfil.</p>;

  // Função utilitária para formatar handle (remover @ ou espaços)
  const normalizeHandle = (v) => (v ?? "").toString().trim().replace(/^@+/, "");

  return (
    <div className="perfil-page">
      <div className="profile-header-card">
        <div className="profile-main">
          <div className="avatar">
            {String(profileData.nome ?? profileData.Name ?? "U").substring(0, 2).toUpperCase()}
          </div>

          <div className="user-info">
            <h2 className="nomeUser">{profileData.nome ?? profileData.Name}</h2>
            <p className="emailUser">
              {profileData.email} • Membro desde{" "}
              {profileData.membroDesde
                ? new Date(profileData.membroDesde).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                : "—"}
            </p>

            <div
              className="social-chips"
              ref={socialChipsRef}
            >
              {profileData.instagram && (
                <a
                  className="social-chip"
                  href={`https://instagram.com/${normalizeHandle(profileData.instagram)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Instagram size={16} /> @{normalizeHandle(profileData.instagram)}
                </a>
              )}
              {profileData.linkedin && (
                <a
                  className="social-chip"
                  href={`https://linkedin.com/in/${normalizeHandle(profileData.linkedin)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin size={16} /> {normalizeHandle(profileData.linkedin)}
                </a>
              )}
              {profileData.gitHub && (
                <a
                  className="social-chip"
                  href={`https://github.com/${normalizeHandle(profileData.gitHub)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github size={16} /> {normalizeHandle(profileData.gitHub)}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-button edit" onClick={() => setModalEdit(true)}>
            <User size={16} /> Editar Perfil
          </button>
          <button className="action-button settings" onClick={() => setModalConfig(true)}>
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen />
          <div>
            <span>Resumos</span>
            <strong>{profileData.totalResumos ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <Target />
          <div>
            <span>Simulados</span>
            <strong>{profileData.totalSimulados ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <Clock />
          <div>
            <span>Horas de Estudo</span>
            <strong>{profileData.horasEstudo ?? 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <BarChart2 />
          <div>
            <span>Média</span>
            <strong>{profileData.mediaAcertos ?? "—"}</strong>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="activities-card">
          <h3>Atividades Recentes</h3>
          <ul>
            {Array.isArray(profileData.atividadesRecentes) && profileData.atividadesRecentes.length > 0 ? (
              profileData.atividadesRecentes.map((a, i) => (
                <li key={i} className="activity-item">
                  <div className="activity-icon">
                    <BookOpen size={16} />
                  </div>
                  <div className="activity-info">
                    <div className="activity-title">{a.titulo ?? a.title ?? "Atividade"}</div>
                    <small className="activity-date">
                      {a.data ? new Date(a.data).toLocaleDateString("pt-BR") : ""}
                    </small>
                  </div>
                </li>
              ))
            ) : (
              <li className="no-activities">Nenhuma atividade recente</li>
            )}
          </ul>
        </div>

        <div className="achievements-card">
          <h3>Conquistas</h3>
          <ul>
            {Array.isArray(profileData.conquistas) && profileData.conquistas.length > 0 ? (
              profileData.conquistas.map((c) => {
                const code = c.codigo ?? c.Codigo ?? c.key;
                const name = c.nome ?? c.Nome ?? c.title;
                const unlocked = c.desbloqueada ?? c.Desbloqueada ?? c.unlocked;
                const isPremium = (c.plano ?? c.Plano ?? "").toLowerCase() === "premium";
                const showLock = isPremium && !unlocked && (profileData.plano ?? "") !== "Premium";

                return (
                  <li key={code} className={`achievement-item ${unlocked ? "unlocked" : ""} ${showLock ? "locked" : ""}`}>
                    <div className="achievement-icon">{showLock ? <LockIcon size={16} /> : (achievementIcons[code] || achievementIcons.default)}</div>
                    <div className="achievement-details">
                      <span>{name}</span>
                      <small className={unlocked ? "unlocked-text" : showLock ? "premium-text" : ""}>
                        {unlocked ? "Desbloqueada" : showLock ? "Premium necessário" : "Bloqueada"}
                      </small>
                    </div>
                    {unlocked && <CheckCircle className="check-icon" />}
                  </li>
                );
              })
            ) : (
              <li className="no-achievements">Nenhuma conquista disponível</li>
            )}
          </ul>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {modalEdit && (
        <div className="modal-overlay">
          <div className="modalEdit">
            <h2>Atualize suas informações</h2>
            <form className="edit-form" onSubmit={handleUpdate}>
              <label>
                Seu Nome
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>

              <label>
                Email
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>

              <label>
                Instagram
                <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@seuuser" />
              </label>

              <label>
                LinkedIn (handle)
                <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="seu-linkedin" />
              </label>

              <label>
                GitHub
                <input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} placeholder="seu-usuario" />
              </label>

              <label>
                CPF (opcional)
                <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </label>

              <label>
                Telefone (opcional)
                <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </label>

              <p className="small-title">Alterar senha (opcional)</p>

              <label>
                Senha Atual
                <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
              </label>

              <label>
                Nova Senha
                <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
              </label>

              <div className="buttons">
                <button type="button" className="cancelar" onClick={() => setModalEdit(false)}>Cancelar</button>
                <button type="submit" className="salvar_alteracoes">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIG */}
      {modalConfig && (
        <div className="modal-overlay">
          <div className="modalConfig">
            <h2>Configurações</h2>
            <p>Gerencie preferências</p>
            <section className="security">
              <h3>Minha Conta</h3>
              <div className="campo-conta">
                <p>Excluir conta (irreversível)</p>
                <button className="logout-btn" onClick={handleDeleteAccount}><Trash2 /> Excluir Conta</button>
              </div>
            </section>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setModalConfig(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Perfil;
