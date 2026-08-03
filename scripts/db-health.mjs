import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
const shouldFix = process.argv.includes("--fix");

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const prefix = process.env.MONGODB_SERVICE_PREFIX || "mbolo";
const dbName = (name) => process.env[`MONGODB_${name.toUpperCase()}_DB`] || `${prefix}_${name}`;
const makeId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : id);
const nowIso = () => new Date().toISOString();

const client = new MongoClient(uri);
const report = { mode: shouldFix ? "fix" : "audit", checks: [], fixes: [] };

const add = (name, data = {}) => report.checks.push({ name, ...data });
const fix = (name, data = {}) => report.fixes.push({ name, ...data });

try {
  await client.connect();

  const authDb = client.db(dbName("auth"));
  const userDb = client.db(dbName("user"));
  const postDb = client.db(dbName("post"));
  const chatDb = client.db(dbName("chat"));
  const moderationDb = client.db(dbName("moderation"));

  const authUsers = authDb.collection("users_auth");
  const refreshTokens = authDb.collection("refresh_tokens");
  const resetTokens = authDb.collection("password_reset_tokens");
  const emailCodes = authDb.collection("email_verification_codes");
  const profiles = userDb.collection("users_profile");
  const follows = userDb.collection("user_follows");
  const followRequests = userDb.collection("user_follow_requests");
  const posts = postDb.collection("posts");
  const savedPosts = postDb.collection("saved_posts");
  const comments = postDb.collection("comments");
  const stories = postDb.collection("stories");
  const notifications = postDb.collection("notifications");
  const videos = postDb.collection("videos");
  const groups = postDb.collection("groups");
  const groupMembers = postDb.collection("group_members");
  const pages = postDb.collection("pages");
  const pageFollowers = postDb.collection("page_followers");
  const conversations = chatDb.collection("conversations");
  const messages = chatDb.collection("messages");
  const reports = moderationDb.collection("reports");
  const auditLogs = moderationDb.collection("audit_logs");
  const settings = moderationDb.collection("platform_settings");

  const collectionCounts = {
    authUsers: await authUsers.countDocuments(),
    profiles: await profiles.countDocuments(),
    posts: await posts.countDocuments(),
    comments: await comments.countDocuments(),
    stories: await stories.countDocuments(),
    videos: await videos.countDocuments(),
    groups: await groups.countDocuments(),
    pages: await pages.countDocuments(),
    conversations: await conversations.countDocuments(),
    messages: await messages.countDocuments(),
    reports: await reports.countDocuments(),
  };
  add("collection-counts", collectionCounts);

  const authWithoutProfile = await authUsers.find({}, { projection: { username: 1, email: 1, roles: 1, isActive: 1, isVerified: 1, createdAt: 1 } }).toArray();
  let missingProfiles = 0;
  let normalizedAuth = 0;
  for (const user of authWithoutProfile) {
    const userId = String(user._id);
    const profile = await profiles.findOne({ _id: user._id });
    if (!profile) {
      missingProfiles += 1;
      if (shouldFix) {
        await profiles.insertOne({
          _id: user._id,
          username: user.username || user.email?.split("@")[0] || `user_${userId.slice(-6)}`,
          email: user.email || "",
          fullname: "",
          bio: "",
          blockedUsers: [],
          profileVisibility: "PUBLIC",
          followersCount: 0,
          followingCount: 0,
          isVerified: Boolean(user.isVerified),
          suspended: Boolean(user.suspended),
          createdAt: user.createdAt || nowIso(),
          updatedAt: nowIso(),
        });
      }
    }

    const authPatch = {};
    if (!Array.isArray(user.roles) || user.roles.length === 0) authPatch.roles = ["USER"];
    if (typeof user.isActive !== "boolean") authPatch.isActive = true;
    if (typeof user.isVerified !== "boolean") authPatch.isVerified = false;
    if (Object.keys(authPatch).length) {
      normalizedAuth += 1;
      if (shouldFix) await authUsers.updateOne({ _id: user._id }, { $set: { ...authPatch, updatedAt: nowIso() } });
    }
  }
  add("auth-profile-consistency", { missingProfiles, authRowsNeedingDefaults: normalizedAuth });
  if (shouldFix && missingProfiles) fix("created-missing-profiles", { count: missingProfiles });
  if (shouldFix && normalizedAuth) fix("normalized-auth-defaults", { count: normalizedAuth });

  const profileDefaults = await profiles.updateMany(
    { $or: [{ blockedUsers: { $exists: false } }, { profileVisibility: { $exists: false } }, { followersCount: { $exists: false } }, { followingCount: { $exists: false } }] },
    { $set: { blockedUsers: [], profileVisibility: "PUBLIC", followersCount: 0, followingCount: 0, updatedAt: nowIso() } }
  );
  if (shouldFix && profileDefaults.modifiedCount) fix("normalized-profile-defaults", { count: profileDefaults.modifiedCount });

  let followCounterFixes = 0;
  if (shouldFix) {
    const profileIds = await profiles.find({}, { projection: { _id: 1 } }).toArray();
    for (const profile of profileIds) {
      const id = String(profile._id);
      const followersCount = await follows.countDocuments({ followingId: id });
      const followingCount = await follows.countDocuments({ followerId: id });
      const result = await profiles.updateOne({ _id: profile._id }, { $set: { followersCount, followingCount } });
      followCounterFixes += result.modifiedCount;
    }
    fix("synced-follow-counters", { touched: followCounterFixes });
  }

  let postCommentCounterFixes = 0;
  if (shouldFix) {
    const postIds = await posts.find({}, { projection: { _id: 1 } }).toArray();
    for (const post of postIds) {
      const postId = String(post._id);
      const commentsCount = await comments.countDocuments({ postId });
      const result = await posts.updateOne({ _id: post._id }, { $set: { commentsCount } });
      postCommentCounterFixes += result.modifiedCount;
    }
    fix("synced-post-comment-counters", { touched: postCommentCounterFixes });
  }

  let groupCounterFixes = 0;
  if (shouldFix) {
    const groupIds = await groups.find({}, { projection: { _id: 1 } }).toArray();
    for (const group of groupIds) {
      const groupId = String(group._id);
      const membersCount = await groupMembers.countDocuments({ groupId, status: "ACTIVE" });
      const result = await groups.updateOne({ _id: group._id }, { $set: { membersCount } });
      groupCounterFixes += result.modifiedCount;
    }
    fix("synced-group-member-counters", { touched: groupCounterFixes });
  }

  let pageCounterFixes = 0;
  if (shouldFix) {
    const pageIds = await pages.find({}, { projection: { _id: 1 } }).toArray();
    for (const page of pageIds) {
      const pageId = String(page._id);
      const followersCount = await pageFollowers.countDocuments({ pageId });
      const result = await pages.updateOne({ _id: page._id }, { $set: { followersCount } });
      pageCounterFixes += result.modifiedCount;
    }
    fix("synced-page-follower-counters", { touched: pageCounterFixes });
  }

  const orphanComments = await comments.countDocuments({ postId: { $exists: false } });
  const orphanMessages = await messages.countDocuments({ conversationId: { $exists: false } });
  const danglingRefreshTokens = await refreshTokens.countDocuments({ jti: { $in: [null, ""] } });
  add("data-quality", { orphanComments, orphanMessages, refreshTokensWithoutJti: danglingRefreshTokens });

  if (shouldFix) {
    const expiredAt = nowIso();
    const expiredReset = await resetTokens.updateMany({ expiresAt: { $lt: expiredAt }, consumedAt: { $exists: false } }, { $set: { consumedAt: expiredAt, consumedReason: "expired" } });
    const expiredEmail = await emailCodes.updateMany({ expiresAt: { $lt: expiredAt }, consumedAt: { $exists: false } }, { $set: { consumedAt: expiredAt, consumedReason: "expired" } });
    fix("expired-old-codes", { passwordReset: expiredReset.modifiedCount, emailVerification: expiredEmail.modifiedCount });

    await settings.updateOne(
      { _id: "main" },
      {
        $setOnInsert: {
          registrationEnabled: true,
          maintenanceMode: false,
          defaultProfileVisibility: "PUBLIC",
          createdAt: nowIso(),
        },
        $set: { updatedAt: nowIso() },
      },
      { upsert: true }
    );
    fix("ensured-platform-settings", { id: "main" });
  }

  await auditLogs.insertOne({
    actorId: "system",
    action: shouldFix ? "DB_HEALTH_FIX" : "DB_HEALTH_AUDIT",
    details: {
      counts: collectionCounts,
      checks: report.checks,
      fixes: report.fixes,
    },
    createdAt: nowIso(),
  });

  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.close();
}
