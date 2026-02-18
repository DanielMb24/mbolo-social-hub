import { Heart, MessageCircle, Share2, MoreHorizontal, Image } from "lucide-react";
import { useState } from "react";

const MOCK_POSTS = [
  {
    id: "1",
    author: "Aimée Nzang",
    avatar: "AN",
    time: "Il y a 2h",
    content: "Libreville est magnifique ce soir ! 🌅 #Gabon #MBolo",
    likes: 42,
    comments: 8,
    liked: false,
  },
  {
    id: "2",
    author: "Patrick Obame",
    avatar: "PO",
    time: "Il y a 5h",
    content: "Qui est prêt pour le match ce weekend ? ⚽ Allez les Panthères !",
    likes: 128,
    comments: 34,
    liked: true,
  },
  {
    id: "3",
    author: "Sophie Mba",
    avatar: "SM",
    time: "Il y a 1j",
    content: "Mon nouveau projet artistique prend forme. L'art gabonais a tellement à offrir au monde 🎨",
    likes: 67,
    comments: 12,
    liked: false,
  },
];

const FeedPage = () => {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");

  const toggleLike = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* New post */}
      <div className="p-4 border-b">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            U
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Quoi de neuf ?"
              rows={2}
              className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <button className="text-secondary hover:opacity-80 transition-opacity">
                <Image className="w-5 h-5" />
              </button>
              <button className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Publier
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <article key={post.id} className="p-4 border-b animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shrink-0">
              {post.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-foreground">{post.author}</span>
                  <span className="text-xs text-muted-foreground ml-2">{post.time}</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-foreground mt-1 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-6 mt-3">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    post.liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};

export default FeedPage;
