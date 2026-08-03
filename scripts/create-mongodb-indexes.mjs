import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

const prefix = process.env.MONGODB_SERVICE_PREFIX || "mbolo";
const dbName = (name) => process.env[`MONGODB_${name.toUpperCase()}_DB`] || `${prefix}_${name}`;

const client = new MongoClient(uri);

try {
  await client.connect();

  const authDb = client.db(dbName("auth"));
  await authDb.collection("users_auth").createIndexes([
    { key: { username: 1 }, unique: true, name: "auth_username_unique" },
    { key: { email: 1 }, unique: true, name: "auth_email_unique" },
  ]);
  await authDb.collection("refresh_tokens").createIndexes([
    { key: { jti: 1 }, unique: true, name: "refresh_jti_unique", partialFilterExpression: { jti: { $type: "string" } } },
    { key: { userId: 1, revokedAt: 1 }, name: "refresh_user_revoked" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "refresh_expiry_ttl" },
  ]);
  await authDb.collection("password_reset_tokens").createIndexes([
    { key: { email: 1, purpose: 1, createdAt: -1 }, name: "password_reset_email_purpose_created" },
    { key: { userId: 1, purpose: 1, consumedAt: 1 }, name: "password_reset_user_purpose_consumed" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "password_reset_expiry_ttl" },
  ]);
  await authDb.collection("email_verification_codes").createIndexes([
    { key: { email: 1, purpose: 1, createdAt: -1 }, name: "email_codes_email_purpose_created" },
    { key: { userId: 1, purpose: 1, consumedAt: 1 }, name: "email_codes_user_purpose_consumed" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "email_codes_expiry_ttl" },
  ]);

  const userDb = client.db(dbName("user"));
  await userDb.collection("users_profile").createIndexes([
    { key: { username: 1 }, name: "profile_username_lookup" },
    { key: { profileVisibility: 1, createdAt: -1 }, name: "profile_visibility_created" },
    { key: { blockedUsers: 1 }, name: "profile_blocked_users" },
    { key: { username: "text", fullname: "text", bio: "text" }, name: "profile_text_search" },
  ]);
  await userDb.collection("user_follows").createIndexes([
    { key: { followerId: 1, followingId: 1 }, unique: true, name: "follow_pair_unique" },
    { key: { followingId: 1 }, name: "follow_following" },
  ]);
  await userDb.collection("user_follow_requests").createIndexes([
    { key: { requesterId: 1, targetId: 1 }, unique: true, name: "follow_request_pair_unique" },
    { key: { targetId: 1, status: 1, createdAt: -1 }, name: "follow_request_target_status" },
    { key: { requesterId: 1, status: 1, createdAt: -1 }, name: "follow_request_requester_status" },
  ]);

  const postDb = client.db(dbName("post"));
  await postDb.collection("posts").createIndexes([
    { key: { createdAt: -1 }, name: "posts_created_desc" },
    { key: { authorId: 1, createdAt: -1 }, name: "posts_author_created" },
    { key: { targetType: 1, targetId: 1, createdAt: -1 }, name: "posts_target_created" },
  ]);
  await postDb.collection("saved_posts").createIndexes([
    { key: { userId: 1, postId: 1 }, unique: true, name: "saved_posts_user_post_unique" },
    { key: { userId: 1, createdAt: -1 }, name: "saved_posts_user_created" },
  ]);
  await postDb.collection("comments").createIndexes([
    { key: { postId: 1, createdAt: 1 }, name: "comments_post_created" },
    { key: { authorId: 1 }, name: "comments_author" },
  ]);
  await postDb.collection("stories").createIndexes([
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "stories_expiry_ttl" },
    { key: { userId: 1, createdAt: -1 }, name: "stories_user_created" },
  ]);
  await postDb.collection("notifications").createIndexes([
    { key: { userId: 1, createdAt: -1 }, name: "notifications_user_created" },
    { key: { userId: 1, read: 1 }, name: "notifications_user_read" },
  ]);
  await postDb.collection("videos").createIndexes([
    { key: { createdAt: -1 }, name: "videos_created_desc" },
    { key: { userId: 1, createdAt: -1 }, name: "videos_user_created" },
  ]);
  await postDb.collection("groups").createIndexes([
    { key: { slug: 1 }, unique: true, name: "groups_slug_unique" },
    { key: { visibility: 1, createdAt: -1 }, name: "groups_visibility_created" },
    { key: { name: "text", description: "text" }, name: "groups_text_search" },
  ]);
  await postDb.collection("group_members").createIndexes([
    { key: { groupId: 1, userId: 1 }, unique: true, name: "group_members_group_user_unique" },
    { key: { userId: 1, role: 1 }, name: "group_members_user_role" },
  ]);
  await postDb.collection("pages").createIndexes([
    { key: { slug: 1 }, unique: true, name: "pages_slug_unique" },
    { key: { ownerId: 1, createdAt: -1 }, name: "pages_owner_created" },
    { key: { name: "text", description: "text", category: "text" }, name: "pages_text_search" },
  ]);
  await postDb.collection("page_followers").createIndexes([
    { key: { pageId: 1, userId: 1 }, unique: true, name: "page_followers_page_user_unique" },
    { key: { userId: 1, createdAt: -1 }, name: "page_followers_user_created" },
  ]);

  const chatDb = client.db(dbName("chat"));
  await chatDb.collection("conversations").createIndexes([
    { key: { participants: 1, lastMessageTime: -1 }, name: "conversations_participants_last" },
    { key: { type: 1, participants: 1 }, name: "conversations_type_participants" },
  ]);
  await chatDb.collection("messages").createIndexes([
    { key: { conversationId: 1, createdAt: -1 }, name: "messages_conversation_created" },
    { key: { senderId: 1, createdAt: -1 }, name: "messages_sender_created" },
  ]);

  const moderationDb = client.db(dbName("moderation"));
  await moderationDb.collection("reports").createIndexes([
    { key: { status: 1, createdAt: -1 }, name: "reports_status_created" },
    { key: { contentType: 1, contentId: 1 }, name: "reports_content" },
    { key: { reporterId: 1, createdAt: -1 }, name: "reports_reporter_created" },
  ]);
  await moderationDb.collection("audit_logs").createIndexes([
    { key: { createdAt: -1 }, name: "audit_created" },
    { key: { actorId: 1, createdAt: -1 }, name: "audit_actor_created" },
    { key: { action: 1, createdAt: -1 }, name: "audit_action_created" },
  ]);
  await moderationDb.collection("platform_settings").createIndexes([
    { key: { updatedAt: -1 }, name: "platform_settings_updated" },
  ]);

  console.log("MongoDB indexes created");
} finally {
  await client.close();
}
