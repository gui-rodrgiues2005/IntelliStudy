// Em src/pages/Perfil/Perfil.jsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Target, Clock, BarChart2, Trash2, Award, SwatchBook, Bell, CheckCircle, BookMarked, Star, LockIcon, Crown, Settings } from 'lucide-react';
import './Perfil.scss';
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

function Perfil() {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState(false);
    const [modalEdit, setModalEdit] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [cpf, setCpf] = useState("");
    const [telefone, setTelefone] = useState("");
    const [notifications, setNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false);


    const achievementIcons = {
        PRIMEIRO_RESUMO: <BookMarked size={20} />,
        PRIMEIRO_SIMULADO: <Target size={20} />,
        DEZ_RESUMOS: <BookMarked size={20} />,
        DEZ_SIMULADOS: <Target size={20} />,
        CINQUENTA_RESUMOS: <BookMarked size={20} />,
        NOTA_MAXIMA: <Star size={20} />,
        default: <Award size={20} /> // Um ícone padrão caso o ID não seja encontrado
    };

    const openModalEdit = () => {
        setName(profileData.nome);
        setEmail(profileData.email);
        setCpf(profileData.cpf);
        setTelefone(profileData.telefone);
        setModalEdit(true);
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch('http://localhost:5051/api/Profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Falha ao buscar dados do perfil.");
                const data = await res.json();
                console.log("Dados do aluno", data);
                setProfileData(data);
            } catch (error) {
                console.error(error);
                alert(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    // console.log("Renderizando perfil com dados:", profileData);

    const handleUpdate = async (e) => {
        e.preventDefault();

        // Monta o payload apenas com campos preenchidos
        const payload = {
            name: name || undefined,
            email: email || undefined,
            cpf: cpf || undefined,
            telefone: telefone || undefined
        };

        // Só inclui senhas se ambas estiverem preenchidas
        if (novaSenha && senhaAtual) {
            payload.currentPassword = senhaAtual;
            payload.newPassword = novaSenha;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5051/api/User/atualizar-perfil", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erro ao atualizar perfil");
            }

            setProfileData(prev => ({
                ...prev,
                nome: data.user.Name || prev.nome,
                email: data.user.Email || prev.email,
                cpf: data.user.Cpf || prev.cpf,
                telefone: data.user.Telefone || prev.telefone
            }));

            // Limpa campos e fecha modal
            setSenhaAtual("");
            setNovaSenha("");
            setModalEdit(false);

            toast.info("Perfil atualizado com sucesso, recarregue a página para atualizar !");

        } catch (error) {
            console.error("Erro:", error);
            alert(error.message);
        }
    };

    const handleDeleteAccount = async () => {
        const { value: password } = await Swal.fire({
            title: 'Excluir Conta',
            text: 'Digite sua senha para confirmar a exclusão:',
            input: 'password',
            inputPlaceholder: 'Digite sua senha',
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c63ff',
            background: '#1a1a2e',
            color: '#fff'
        });

        if (!password) return;

        const confirmacao = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Essa ação é irreversível!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e63946',
            cancelButtonColor: '#6c63ff',
            background: '#1a1a2e',
            color: '#fff'
        });

        if (!confirmacao.isConfirmed) return;

        // aqui vem o fetch para deletar
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5051/api/User/deletar-conta', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            Swal.fire({
                title: 'Conta excluída',
                text: 'Sua conta foi excluída com sucesso.',
                icon: 'success',
                confirmButtonColor: '#6c63ff',
                background: '#1a1a2e',
                color: '#fff'
            });

            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (error) {
            Swal.fire({
                title: 'Erro',
                text: error.message || 'Erro ao excluir conta.',
                icon: 'error',
                confirmButtonColor: '#e63946',
                background: '#1a1a2e',
                color: '#fff'
            });
        }
    };


    if (isLoading) {
        return <p>Carregando perfil...</p>;
    }

    if (!profileData) {
        return <p>Não foi possível carregar os dados do perfil.</p>;
    }

    return (
        <div className="perfil-page">
            {/* Card Principal do Perfil */}
            <div className="profile-header-card">
                <div className="profile-main">
                    <div className="avatar">
                        {profileData.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <h2 className='nomeUser'>{profileData.nome}</h2>
                        <p className='emailUser'>{profileData.email} ・ Membro desde {new Date(profileData.membroDesde).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                        <div className="tags">
                            <span className="tag student">Estudante Ativo</span>
                            <span className={`tag plan ${profileData.plano === 'Premium' ? 'premium' : 'free'}`}>
                                {profileData.plano === 'Premium' ? '★ Plano Premium' : '○ Plano Gratuito'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="action-button edit" onClick={() => setModalEdit(true)}>
                        <User size={18} />
                        Editar Perfil
                    </button>

                    <button className="action-button settings" onClick={() => setModalConfig(true)}>
                        <Settings size={18} />
                    </button>
                </div>

                {modalEdit && (
                    <div className="modal-overlay">
                        <div className="modalEdit">
                            <h2>Atualize suas informações pessoais</h2>
                            <form className="edit-form">
                                <label className="profile-picture">
                                    <div className="avatar large">
                                        {profileData.nome.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="change-photo">Alterar foto de perfil</span>
                                    <input type="file" accept="image/*" />
                                </label>

                                <label>
                                    Seu Nome
                                    <input
                                        type="text"
                                        value={name}
                                        placeholder={profileData.nome}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </label>

                                <label>
                                    <input
                                        type="email"
                                        value={email}
                                        placeholder={profileData.email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </label>

                                <label>
                                    CPF
                                    <input
                                        type="text"
                                        value={cpf}
                                        placeholder={profileData.cpf}
                                        onChange={(e) => setCpf(e.target.value)}
                                    />
                                </label>

                                <label>
                                    Telefone
                                    <input
                                        type="text"
                                        value={telefone}
                                        placeholder={profileData.telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                    />
                                </label>

                                <p>Alterar minha senha (opcional)</p>

                                <label>
                                    Senha Atual
                                    <input
                                        type="password"
                                        value={senhaAtual}
                                        onChange={(e) => setSenhaAtual(e.target.value)}
                                    />
                                    <Link to="/recuperar-senha" className="forgot-password">Esqueceu a senha?</Link>
                                </label>

                                <label>
                                    Nova Senha
                                    <input
                                        type="password"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                    />
                                </label>

                                <label>
                                    Confirmar nova senha
                                    <input type="password" />
                                </label>

                                <div className='buttons'>
                                    <button type="button" className='cancelar' onClick={() => setModalEdit(false)}>Cancelar</button>
                                    <button type="submit" className='salvar_alteracoes' onClick={handleUpdate}>Salvar Alterações</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {modalConfig && (
                    <div className="modal-overlay">
                        <div className="modalConfig">
                            <h2>Configurações</h2>
                            <p>Gerencie suas preferências e configurações da conta</p>

                            {/* Sessão de Informações da Conta */}
                            <section className="account-info">
                                <h2 className="tema-title"><SwatchBook className='icon-tema' /> Aparência</h2>

                                <div className="preference-item">
                                    <label className="switch disabled">
                                        <input
                                            type="checkbox"
                                            checked={false}
                                            disabled
                                            className="ui-checkbox"
                                        />
                                        <span className="slider"></span>
                                        <span className="label-text">Tema Escuro (em breve)</span>
                                    </label>
                                </div>
                            </section>

                            <section className="preferences">
                                <h3 className='notificacao-title'><Bell className='icon-notificacao' />Notficações</h3>

                                <div className="preference-item">
                                    <label className="switch disabled">
                                        <input
                                            type="checkbox"
                                            checked={notifications}
                                            onChange={(e) => setNotifications(e.target.checked)}
                                            disabled
                                            className="ui-checkbox"
                                        />
                                        <span className="slider"></span>
                                        <span className="label-text">Receber Notificações no Email(Em breve)</span>
                                        
                                    </label>
                                </div>
                            </section>


                            {/* Sessão de Segurança */}
                            <section className="security">
                                <h3 className='title-seguranca'><Trash2 className='icon-seguranca' />Minha Conta</h3>
                                <div className="campo-conta">
                                    <h2>Excluir conta</h2>
                                    <p>Uma vez excluída, sua conta não poderá ser recuperada. Todos os seus dados serão permanentemente removidos.</p>
                                    <button className="logout-btn" onClick={handleDeleteAccount}>Excluir Conta</button>
                                </div>
                            </section>

                            {/* Botões de ação */}
                            <div className="modal-buttons">
                                <button className="cancel-btn" onClick={() => setModalConfig(false)}>Cancelar</button>
                                <button className="save-btn">Salvar Alterações</button>
                            </div>
                        </div>
                    </div>
                )}


            </div>
            {/* Cards de Estatísticas */}
            <div className="stats-grid">
                <div className="stat-card"><BookOpen /><div><span>Resumos</span><strong>{profileData.totalResumos}</strong></div></div>
                <div className="stat-card"><Target /><div><span>Simulados</span><strong>{profileData.totalSimulados}</strong></div></div>
                <div className="stat-card"><Clock /><div><span>Horas de Estudo</span><strong>{profileData.horasEstudo}</strong></div></div>
                <div className="stat-card"><BarChart2 /><div><span>Média</span><strong>{profileData.mediaAcertos}</strong></div></div>
            </div>

            {/* Grid de Atividades e Conquistas */}
            <div className="details-grid">
                <div className="activities-card">
                    <h3>Atividades Recentes</h3>
                    <ul>
                        {Array.isArray(profileData.atividadesRecentes) && profileData.atividadesRecentes.length > 0 ? (
                            profileData.atividadesRecentes.map((act, index) => (
                                <li key={index} className="activity-item">
                                    <div className="activity-icon">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="activity-info">
                                        <span className="activity-title">{act.titulo}</span>
                                        <small className="activity-date">{new Date(act.data).toLocaleDateString('pt-BR')}</small>
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
                            profileData.conquistas.map((conq) => {
                                const codigo = conq.codigo || conq.Codigo;
                                const nome = conq.nome || conq.Nome;
                                const plano = conq.plano || conq.Plano;
                                const desbloqueada = conq.desbloqueada ?? conq.Desbloqueada;

                                const isPremium = plano === "Premium";
                                const isUnlocked = desbloqueada;
                                const showLock = isPremium && !isUnlocked && profileData.plano !== "Premium";

                                return (
                                    <li
                                        key={codigo}
                                        className={`achievement-item ${isUnlocked ? 'unlocked' : ''} ${showLock ? 'locked-premium' : ''}`}
                                    >
                                        <div className="achievement-icon">
                                            {showLock
                                                ? <LockIcon />
                                                : achievementIcons[codigo] || achievementIcons.default
                                            }
                                        </div>
                                        <div className="achievement-details">
                                            <span>{nome}</span>
                                            <small className={isUnlocked ? "unlocked-text" : showLock ? "premium-text" : ""}>
                                                {isUnlocked
                                                    ? 'Desbloqueada'
                                                    : showLock
                                                        ? 'Premium necessário'
                                                        : 'Bloqueada'}
                                            </small>
                                        </div>
                                        {isUnlocked && <CheckCircle className="check-icon" />}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="no-achievements">Nenhuma conquista disponível</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Perfil;
