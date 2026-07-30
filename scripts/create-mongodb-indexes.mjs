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
    { key: { jti: 1 }, unique: true, name: "refresh_jti_unique" },
    { key: { userId: 1, revokedAt: 1 }, name: "refresh_user_revoked" },
    { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: "refresh_expiry_ttl" },
  ]);

  const userDb = client.db(dbName("user"));
  await userDb.collection("user_profiles").createIndexes([
    { key: { username: 1 }, unique: true, name: "profile_username_unique" },
    { key: { username: "text", fullname: "text", bio: "text" }, name: "profile_text_search" },
  ]);
  await userDb.collection("user_follows").createIndexes([
    { key: { followerId: 1, followingId: 1 }, unique: true, name: "follow_pair_unique" },
    { key: { followingId: 1 }, name: "follow_following" },
  ]);

  const postDb = client.db(dbName("post"));
  await postDb.collection("posts").createIndexes([
    { key: { createdAt: -1 }, name: "posts_created_desc" },
    { key: { authorId: 1, createdAt: -1 }, name: "posts_author_created" },
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

  console.log("MongoDB indexes created");
} finally {
  await client.close();
}
