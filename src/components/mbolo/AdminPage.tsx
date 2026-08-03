import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminApi,
  authApi,
  tokenManager,
  type AdminAuditLog,
  type AdminContentType,
  type AdminOverview,
  type AdminReport,
  type AdminUserDetail,
  type PageResponse,
  type Post,
  type UserProfile,
} from "@/lib/api";

type AdminTab = "overview" | "reports" | "users" | "content" | "broadcast" | "audit";

const emptyPage = <T,>(): PageResponse<T> => ({
  content: [],
  currentPage: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
});

const getRolesFromToken = () => {
  const token = tokenManager.getAccessToken();
  if (!token) return [];
  try {
    const payload = token.split(".")[1] || "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(window.atob(normalized));
    return Array.isArray(parsed.roles) ? parsed.roles.map((role: string) => role.toUpperCase()) : [];
  } catch {
    return [];
  }
};

const StatTile = ({ label, value, icon: Icon }: { label: string; value: number; icon: ElementType }) => (
  <div className="border-b sm:border sm:rounded-lg bg-background px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
  </div>
);

const statusClass = (status?: string) => {
  const value = String(status || "").toUpperCase();
  if (value === "OPEN" || value === "PENDING") return "bg-amber-100 text-amber-800";
  if (value === "RESOLVED") return "bg-emerald-100 text-emerald-800";
  if (value === "REJECTED") return "bg-slate-100 text-slate-700";
  return "bg-muted text-muted-foreground";
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [reports, setReports] = useState<PageResponse<AdminReport>>(emptyPage);
  const [users, setUsers] = useState<PageResponse<UserProfile>>(emptyPage);
  const [content, setContent] = useState<PageResponse<Post>>(emptyPage);
  const [audit, setAudit] = useState<PageResponse<AdminAuditLog>>(emptyPage);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [query, setQuery] = useState("");
  const [reportStatus, setReportStatus] = useState("ALL");
  const [contentType, setContentType] = useState<AdminContentType>("POST");
  const [contentQuery, setContentQuery] = useState("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"ALL" | "ACTIVE">("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [effectiveRoles, setEffectiveRoles] = useState<string[]>([]);

  const roles = useMemo(getRolesFromToken, []);
  const currentRoles = effectiveRoles.length ? effectiveRoles : roles;
  const canAdmin = currentRoles.includes("ADMIN");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [me, overviewData, reportData, userData, contentData, auditData] = await Promise.all([
        authApi.getCurrentUser(),
        adminApi.getOverview(),
        adminApi.getReports(0, 20, reportStatus),
        adminApi.getUsers(0, 20, query),
        adminApi.getContent(0, 20, contentType, contentQuery),
        adminApi.getAudit(0, 30),
      ]);
      setEffectiveRoles((me.roles || []).map((role) => role.toUpperCase()));
      setOverview(overviewData);
      setReports(reportData);
      setUsers(userData);
      setContent(contentData);
      setAudit(auditData);
      setAccessDenied(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger l'admin";
      setAccessDenied(message.includes("403") || message.toLowerCase().includes("interdite"));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [reportStatus, contentType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === "users") {
        adminApi.getUsers(0, 20, query).then(setUsers).catch(() => undefined);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, activeTab]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === "content") {
        adminApi.getContent(0, 20, contentType, contentQuery).then(setContent).catch(() => undefined);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [contentQuery, contentType, activeTab]);

  const resolveReport = async (report: AdminReport, action: "APPROVE" | "REJECT" | "BAN" | "DELETE") => {
    setBusyId(report.id);
    const previous = reports;
    setReports((page) => ({
      ...page,
      content: page.content.map((item) =>
        item.id === report.id
          ? { ...item, status: action === "REJECT" ? "REJECTED" : "RESOLVED", action }
          : item
      ),
    }));
    try {
      await adminApi.resolveReport(report.id, action);
      if (action === "DELETE" && report.contentType.toUpperCase() === "POST") {
        setContent((page) => ({ ...page, content: page.content.filter((post) => post.id !== report.contentId) }));
      }
      toast.success("Signalement traité");
      loadAll();
    } catch (error) {
      setReports(previous);
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setBusyId(null);
    }
  };

  const suspendUser = async (user: UserProfile) => {
    const reason = user.suspended ? "" : window.prompt("Raison de la suspension", "Non-respect des règles de la communauté") || "";
    if (!user.suspended && reason.trim().length < 3) return;
    setBusyId(user.id);
    const nextSuspended = !user.suspended;
    setUsers((page) => ({
      ...page,
      content: page.content.map((item) =>
        item.id === user.id ? { ...item, suspended: nextSuspended, isActive: !nextSuspended, suspendedReason: reason } : item
      ),
    }));
    try {
      if (nextSuspended) await adminApi.suspendUser(user.id, reason);
      else await adminApi.unsuspendUser(user.id);
      toast.success(nextSuspended ? "Utilisateur suspendu" : "Utilisateur réactivé");
      loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
      loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const setRole = async (user: UserProfile, role: "USER" | "MODERATOR" | "ADMIN") => {
    if (!canAdmin) return toast.error("Action réservée aux admins");
    const roles = role === "USER" ? ["USER"] : ["USER", role];
    setBusyId(user.id);
    setUsers((page) => ({
      ...page,
      content: page.content.map((item) => (item.id === user.id ? { ...item, roles } : item)),
    }));
    try {
      await adminApi.updateUserRoles(user.id, roles);
      toast.success("Rôles mis à jour");
      loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rôle non modifié");
      loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const toggleVerified = async (user: UserProfile) => {
    if (!canAdmin) return toast.error("Action réservée aux admins");
    setBusyId(user.id);
    const nextVerified = !user.isVerified;
    setUsers((page) => ({
      ...page,
      content: page.content.map((item) => (item.id === user.id ? { ...item, isVerified: nextVerified } : item)),
    }));
    try {
      if (nextVerified) await adminApi.verifyUser(user.id);
      else await adminApi.unverifyUser(user.id);
      toast.success(nextVerified ? "Compte vérifié" : "Vérification retirée");
      loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vérification impossible");
      loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const showUserInfo = async (user: UserProfile) => {
    setBusyId(user.id);
    try {
      const detail = await adminApi.getUserDetail(user.id);
      setSelectedUserDetail(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Infos utilisateur indisponibles");
    } finally {
      setBusyId(null);
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!window.confirm("Supprimer ce contenu ?")) return;
    setBusyId(contentId);
    const previous = content;
    setContent((page) => ({ ...page, content: page.content.filter((post) => post.id !== contentId) }));
    try {
      await adminApi.deleteContent(contentType, contentId);
      toast.success("Contenu supprimé");
      loadAll();
    } catch (error) {
      setContent(previous);
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setBusyId(null);
    }
  };

  const sendBroadcast = async () => {
    if (!canAdmin) return toast.error("Action réservée aux admins");
    if (broadcastTitle.trim().length < 3 || broadcastBody.trim().length < 3) {
      toast.error("Titre et message requis");
      return;
    }
    setBusyId("broadcast");
    try {
      const result = await adminApi.broadcastNotification({
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        target: broadcastTarget,
      });
      toast.success(`Notification envoyée à ${result.sent} utilisateur(s)`);
      setBroadcastTitle("");
      setBroadcastBody("");
      loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setBusyId(null);
    }
  };

  const loadPage = async (kind: AdminTab, page: number) => {
    setLoading(true);
    try {
      if (kind === "reports") setReports(await adminApi.getReports(page, reports.size, reportStatus));
      if (kind === "users") setUsers(await adminApi.getUsers(page, users.size, query));
      if (kind === "content") setContent(await adminApi.getContent(page, content.size, contentType, contentQuery));
      if (kind === "audit") setAudit(await adminApi.getAudit(page, audit.size));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="border rounded-lg bg-background p-6">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Accès admin requis</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connecte-toi avec un compte qui possède le rôle ADMIN ou MODERATOR pour piloter la modération.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="border-b bg-card px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Administration</h1>
              <p className="text-xs text-muted-foreground">Pilotage, modération, utilisateurs et contenus</p>
            </div>
          </div>
          <button onClick={loadAll} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {[
            ["overview", "Vue", ShieldCheck],
            ["reports", "Signalements", AlertTriangle],
            ["users", "Utilisateurs", Users],
            ["content", "Contenus", FileText],
            ["broadcast", "Diffusion", Mail],
            ["audit", "Audit", UserCog],
          ].map(([id, label, Icon]) => (
            <button
              key={String(id)}
              onClick={() => setActiveTab(id as AdminTab)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                activeTab === id ? "bg-primary text-primary-foreground" : "border bg-background hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {String(label)}
            </button>
          ))}
        </div>

        {loading && !overview ? (
          <div className="flex min-h-[260px] items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Chargement admin...
          </div>
        ) : (
          <>
            {activeTab === "overview" && overview && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <StatTile label="Utilisateurs" value={overview.stats.users} icon={Users} />
                  <StatTile label="Suspendus" value={overview.stats.suspendedUsers} icon={Ban} />
                  <StatTile label="Publications" value={overview.stats.posts} icon={FileText} />
                  <StatTile label="Signalements ouverts" value={overview.stats.openReports} icon={AlertTriangle} />
                  <StatTile label="Actifs 24h" value={overview.stats.activeToday || 0} icon={CheckCircle2} />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <RecentList title="Derniers signalements" rows={overview.recentReports.map((r) => `${r.contentType} · ${r.status} · ${r.reason}`)} />
                  <RecentList title="Nouveaux utilisateurs" rows={overview.recentUsers.map((u) => `@${u.username} · ${u.email || "email absent"}`)} />
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <section className="space-y-3">
                <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="ALL">Tous les statuts</option>
                  <option value="OPEN">Ouverts</option>
                  <option value="RESOLVED">Résolus</option>
                  <option value="REJECTED">Rejetés</option>
                </select>
                <div className="overflow-hidden rounded-lg border bg-background">
                  {reports.content.map((report) => (
                    <div key={report.id} className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(report.status)}`}>{report.status}</span>
                          <span className="text-sm font-medium">{report.contentType}</span>
                          <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-2 text-sm">{report.reason}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Contenu: {report.contentId} · Reporter: {report.reporterId}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionButton disabled={busyId === report.id} onClick={() => resolveReport(report, "REJECT")}>Rejeter</ActionButton>
                        <ActionButton disabled={busyId === report.id} onClick={() => resolveReport(report, "APPROVE")}>Valider</ActionButton>
                        {report.contentType.toUpperCase() === "POST" && (
                          <ActionButton danger disabled={busyId === report.id} onClick={() => resolveReport(report, "DELETE")}>Supprimer</ActionButton>
                        )}
                      </div>
                    </div>
                  ))}
                  {!reports.content.length && <EmptyLine text="Aucun signalement trouvé" />}
                </div>
                <Pager page={reports} onPage={(page) => loadPage("reports", page)} />
              </section>
            )}

            {activeTab === "users" && (
              <section className="space-y-3">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un utilisateur" className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm" />
                </div>
                <div className="overflow-hidden rounded-lg border bg-background">
                  {users.content.map((user) => (
                    <div key={user.id} className="grid gap-3 border-b p-4 last:border-b-0 xl:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">@{user.username}</span>
                          {(user.roles || ["USER"]).map((role) => <span key={role} className="rounded-full bg-muted px-2 py-0.5 text-xs">{role}</span>)}
                          {user.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"><BadgeCheck className="h-3 w-3" /> vérifié</span>}
                          {user.suspended && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">SUSPENDU</span>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{user.email || "email absent"} · {user.profileVisibility || "PUBLIC"}</p>
                        {user.suspendedReason && <p className="mt-1 text-xs text-red-700">{user.suspendedReason}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionButton disabled={busyId === user.id} onClick={() => showUserInfo(user)}>Infos</ActionButton>
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => setRole(user, "USER")}>User</ActionButton>
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => setRole(user, "MODERATOR")}>Modo</ActionButton>
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => setRole(user, "ADMIN")}>Admin</ActionButton>
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => toggleVerified(user)}>
                          {user.isVerified ? "Dé-vérifier" : "Vérifier"}
                        </ActionButton>
                        <ActionButton danger={Boolean(!user.suspended)} disabled={busyId === user.id} onClick={() => suspendUser(user)}>
                          {user.suspended ? "Réactiver" : "Suspendre"}
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                  {!users.content.length && <EmptyLine text="Aucun utilisateur trouvé" />}
                </div>
                <Pager page={users} onPage={(page) => loadPage("users", page)} />
                {selectedUserDetail && (
                  <section className="rounded-lg border bg-background">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div>
                        <h2 className="text-sm font-semibold">Infos utilisateur</h2>
                        <p className="text-xs text-muted-foreground">@{selectedUserDetail.profile.username}</p>
                      </div>
                      <button onClick={() => setSelectedUserDetail(null)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">Fermer</button>
                    </div>
                    <div className="grid gap-4 p-4 lg:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Identité</p>
                        <p className="mt-2 text-sm">Email: {selectedUserDetail.profile.email || selectedUserDetail.auth?.email || "absent"}</p>
                        <p className="text-sm">Nom: {selectedUserDetail.profile.fullname || selectedUserDetail.profile.fullName || "-"}</p>
                        <p className="text-sm">Ville: {selectedUserDetail.profile.location || "-"}</p>
                        <p className="text-sm">Visibilité: {selectedUserDetail.profile.profileVisibility || "PUBLIC"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Compte</p>
                        <p className="mt-2 text-sm">Rôles: {(selectedUserDetail.auth?.roles || selectedUserDetail.profile.roles || ["USER"]).join(", ")}</p>
                        <p className="text-sm">Actif: {selectedUserDetail.auth?.isActive ? "oui" : "non"}</p>
                        <p className="text-sm">Suspendu: {selectedUserDetail.profile.suspended ? "oui" : "non"}</p>
                        <p className="text-sm">Vérifié: {selectedUserDetail.auth?.isVerified || selectedUserDetail.profile.isVerified ? "oui" : "non"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Activité</p>
                        <p className="mt-2 text-sm">Posts: {selectedUserDetail.stats.posts}</p>
                        <p className="text-sm">Commentaires: {selectedUserDetail.stats.comments}</p>
                        <p className="text-sm">Signalements envoyés: {selectedUserDetail.stats.reports}</p>
                        <p className="text-sm">Followers: {selectedUserDetail.profile.followersCount || 0}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 border-t p-4 lg:grid-cols-2">
                      <RecentList title="Derniers posts de l'utilisateur" rows={selectedUserDetail.recentPosts.map((post) => post.content || `Post ${post.id}`)} />
                      <RecentList title="Derniers signalements envoyés" rows={selectedUserDetail.recentReports.map((report) => `${report.contentType} · ${report.status} · ${report.reason}`)} />
                    </div>
                  </section>
                )}
              </section>
            )}

            {activeTab === "content" && (
              <section className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <select value={contentType} onChange={(event) => setContentType(event.target.value as AdminContentType)} className="rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="POST">Posts</option>
                    <option value="COMMENT">Commentaires</option>
                    <option value="STORY">Stories</option>
                    <option value="VIDEO">Vidéos</option>
                  </select>
                  <div className="relative min-w-[240px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input value={contentQuery} onChange={(event) => setContentQuery(event.target.value)} placeholder="Chercher contenu ou auteur" className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm" />
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border bg-background">
                  {content.content.map((post) => (
                    <div key={post.id} className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{contentType}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{post.visibility || "PUBLIC"}</span>
                          <span className="text-xs text-muted-foreground">{post.createdAt ? new Date(post.createdAt).toLocaleString() : "date inconnue"}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm">{post.content || post.title || post.description || "Contenu média"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Auteur: {post.authorId || post.userId || "inconnu"} · ID: {post.id}</p>
                      </div>
                      <button disabled={busyId === post.id} onClick={() => deleteContent(post.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  ))}
                  {!content.content.length && <EmptyLine text="Aucun contenu récent" />}
                </div>
                <Pager page={content} onPage={(page) => loadPage("content", page)} />
              </section>
            )}

            {activeTab === "broadcast" && (
              <section className="rounded-lg border bg-background">
                <div className="border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">Notification globale</h2>
                  <p className="text-xs text-muted-foreground">Envoie une notification in-app et email selon la configuration SMTP.</p>
                </div>
                <div className="grid gap-3 p-4">
                  <select value={broadcastTarget} onChange={(event) => setBroadcastTarget(event.target.value as "ALL" | "ACTIVE")} className="max-w-xs rounded-lg border bg-background px-3 py-2 text-sm">
                    <option value="ACTIVE">Utilisateurs actifs</option>
                    <option value="ALL">Tous les utilisateurs</option>
                  </select>
                  <input value={broadcastTitle} onChange={(event) => setBroadcastTitle(event.target.value)} placeholder="Titre" className="rounded-lg border bg-background px-3 py-2 text-sm" />
                  <textarea value={broadcastBody} onChange={(event) => setBroadcastBody(event.target.value)} placeholder="Message" rows={5} className="rounded-lg border bg-background px-3 py-2 text-sm" />
                  <button disabled={busyId === "broadcast" || !canAdmin} onClick={sendBroadcast} className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    <Mail className="h-4 w-4" />
                    Envoyer
                  </button>
                </div>
              </section>
            )}

            {activeTab === "audit" && (
              <section className="space-y-3">
                <div className="overflow-hidden rounded-lg border bg-background">
                  {audit.content.map((entry) => (
                    <div key={entry.id} className="border-b p-4 last:border-b-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{entry.action}</span>
                        <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Acteur: {entry.actorId}</p>
                      {entry.details && <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">{JSON.stringify(entry.details, null, 2)}</pre>}
                    </div>
                  ))}
                  {!audit.content.length && <EmptyLine text="Aucune action auditée" />}
                </div>
                <Pager page={audit} onPage={(page) => loadPage("audit", page)} />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ActionButton = ({ children, disabled, danger, onClick }: { children: ReactNode; disabled?: boolean; danger?: boolean; onClick: () => void }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`h-9 rounded-lg border px-3 text-sm disabled:opacity-50 ${
      danger ? "border-red-200 text-red-700 hover:bg-red-50" : "hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const EmptyLine = ({ text }: { text: string }) => (
  <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>
);

const Pager = <T,>({ page, onPage }: { page: PageResponse<T>; onPage: (page: number) => void }) => {
  const current = page.currentPage ?? page.page ?? 0;
  const totalPages = page.totalPages || 0;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        Page {current + 1} / {totalPages} · {page.totalElements} élément(s)
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={current <= 0}
          onClick={() => onPage(current - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border px-2 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Précédent
        </button>
        <button
          disabled={current + 1 >= totalPages}
          onClick={() => onPage(current + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border px-2 disabled:opacity-50"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const RecentList = ({ title, rows }: { title: string; rows: string[] }) => (
  <section className="rounded-lg border bg-background">
    <h2 className="border-b px-4 py-3 text-sm font-semibold">{title}</h2>
    <div>
      {rows.length ? rows.map((row, index) => (
        <p key={`${row}-${index}`} className="border-b px-4 py-3 text-sm last:border-b-0">{row}</p>
      )) : <EmptyLine text="Aucune donnée" />}
    </div>
  </section>
);

export default AdminPage;
