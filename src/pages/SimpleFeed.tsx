import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { postApi } from "@/lib/api";

const SimpleFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem('userId') || '';
  const username = userId.substring(0, 8);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await postApi.getFeed();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      await postApi.createPost({ content: newPost });
      setNewPost("");
      loadPosts(); // Recharger les posts
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Erreur lors de la publication');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">MBolo Feed</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">@{username}</span>
          <button onClick={handleLogout} className="p-2 hover:bg-muted rounded">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Composer */}
        <div className="bg-card border rounded-lg p-4 mb-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full p-2 border rounded resize-none"
            rows={3}
          />
          <button
            onClick={handlePost}
            disabled={!newPost.trim()}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
          >
            Publier
          </button>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun post. Soyez le premier à publier !
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {(post.userId || post.authorId || '').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold">@{(post.userId || post.authorId || '').substring(0, 8)}</span>
                </div>
                <p className="text-foreground">{post.content}</p>
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
                  <span>{new Date(post.createdAt).toLocaleString()}</span>
                  <span>❤️ {post.likes || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SimpleFeed;
