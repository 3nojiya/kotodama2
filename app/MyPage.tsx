'use client';

import React, { useState } from 'react';

interface MyPageProps {
  account: any;
  setAccount: (account: any) => void;
  replies: any[];
  handleDelete: (id: number, postHandle: string | undefined, e: React.MouseEvent) => void;
  renderMedia: (url: string, type: 'image' | 'video', isEnlarged?: boolean) => React.ReactNode;
  setIsMyPageOpen?: (open: boolean) => void;
}

export default function MyPage({
  account,
  setAccount,
  replies,
  handleDelete,
  renderMedia,
  setIsMyPageOpen,
}: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'myActivity' | 'ranking'>('myActivity');
  const [rankingType, setRankingType] = useState<'likes' | 'replies'>('likes');

  // 自分の投稿一覧
  const myPosts = replies.filter(r => r.handle === account.handle);

  // 全親投稿を取得してランキング集計
  const mainPosts = replies.filter(r => !r.parentId);
  const rankingPosts = mainPosts.map(post => {
    const childCount = replies.filter(r => r.parentId === post.id).length;
    return {
      ...post,
      replyCount: childCount,
      likesCount: post.likes || 0,
    };
  });

  if (rankingType === 'likes') {
    rankingPosts.sort((a, b) => b.likesCount - a.likesCount);
  } else {
    rankingPosts.sort((a, b) => b.replyCount - a.replyCount);
  }

  const top10Ranking = rankingPosts.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 bg-white min-h-[80vh] font-sans text-xs text-black">
      {/* ユーザープロフィールヘッダー ＋ 閉じるボタン */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex justify-between items-center">
        <div>
          <h1 className="text-base font-bold text-emerald-900">👤 マイページ</h1>
          <p className="text-gray-600 mt-0.5">ハンドルネーム: <b className="text-black">{account.handle || '名無し'}</b></p>
        </div>
        {setIsMyPageOpen && (
          <button
            onClick={() => setIsMyPageOpen(false)}
            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold transition cursor-pointer shadow-xs"
          >
            ✕ 閉じる
          </button>
        )}
      </div>

      {/* メインタブ切り替え */}
      <div className="flex border-b border-gray-300">
        <button
          onClick={() => setActiveTab('myActivity')}
          className={`px-5 py-2 font-bold cursor-pointer transition ${
            activeTab === 'myActivity'
              ? 'border-b-2 border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          📝 自分のアクティビティ
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`px-5 py-2 font-bold cursor-pointer transition ${
            activeTab === 'ranking'
              ? 'border-b-2 border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          🏆 全モード共通ランキング
        </button>
      </div>

      {/* タブ 1: 自分のアクティビティ */}
      {activeTab === 'myActivity' && (
        <div className="space-y-4">
          <h2 className="font-bold text-sm text-gray-800">■ 自分の投稿履歴 ({myPosts.length}件)</h2>
          {myPosts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 border border-dashed rounded">
              まだ投稿がありません。
            </div>
          ) : (
            <div className="space-y-3">
              {myPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 p-3 rounded bg-gray-50/50 space-y-2">
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>モード: <b className="uppercase text-emerald-800">{post.targetMode || 'ALL'}</b> | 日時: {post.date}</span>
                    <button
                      onClick={(e) => handleDelete(post.id, post.handle, e)}
                      className="text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      [削除]
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-black text-xs font-mono">{post.content}</p>
                  {post.mediaUrl && renderMedia(post.mediaUrl, post.mediaType || 'image')}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* タブ 2: 全モード共通ランキング */}
      {activeTab === 'ranking' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-100 p-2.5 rounded border border-gray-200">
            <span className="font-bold text-gray-800">■ 全モード総合ランキング (TOP10)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setRankingType('likes')}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                  rankingType === 'likes'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-50'
                }`}
              >
                👍 高評価順
              </button>
              <button
                onClick={() => setRankingType('replies')}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                  rankingType === 'replies'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border text-gray-700 hover:bg-gray-50'
                }`}
              >
                💬 返信・レス数順
              </button>
            </div>
          </div>

          {top10Ranking.length === 0 ? (
            <div className="p-8 text-center text-gray-400 border border-dashed rounded">
              ランキング対象の投稿がありません。
            </div>
          ) : (
            <div className="space-y-2.5">
              {top10Ranking.map((post, idx) => {
                const titleText = post.content.startsWith('【') && post.content.includes('】\n')
                  ? post.content.split('】\n')[0].replace('【', '')
                  : post.content.split('\n')[0];

                return (
                  <div
                    key={post.id}
                    className="border border-gray-200 p-3 rounded-lg bg-white shadow-xs flex justify-between items-center gap-4"
                  >
                    <div className="flex items-center gap-3 truncate flex-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                        idx === 0 ? 'bg-amber-400 text-white' :
                        idx === 1 ? 'bg-slate-300 text-gray-800' :
                        idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="truncate flex-1">
                        <div className="font-bold text-blue-900 truncate">{titleText}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                          <span>投稿者: {post.author}</span>
                          <span>•</span>
                          <span className="uppercase text-emerald-800 font-bold">[{post.targetMode || 'all'}モード]</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-bold text-xs">
                      {rankingType === 'likes' ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          👍 {post.likesCount} 獲得
                        </span>
                      ) : (
                        <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          💬 {post.replyCount} レス
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}