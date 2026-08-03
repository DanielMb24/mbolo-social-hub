import { Compass, FileText, Loader2, Plus, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { groupApi, moderationApi, pageApi, postApi, recommendationApi, type GroupJoinRequest, type GroupMember, type Post, type RecommendationResponse, type SocialGroup, type SocialPage } from "@/lib/api";
import { toast } from "sonner";

type HubTab = "discover" | "groups" | "pages";

const emptyRecommendations: RecommendationResponse = { people: [], groups: [], pages: [], posts: [] };

const SocialHubPage = () => {
  const [activeTab, setActiveTab] = useState<HubTab>("discover");
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SocialGroup[]>([]);
  const [pages, setPages] = useState<SocialPage[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResponse>(emptyRecommendations);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ type: "GROUP" | "PAGE"; id: string; name: string } | null>(null);
  const [targetPosts, setTargetPosts] = useState<Post[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [postContent, setPostContent] = useState("");
  const [postVisibility, setPostVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", visibility: "PUBLIC" as "PUBLIC" | "PRIVATE" });
  const [pageForm, setPageForm] = useState({ name: "", category: "Communauté", description: "" });

  useEffect(() => {
    void loadHub();
  }, []);

  useEffect(() => {
    if (!selectedTarget) {
      setTargetPosts([]);
      return;
    }
    void loadTargetPosts(selectedTarget);
  }, [selectedTarget]);

  const loadHub = async () => {
    setLoading(true);
    try {
      const [groupRows, pageRows, recommendationRows] = await Promise.all([
        groupApi.list(),
        pageApi.list(),
        recommendationApi.get(),
      ]);
      setGroups(groupRows);
      setPages(pageRows);
      setRecommendations(recommendationRows);
    } catch {
      toast.error("Impossible de charger le hub social");
    } finally {
      setLoading(false);
    }
  };

  const loadTargetPosts = async (target: { type: "GROUP" | "PAGE"; id: string }) => {
    setLoadingPosts(true);
    try {
      const [rows, requests, memberRows] = await Promise.all([
        postApi.getFeed(0, 20, { targetType: target.type, targetId: target.id }),
        target.type === "GROUP" ? groupApi.getRequests(target.id).catch(() => []) : Promise.resolve([]),
        target.type === "GROUP" ? groupApi.getMembers(target.id).catch(() => []) : Promise.resolve([]),
      ]);
      setTargetPosts(rows);
      setJoinRequests(requests);
      setMembers(memberRows);
    } catch {
      setTargetPosts([]);
      setJoinRequests([]);
      setMembers([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const changeMemberRole = async (member: GroupMember, role: "MEMBER" | "MODERATOR" | "ADMIN") => {
    if (!selectedTarget || selectedTarget.type !== "GROUP") return;
    try {
      const updated = await groupApi.setMemberRole(selectedTarget.id, member.userId, role);
      setGroups(prev => prev.map(group => group.id === selectedTarget.id ? updated : group));
      setMembers(prev => prev.map(item => item.userId === member.userId ? { ...item, role } : item));
      toast.success("Rôle mis à jour");
    } catch {
      toast.error("Action impossible");
    }
  };

  const removeMember = async (member: GroupMember) => {
    if (!selectedTarget || selectedTarget.type !== "GROUP") return;
    try {
      const updated = await groupApi.removeMember(selectedTarget.id, member.userId);
      setGroups(prev => prev.map(group => group.id === selectedTarget.id ? updated : group));
      setMembers(prev => prev.filter(item => item.userId !== member.userId));
      toast.success("Membre retiré");
    } catch {
      toast.error("Action impossible");
    }
  };

  const deleteTargetPost = async (postId: string) => {
    try {
      await postApi.deletePost(postId);
      setTargetPosts(prev => prev.filter(post => post.id !== postId));
      toast.success("Publication supprimée");
    } catch {
      toast.error("Suppression impossible");
    }
  };

  const reportTargetPost = async (postId: string) => {
    try {
      await moderationApi.reportContent(postId, "post", `Signalement depuis ${selectedTarget?.type || "communauté"}`);
      toast.success("Signalement envoyé");
    } catch {
      toast.error("Signalement impossible");
    }
  };

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return groups;
    return groups.filter(group =>
      group.name.toLowerCase().includes(normalized) ||
      String(group.description || "").toLowerCase().includes(normalized)
    );
  }, [groups, query]);

  const filteredPages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pages;
    return pages.filter(page =>
      page.name.toLowerCase().includes(normalized) ||
      page.category.toLowerCase().includes(normalized) ||
      String(page.description || "").toLowerCase().includes(normalized)
    );
  }, [pages, query]);

  const createGroup = async () => {
    if (!groupForm.name.trim() || saving) return;
    setSaving(true);
    try {
      const group = await groupApi.create(groupForm);
      setGroups(prev => [group, ...prev]);
      setGroupForm({ name: "", description: "", visibility: "PUBLIC" });
      toast.success("Groupe créé");
    } catch (error: any) {
      toast.error(error?.message || "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  const createPage = async () => {
    if (!pageForm.name.trim() || saving) return;
    setSaving(true);
    try {
      const page = await pageApi.create(pageForm);
      setPages(prev => [page, ...prev]);
      setPageForm({ name: "", category: "Communauté", description: "" });
      toast.success("Page créée");
    } catch (error: any) {
      toast.error(error?.message || "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const group = await groupApi.join(groupId);
      setGroups(prev => prev.map(item => item.id === groupId ? group : item));
      toast.success(group.visibility === "PRIVATE" ? "Demande envoyée" : "Vous avez rejoint le groupe");
    } catch {
      toast.error("Action impossible");
    }
  };

  const publishToTarget = async () => {
    if (!selectedTarget || !postContent.trim() || saving) return;
    setSaving(true);
    try {
      const post = await postApi.createPost({
        content: postContent,
        targetType: selectedTarget.type,
        targetId: selectedTarget.id,
        visibility: postVisibility,
      });
      setTargetPosts(prev => [post, ...prev]);
      setPostContent("");
      setPostVisibility("PUBLIC");
      toast.success("Publication ajoutée");
    } catch (error: any) {
      toast.error(error?.message || "Publication impossible");
    } finally {
      setSaving(false);
    }
  };

  const resolveJoinRequest = async (request: GroupJoinRequest, action: "approve" | "reject") => {
    if (!selectedTarget || selectedTarget.type !== "GROUP") return;
    try {
      const updated = action === "approve"
        ? await groupApi.approveRequest(selectedTarget.id, request.userId)
        : await groupApi.rejectRequest(selectedTarget.id, request.userId);
      setGroups(prev => prev.map(group => group.id === selectedTarget.id ? updated : group));
      setJoinRequests(prev => prev.filter(item => item.userId !== request.userId));
      if (action === "approve") {
        setMembers(prev => [
          ...prev,
          {
            id: request.id,
            groupId: request.groupId,
            userId: request.userId,
            user: request.user,
            role: "MEMBER",
            status: "ACTIVE",
            createdAt: request.createdAt,
          },
        ]);
      }
      toast.success(action === "approve" ? "Demande acceptée" : "Demande refusée");
    } catch {
      toast.error("Action impossible");
    }
  };

  const followPage = async (pageId: string) => {
    try {
      const page = await pageApi.follow(pageId);
      setPages(prev => prev.map(item => item.id === pageId ? page : item));
      toast.success("Page suivie");
    } catch {
      toast.error("Action impossible");
    }
  };

  const tabs: { id: HubTab; label: string; icon: React.ElementType }[] = [
    { id: "discover", label: "Découvrir", icon: Sparkles },
    { id: "groups", label: "Groupes", icon: Users },
    { id: "pages", label: "Pages", icon: FileText },
  ];

  return (
    <div className="flex justify-center min-w-0">
      <div className="w-full max-w-5xl min-w-0 pb-6">
        <div className="sticky top-0 z-10 border-b bg-background/95 px-3 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Communautés</h2>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-lg bg-muted py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Rechercher groupes, pages, sujets..."
              />
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                      activeTab === tab.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            Chargement...
          </div>
        ) : (
          <div className="p-3">
            {selectedTarget && (
              <section className="mb-3 rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{selectedTarget.type === "GROUP" ? "Groupe" : "Page"}</p>
                    <h3 className="text-sm font-bold">{selectedTarget.name}</h3>
                  </div>
                  <button onClick={() => setSelectedTarget(null)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Fermer</button>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={postContent}
                    onChange={event => setPostContent(event.target.value)}
                    className="input-modern"
                    placeholder={`Publier dans ${selectedTarget.name}`}
                  />
                  <button onClick={publishToTarget} disabled={saving || !postContent.trim()} className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                    Publier
                  </button>
                </div>
                <select
                  value={postVisibility}
                  onChange={event => setPostVisibility(event.target.value as "PUBLIC" | "PRIVATE")}
                  className="mt-2 rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privé</option>
                </select>
                {joinRequests.length > 0 && (
                  <div className="mt-3 rounded-lg border bg-background">
                    <div className="border-b px-3 py-2">
                      <p className="text-sm font-bold">Demandes d'adhésion</p>
                    </div>
                    <div className="divide-y">
                      {joinRequests.map(request => (
                        <div key={request.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{request.user?.fullname || request.user?.username || request.userId}</p>
                            {request.user?.username && <p className="truncate text-xs text-muted-foreground">@{request.user.username}</p>}
                            <p className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => resolveJoinRequest(request, "reject")} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">
                              Refuser
                            </button>
                            <button onClick={() => resolveJoinRequest(request, "approve")} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                              Accepter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedTarget.type === "GROUP" && members.length > 0 && (
                  <div className="mt-3 rounded-lg border bg-background">
                    <div className="border-b px-3 py-2">
                      <p className="text-sm font-bold">Membres</p>
                    </div>
                    <div className="max-h-72 divide-y overflow-y-auto">
                      {members.map(member => (
                        <div key={member.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{member.user?.fullname || member.user?.username || member.userId}</p>
                            <p className="truncate text-xs text-muted-foreground">@{member.user?.username || member.userId} · {member.role}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <select value={member.role} onChange={event => changeMemberRole(member, event.target.value as "MEMBER" | "MODERATOR" | "ADMIN")} className="rounded-lg border bg-card px-2 py-1.5 text-xs">
                              <option value="MEMBER">Membre</option>
                              <option value="MODERATOR">Modérateur</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button onClick={() => removeMember(member)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-destructive">
                              Retirer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {loadingPosts ? (
                    <p className="text-sm text-muted-foreground">Chargement du fil...</p>
                  ) : targetPosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune publication dans cet espace.</p>
                  ) : targetPosts.map(post => (
                    <article key={post.id} className="rounded-lg bg-muted p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="whitespace-pre-wrap break-words text-sm">{post.content}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString("fr-FR")} · {post.visibility === "PRIVATE" ? "Privé" : "Public"}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button onClick={() => reportTargetPost(post.id)} className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold">
                            Signaler
                          </button>
                          <button onClick={() => deleteTargetPost(post.id)} className="rounded-lg border bg-card px-2 py-1 text-xs font-semibold text-destructive">
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "discover" && (
              <div className="grid gap-3 lg:grid-cols-3">
                <RecommendationCard title="Personnes" icon={Users}>
                  {recommendations.people.slice(0, 5).map(user => (
                    <CompactRow key={user.id} title={user.fullname || user.username} meta={`@${user.username}`} />
                  ))}
                </RecommendationCard>
                <RecommendationCard title="Groupes actifs" icon={Users}>
                  {recommendations.groups.slice(0, 5).map(group => (
                    <CompactRow key={group.id} title={group.name} meta={`${group.membersCount || 0} membres`} onClick={() => setSelectedTarget({ type: "GROUP", id: group.id, name: group.name })} />
                  ))}
                </RecommendationCard>
                <RecommendationCard title="Pages à suivre" icon={FileText}>
                  {recommendations.pages.slice(0, 5).map(page => (
                    <CompactRow key={page.id} title={page.name} meta={`${page.category} · ${page.followersCount || 0} abonnés`} onClick={() => setSelectedTarget({ type: "PAGE", id: page.id, name: page.name })} />
                  ))}
                </RecommendationCard>
              </div>
            )}

            {activeTab === "groups" && (
              <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
                <CreatePanel title="Créer un groupe" onSubmit={createGroup} saving={saving}>
                  <input className="input-modern" placeholder="Nom du groupe" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} />
                  <textarea className="input-modern min-h-24 resize-none" placeholder="Description" value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} />
                  <select className="input-modern" value={groupForm.visibility} onChange={e => setGroupForm({ ...groupForm, visibility: e.target.value as "PUBLIC" | "PRIVATE" })}>
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Privé</option>
                  </select>
                </CreatePanel>
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredGroups.map(group => (
                    <SocialCard
                      key={group.id}
                      title={group.name}
                      meta={`${group.visibility === "PRIVATE" ? "Privé" : "Public"} · ${group.membersCount || 0} membres`}
                      description={group.description}
                      actionLabel="Rejoindre"
                      onAction={() => joinGroup(group.id)}
                      onOpen={() => setSelectedTarget({ type: "GROUP", id: group.id, name: group.name })}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === "pages" && (
              <div className="grid gap-3 lg:grid-cols-[320px_1fr]">
                <CreatePanel title="Créer une page" onSubmit={createPage} saving={saving}>
                  <input className="input-modern" placeholder="Nom de la page" value={pageForm.name} onChange={e => setPageForm({ ...pageForm, name: e.target.value })} />
                  <input className="input-modern" placeholder="Catégorie" value={pageForm.category} onChange={e => setPageForm({ ...pageForm, category: e.target.value })} />
                  <textarea className="input-modern min-h-24 resize-none" placeholder="Description" value={pageForm.description} onChange={e => setPageForm({ ...pageForm, description: e.target.value })} />
                </CreatePanel>
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredPages.map(page => (
                    <SocialCard
                      key={page.id}
                      title={page.name}
                      meta={`${page.category} · ${page.followersCount || 0} abonnés`}
                      description={page.description}
                      actionLabel="Suivre"
                      onAction={() => followPage(page.id)}
                      onOpen={() => setSelectedTarget({ type: "PAGE", id: page.id, name: page.name })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RecommendationCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <section className="rounded-lg border bg-card">
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-bold">{title}</h3>
    </div>
    <div className="divide-y">{children}</div>
  </section>
);

const CompactRow = ({ title, meta, onClick }: { title: string; meta: string; onClick?: () => void }) => (
  <button onClick={onClick} className="w-full px-3 py-2 text-left hover:bg-muted/60">
    <p className="truncate text-sm font-semibold">{title || "Sans nom"}</p>
    <p className="truncate text-xs text-muted-foreground">{meta}</p>
  </button>
);

const CreatePanel = ({ title, children, onSubmit, saving }: { title: string; children: React.ReactNode; onSubmit: () => void; saving: boolean }) => (
  <section className="rounded-lg border bg-card p-3">
    <h3 className="mb-3 text-sm font-bold">{title}</h3>
    <div className="space-y-2">{children}</div>
    <button onClick={onSubmit} disabled={saving} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Créer
    </button>
  </section>
);

const SocialCard = ({ title, meta, description, actionLabel, onAction, onOpen }: { title: string; meta: string; description?: string; actionLabel: string; onAction: () => void; onOpen: () => void }) => (
  <article className="rounded-lg border bg-card p-3">
    <div className="flex items-start justify-between gap-3">
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <h3 className="truncate text-sm font-bold">{title}</h3>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </button>
      <button onClick={onAction} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
        {actionLabel}
      </button>
    </div>
    {description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{description}</p>}
  </article>
);

export default SocialHubPage;
