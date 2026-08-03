import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileText,
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
  tokenManager,
  type AdminAuditLog,
  type AdminOverview,
  type AdminReport,
  type PageResponse,
  type Post,
  type UserProfile,
} from "@/lib/api";

type AdminTab = "overview" | "reports" | "users" | "content" | "audit";

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
  const [query, setQuery] = useState("");
  const [reportStatus, setReportStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const roles = useMemo(getRolesFromToken, []);
  const canAdmin = roles.includes("ADMIN");
  const canModerate = canAdmin || roles.includes("MODERATOR");

  const loadAll = async () => {
    if (!canModerate) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [overviewData, reportData, userData, contentData, auditData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getReports(0, 20, reportStatus),
        adminApi.getUsers(0, 20, query),
        adminApi.getContent(0, 20),
        adminApi.getAudit(0, 30),
      ]);
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
  }, [canModerate, reportStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (activeTab === "users") {
        adminApi.getUsers(0, 20, query).then(setUsers).catch(() => undefined);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, activeTab]);

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

  const deletePost = async (postId: string) => {
    if (!window.confirm("Supprimer cette publication ?")) return;
    setBusyId(postId);
    const previous = content;
    setContent((page) => ({ ...page, content: page.content.filter((post) => post.id !== postId) }));
    try {
      await adminApi.deletePost(postId);
      toast.success("Publication supprimée");
      loadAll();
    } catch (error) {
      setContent(previous);
      toast.error(error instanceof Error ? error.message : "Suppression impossible");
    } finally {
      setBusyId(null);
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
                  <StatTile label="Notifications non lues" value={overview.stats.unreadNotifications} icon={CheckCircle2} />
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
                          {user.suspended && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">SUSPENDU</span>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{user.email || "email absent"} · {user.profileVisibility || "PUBLIC"}</p>
                        {user.suspendedReason && <p className="mt-1 text-xs text-red-700">{user.suspendedReason}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => setRole(user, "USER")}>User</ActionButton>
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => setRole(user, "MODERATOR")}>Modo</ActionButton>
                        <ActionButton disabled={busyId === user.id || !canAdmin} onClick={() => setRole(user, "ADMIN")}>Admin</ActionButton>
                        <ActionButton danger={Boolean(!user.suspended)} disabled={busyId === user.id} onClick={() => suspendUser(user)}>
                          {user.suspended ? "Réactiver" : "Suspendre"}
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                  {!users.content.length && <EmptyLine text="Aucun utilisateur trouvé" />}
                </div>
              </section>
            )}

            {activeTab === "content" && (
              <div className="overflow-hidden rounded-lg border bg-background">
                {content.content.map((post) => (
                  <div key={post.id} className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">Post</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{post.visibility || "PUBLIC"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm">{post.content || "Publication média"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Auteur: {post.authorId} · {post.commentsCount || 0} commentaires</p>
                    </div>
                    <button disabled={busyId === post.id} onClick={() => deletePost(post.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                ))}
                {!content.content.length && <EmptyLine text="Aucun contenu récent" />}
              </div>
            )}

            {activeTab === "audit" && (
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
