'use client';

import React, { useEffect, useState } from 'react';

// 🔑 管理者用のパスワード設定
const ADMIN_PASSWORD = 'eefw4725ear7k53t';

// プレビュー環境用・Supabase クライアントの安全な取得
const getSupabaseClient = () => {
  try {
    const { createClient } = require('@/utils/supabase/client');
    return createClient();
  } catch (e) {
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ error: null }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      })
    };
  }
};

export default function AdminPage() {
  const supabase = getSupabaseClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [asciiArts, setAsciiArts] = useState<any[]>([]);
  const [emojis, setEmojis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // パスワード認証ステート
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passError, setPassError] = useState(false);

  // モード切替ステート ('live' または 'mock')
  const [appMode, setAppMode] = useState<'live' | 'mock'>('live');

  // 新規追加用ステート
  const [newCatName, setNewCatName] = useState('');
  const [newAAContent, setNewAAContent] = useState('');
  const [newEmojiContent, setNewEmojiContent] = useState('');

  // パスワード照合処理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassError(false);
      fetchAllData();
    } else {
      setPassError(true);
    }
  };

  // 初期化・データ一括取得（Supabase ＆ LocalStorage同期）
  const fetchAllData = async () => {
    setLoading(true);
    
    const savedMode = localStorage.getItem('app_mode') || 'live';
    setAppMode(savedMode === 'live' ? 'live' : 'mock');

    // 1. 投稿データ
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false });

    if (!postsError) {
      setPosts(postsData || []);
    }

    // 2. カテゴリー一覧
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (!catError && catData && catData.length > 0) {
      setCategories(catData);
      localStorage.setItem('kotodama_admin_categories', JSON.stringify(catData));
    } else {
      const localCats = localStorage.getItem('kotodama_admin_categories');
      if (localCats) {
        setCategories(JSON.parse(localCats));
      } else {
        const defaultCats = [
          { id: 1, name: '雑談' },
          { id: 2, name: 'HOT!テーマトーク' },
          { id: 3, name: '旅行・観光・風景' },
          { id: 4, name: '歌手・ミュージシャン' }
        ];
        setCategories(defaultCats);
        localStorage.setItem('kotodama_admin_categories', JSON.stringify(defaultCats));
      }
    }

    // 3. アスキーアート一覧
    const { data: aaData, error: aaError } = await supabase
      .from('ascii_art')
      .select('*')
      .order('id', { ascending: true });

    if (!aaError && aaData && aaData.length > 0) {
      setAsciiArts(aaData);
      localStorage.setItem('kotodama_admin_aa', JSON.stringify(aaData));
    } else {
      const localAA = localStorage.getItem('kotodama_admin_aa');
      if (localAA) {
        setAsciiArts(JSON.parse(localAA));
      } else {
        const defaultAA = [
          { id: 1, content: "( ´∀｀)" },
          { id: 2, content: "\\(^o^)/" },
          { id: 3, content: "(つд⊂)ｴｰﾝ" },
          { id: 4, content: "(・∀・)" }
        ];
        setAsciiArts(defaultAA);
        localStorage.setItem('kotodama_admin_aa', JSON.stringify(defaultAA));
      }
    }

    // 4. 絵文字一覧
    const { data: emojiData, error: emojiError } = await supabase
      .from('emojis')
      .select('*')
      .order('id', { ascending: true });

    if (!emojiError && emojiData && emojiData.length > 0) {
      setEmojis(emojiData);
      localStorage.setItem('kotodama_admin_emojis', JSON.stringify(emojiData));
    } else {
      const localEmojis = localStorage.getItem('kotodama_admin_emojis');
      if (localEmojis) {
        setEmojis(JSON.parse(localEmojis));
      } else {
        const defaultEmojis = [
          { id: 1, content: "👍" },
          { id: 2, content: "❤️" },
          { id: 3, content: "✨" },
          { id: 4, content: "🔥" }
        ];
        setEmojis(defaultEmojis);
        localStorage.setItem('kotodama_admin_emojis', JSON.stringify(defaultEmojis));
      }
    }

    setLoading(false);
  };

  // 🔄 モード切替
  const handleToggleMode = (mode: 'live' | 'mock') => {
    setAppMode(mode);
    localStorage.setItem('app_mode', mode);
    window.dispatchEvent(new Event('storage'));
    alert(`動作モードを【 ${mode === 'live' ? '本番 (live)' : 'モック (mock)'} 】に切り替えました！`);
  };

  // ➕ カテゴリー追加
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await supabase.from('categories').insert([{ name: newCatName.trim() }]);
    const updated = [...categories, { id: Date.now(), name: newCatName.trim() }];
    setCategories(updated);
    localStorage.setItem('kotodama_admin_categories', JSON.stringify(updated));
    setNewCatName('');
    fetchAllData();
    window.dispatchEvent(new Event('storage'));
    alert(`カテゴリー「${newCatName}」を追加しました！`);
  };

  // 🗑️ カテゴリー削除
  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!confirm(`カテゴリー「${catName}」を削除しますか？`)) return;

    await supabase.from('categories').delete().eq('id', catId);
    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    localStorage.setItem('kotodama_admin_categories', JSON.stringify(updated));
    fetchAllData();
    window.dispatchEvent(new Event('storage'));
  };

  // ➕ アスキーアート追加 (PostForm連携用LocalStorage保存も同時実行)
  const handleAddAA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAAContent.trim()) return;

    await supabase.from('ascii_art').insert([{ content: newAAContent.trim() }]);
    const updated = [...asciiArts, { id: Date.now(), content: newAAContent.trim() }];
    setAsciiArts(updated);
    localStorage.setItem('kotodama_admin_aa', JSON.stringify(updated));
    setNewAAContent('');
    fetchAllData();
    window.dispatchEvent(new Event('storage'));
    alert(`アスキーアート 「${newAAContent}」 を追加しました！`);
  };

  // 🗑️ アスキーアート削除
  const handleDeleteAA = async (aaId: number, content: string) => {
    if (!confirm(`アスキーアート「${content}」を削除しますか？`)) return;

    await supabase.from('ascii_art').delete().eq('id', aaId);
    const updated = asciiArts.filter(a => a.id !== aaId);
    setAsciiArts(updated);
    localStorage.setItem('kotodama_admin_aa', JSON.stringify(updated));
    fetchAllData();
    window.dispatchEvent(new Event('storage'));
  };

  // ➕ 絵文字追加 (PostForm連携用LocalStorage保存も同時実行)
  const handleAddEmoji = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmojiContent.trim()) return;

    await supabase.from('emojis').insert([{ content: newEmojiContent.trim() }]);
    const updated = [...emojis, { id: Date.now(), content: newEmojiContent.trim() }];
    setEmojis(updated);
    localStorage.setItem('kotodama_admin_emojis', JSON.stringify(updated));
    setNewEmojiContent('');
    fetchAllData();
    window.dispatchEvent(new Event('storage'));
    alert(`絵文字 「${newEmojiContent}」 を追加しました！`);
  };

  // 🗑️ 絵文字削除
  const handleDeleteEmoji = async (emojiId: number, content: string) => {
    if (!confirm(`絵文字「${content}」を削除しますか？`)) return;

    await supabase.from('emojis').delete().eq('id', emojiId);
    const updated = emojis.filter(e => e.id !== emojiId);
    setEmojis(updated);
    localStorage.setItem('kotodama_admin_emojis', JSON.stringify(updated));
    fetchAllData();
    window.dispatchEvent(new Event('storage'));
  };

  // 🗑️ 投稿の強制削除
  const handleForceDelete = async (id: number, titleOrContent: string) => {
    if (!confirm(`【管理者権限】\nID: ${id} の投稿を強制削除しますか？\n\n内容: "${titleOrContent.slice(0, 30)}..."`)) {
      return;
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      alert('管理者権限で削除しました。');
      fetchAllData();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
          <div className="text-center space-y-1">
            <div className="text-3xl">🔒</div>
            <h1 className="text-lg font-bold text-red-500">管理者認証</h1>
            <p className="text-xs text-gray-400">管理パネルに入るにはパスワードが必要です</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="password"
                placeholder="管理者パスワードを入力"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-xl text-xs text-white outline-none focus:border-red-500"
                autoFocus
              />
              {passError && (
                <p className="text-[11px] text-red-400 mt-1 font-bold">⚠️ パスワードが違います</p>
              )}
            </div>
            
            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              ログインして解除
            </button>
          </form>

          <div className="text-center border-t border-gray-800 pt-3">
            <a href="/" className="text-xs text-gray-500 hover:text-gray-300 underline">
              ← 掲示板トップに戻る
            </a>
          </div>
        </div>
      </div>
    );
  }

  const userStats = posts.reduce((acc: any, post) => {
    const handle = post.handle || '@guest';
    if (!acc[handle]) {
      acc[handle] = { name: post.author || 'ゲスト', count: 0 };
    }
    acc[handle].count += 1;
    return acc;
  }, {});

  const filteredPosts = posts.filter(
    (p) =>
      p.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2">
              🛡️ 言霊 管理者コントロールパネル
            </h1>
            <p className="text-xs text-gray-400 mt-1">PostForm連携対応：カテゴリー・アスキーアート・絵文字の動的管理</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-xl text-xs font-bold transition border border-gray-700 cursor-pointer"
            >
              🔒 ロックする
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition border border-gray-700 inline-block"
            >
              ← 掲示板トップに戻る
            </a>
          </div>
        </div>

        {/* ⚙️ 動作モード切替 */}
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-bold text-sm text-gray-200">⚙️ アプリ動作モード設定</h2>
            <p className="text-[11px] text-gray-400">本番モード（Supabase連携）とモックモードの切替</p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-gray-700">
            <button
              onClick={() => handleToggleMode('live')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                appMode === 'live' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              🟢 本番モード (live)
            </button>
            <button
              onClick={() => handleToggleMode('mock')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                appMode === 'mock' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              🟡 モックモード (mock)
            </button>
          </div>
        </div>

        {/* 📁 カテゴリー管理 */}
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl space-y-4">
          <h2 className="font-bold text-sm text-gray-200">📁 カテゴリー動的追加・管理</h2>
          
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="新しいカテゴリー名を入力..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 bg-black border border-gray-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
            >
              ＋ カテゴリーを追加
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-black/50 border border-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <span className="text-gray-200 font-bold"># {cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-gray-500 hover:text-red-400 font-bold cursor-pointer ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 🎨 アスキーアート ＆ 絵文字追加・管理 (PostForm連携) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* (・∀・) アスキーアート管理 */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl space-y-4">
            <h2 className="font-bold text-sm text-gray-200 flex items-center gap-2">
              <span>(・∀・)</span>
              <span>アスキーアート追加・管理 ({asciiArts.length})</span>
            </h2>
            
            <form onSubmit={handleAddAA} className="flex gap-2">
              <input
                type="text"
                placeholder="例: (´・ω・`)"
                value={newAAContent}
                onChange={(e) => setNewAAContent(e.target.value)}
                className="flex-1 bg-black border border-gray-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
              >
                ＋ AA追加
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
              {asciiArts.map((aa) => (
                <div key={aa.id} className="bg-black/50 border border-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-emerald-300">{aa.content}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAA(aa.id, aa.content)}
                    className="text-gray-500 hover:text-red-400 font-bold cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 😊 絵文字管理 */}
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl space-y-4">
            <h2 className="font-bold text-sm text-gray-200 flex items-center gap-2">
              <span>😊</span>
              <span>絵文字追加・管理 ({emojis.length})</span>
            </h2>
            
            <form onSubmit={handleAddEmoji} className="flex gap-2">
              <input
                type="text"
                placeholder="例: 🔥"
                value={newEmojiContent}
                onChange={(e) => setNewEmojiContent(e.target.value)}
                className="flex-1 bg-black border border-gray-700 px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow"
              >
                ＋ 絵文字追加
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto">
              {emojis.map((em) => (
                <div key={em.id} className="bg-black/50 border border-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-sm">
                  <span>{em.content}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteEmoji(em.id, em.content)}
                    className="text-gray-500 hover:text-red-400 font-bold cursor-pointer ml-1 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 📊 投稿データ監視テーブル */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700 pb-3">
            <h2 className="font-bold text-sm text-gray-200">全投稿一覧（強制削除機能付き）</h2>
            <input
              type="text"
              placeholder="投稿検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black border border-gray-700 px-3 py-1.5 rounded-xl text-xs outline-none w-48 text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 bg-gray-900/50">
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">投稿者</th>
                  <th className="p-2.5">カテゴリ</th>
                  <th className="p-2.5">内容</th>
                  <th className="p-2.5 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-750">
                    <td className="p-2.5 font-mono text-gray-500">{post.id}</td>
                    <td className="p-2.5 font-bold">{post.author}</td>
                    <td className="p-2.5">#{post.category || '雑談'}</td>
                    <td className="p-2.5 max-w-xs truncate">{post.content}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleForceDelete(post.id, post.content)}
                        className="px-3 py-1 bg-red-600/20 border border-red-500 text-red-400 rounded-lg text-[11px] font-bold hover:bg-red-600 hover:text-white cursor-pointer"
                      >
                        強制削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}