'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

// 🔑 管理者用のパスワード設定
const ADMIN_PASSWORD = 'eefw4725ear7k53t';

export default function AdminPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // パスワード認証ステート
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [passError, setPassError] = useState(false);

  // モード切替ステート ('live' または 'mock')
  const [appMode, setAppMode] = useState<'live' | 'mock'>('live');

  // 新規カテゴリー追加用ステート
  const [newCatName, setNewCatName] = useState('');

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

  // 初期化・データ一括取得
  const fetchAllData = async () => {
    setLoading(true);
    
    // 現在のモードを localStorage から読み込む
    const savedMode = localStorage.getItem('app_mode') || 'live';
    setAppMode(savedMode === 'live' ? 'live' : 'mock');

    // 1. 投稿データの取得
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: false });

    if (postsError) {
      console.error('管理者データ取得エラー:', postsError);
    } else {
      setPosts(postsData || []);
    }

    // 2. カテゴリー一覧の取得
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (!catError) {
      setCategories(catData || []);
    }

    setLoading(false);
  };

  // 🔄 モード切替ハンドラー
  const handleToggleMode = (mode: 'live' | 'mock') => {
    setAppMode(mode);
    localStorage.setItem('app_mode', mode);
    // storage イベントを発火させて、開いているアプリタブにリアルタイム通知する
    window.dispatchEvent(new Event('storage'));
    alert(`動作モードを【 ${mode === 'live' ? '本番 (live)' : 'モック (mock)'} 】に切り替えました！`);
  };

  // ➕ カテゴリー追加ハンドラー
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const { error } = await supabase
      .from('categories')
      .insert([{ name: newCatName.trim() }]);

    if (error) {
      alert('カテゴリーの追加に失敗しました: ' + error.message);
    } else {
      alert(`カテゴリー「${newCatName}」を追加しました！`);
      setNewCatName('');
      // リロードせずに再取得 ＆ ストレージイベント通知
      fetchAllData();
      window.dispatchEvent(new Event('storage'));
    }
  };

  // 🗑️ カテゴリー削除ハンドラー
  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!confirm(`カテゴリー「${catName}」を削除しますか？`)) return;

    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      alert('カテゴリーを削除しました。');
      fetchAllData();
      window.dispatchEvent(new Event('storage'));
    }
  };

  // 🗑️ 投稿の強制削除処理
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

  // 未ログイン（ロック状態）の画面表示
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
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 underline">
              ← 掲示板トップに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ユーザー統計
  const userStats = posts.reduce((acc: any, post) => {
    const handle = post.handle || '@guest';
    if (!acc[handle]) {
      acc[handle] = { name: post.author || 'ゲスト', count: 0 };
    }
    acc[handle].count += 1;
    return acc;
  }, {});

  // 検索フィルター
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
            <p className="text-xs text-gray-400 mt-1">全データの監視・強制削除・モード切替・カテゴリー管理</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-red-400 rounded-xl text-xs font-bold transition border border-gray-700 cursor-pointer"
            >
              🔒 ロックする
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition border border-gray-700"
            >
              ← 掲示板トップに戻る
            </Link>
          </div>
        </div>

        {/* ⚙️ 新機能①：動作モード切替パネル */}
        <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-bold text-sm text-gray-200">⚙️ アプリ動作モード設定</h2>
            <p className="text-[11px] text-gray-400">本番モード（Supabase連携・AI有効）とモックモードを切り替えます</p>
          </div>
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-gray-700">
            <button
              onClick={() => handleToggleMode('live')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                appMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🟢 本番モード (live)
            </button>
            <button
              onClick={() => handleToggleMode('mock')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                appMode === 'mock'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🟡 モックモード (mock)
            </button>
          </div>
        </div>

        {/* 📁 新機能②：カテゴリー追加＆管理パネル */}
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

          {/* 登録済みカテゴリー一覧バッジ */}
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-black/50 border border-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <span className="text-gray-200 font-bold"># {cat.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-gray-500 hover:text-red-400 font-bold cursor-pointer ml-1"
                  title="削除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 📊 3. 統計ダッシュボード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
            <div className="text-xs text-gray-400 font-bold">総投稿・返信数</div>
            <div className="text-3xl font-black text-sky-400 mt-1">{posts.length} <span className="text-sm font-normal text-gray-400">件</span></div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
            <div className="text-xs text-gray-400 font-bold">アクティブユーザー数</div>
            <div className="text-3xl font-black text-emerald-400 mt-1">{Object.keys(userStats).length} <span className="text-sm font-normal text-gray-400">名</span></div>
          </div>
          <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl">
            <div className="text-xs text-gray-400 font-bold">総いいね数</div>
            <div className="text-3xl font-black text-pink-400 mt-1">
              {posts.reduce((sum, p) => sum + (p.likes || 0), 0)} <span className="text-sm font-normal text-gray-400">回</span>
            </div>
          </div>
        </div>

        {/* 👥 2. ユーザー一覧アコーディオン */}
        <details className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <summary className="p-4 font-bold text-sm cursor-pointer hover:bg-gray-750 flex justify-between items-center">
            <span>👥 投稿ユーザー一覧（{Object.keys(userStats).length}名）</span>
            <span className="text-xs text-gray-400">クリックで開閉</span>
          </summary>
          <div className="p-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {Object.entries(userStats).map(([handle, info]: [string, any]) => (
              <div key={handle} className="bg-gray-900 p-2.5 rounded-xl border border-gray-750 flex justify-between items-center">
                <div className="truncate">
                  <div className="font-bold text-gray-200 truncate">{info.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{handle}</div>
                </div>
                <span className="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                  {info.count}件
                </span>
              </div>
            ))}
          </div>
        </details>

        {/* 🗑️ 1. 全投稿一覧 ＆ 強制削除テーブル */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-700 pb-3">
            <h2 className="font-bold text-sm text-gray-200">全投稿一覧（強制削除機能付き）</h2>
            
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-xl w-full sm:w-64">
              <span className="text-xs text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="投稿内容・ユーザーを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 text-xs animate-pulse">データを読み込み中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400 bg-gray-900/50">
                    <th className="p-2.5">ID</th>
                    <th className="p-2.5">投稿者</th>
                    <th className="p-2.5">カテゴリ</th>
                    <th className="p-2.5">投稿内容</th>
                    <th className="p-2.5">日時</th>
                    <th className="p-2.5 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-750 transition">
                      <td className="p-2.5 font-mono text-gray-500">{post.id}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-gray-200">{post.author}</div>
                        <div className="text-[10px] text-gray-500">{post.handle}</div>
                      </td>
                      <td className="p-2.5">
                        <span className="bg-gray-700 px-2 py-0.5 rounded text-[10px] text-gray-300">
                          {post.category || '雑談'}
                        </span>
                      </td>
                      <td className="p-2.5 max-w-xs truncate text-gray-300">
                        {post.content}
                      </td>
                      <td className="p-2.5 text-gray-500 text-[10px]">{post.date}</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleForceDelete(post.id, post.content)}
                          className="px-3 py-1 bg-red-600/20 border border-red-500/50 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          強制削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}