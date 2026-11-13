// app/components/modals/MyPageModal.tsx
'use client';

import React from 'react';
import { ENJOY_CATEGORIES } from '../../categories';

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
  myPageTab: 'activity' | 'ranking' | 'settings';
  setMyPageTab: (tab: 'activity' | 'ranking' | 'settings') => void;
  rankingType: 'likes' | 'replies';
  setRankingType: (type: 'likes' | 'replies') => void;
  myPosts: any[];
  top10Ranking: any[];
  userApiKeyInput: string;
  setUserApiKeyInput: (val: string) => void;
  showApiKey: boolean;
  setShowApiKey: (val: boolean) => void;
  handleSaveApiKey: (e: React.FormEvent) => void;
  handleDelete: (id: number, handle: string | undefined, e: React.MouseEvent) => void;
  renderMedia: (url: string) => React.ReactNode;
  renderContentWithEmbed: (content: string) => React.ReactNode;
  isFullPage?: boolean;
}

export default function MyPageModal(props: MyPageModalProps) {
  const {
    isOpen,
    onClose,
    account,
    myPageTab,
    setMyPageTab,
    rankingType,
    setRankingType,
    myPosts,
    top10Ranking,
    userApiKeyInput,
    setUserApiKeyInput,
    showApiKey,
    setShowApiKey,
    handleSaveApiKey,
    handleDelete,
    renderMedia,
    renderContentWithEmbed,
    isFullPage,
  } = props;

  if (!isOpen) return null;

  // ★ isFullPage が true のときはモーダル枠を外して、フルページ用のコンテナで描画する
  const contentBody = (
    <div className={`bg-white text-gray-800 ${isFullPage ? 'w-full shadow-none border-0' : 'rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 max-h-[85vh]'} overflow-hidden flex flex-col`}>
      
      {/* ヘッダー（通常モーダル用：フルページのときは page.tsx 側でヘッダーを用意するため非表示も可） */}
      {!isFullPage && (
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              <span>👤</span> マイページ
            </h3>
            <p className="text-gray-600 text-[11px] mt-0.5">
              ハンドルネーム: <b className="text-black">{account.handle || '@guest'}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            ✕ 閉じる
          </button>
        </div>
      )}

      {/* タブ切り替え */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 text-xs font-bold">
        <button
          onClick={() => setMyPageTab('activity')}
          className={`flex-1 py-2.5 transition cursor-pointer text-center ${
            myPageTab === 'activity' ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white' : 'text-gray-500 hover:text-black'
          }`}
        >
          📝 自分のアクティビティ ({myPosts.length}件)
        </button>
        <button
          onClick={() => setMyPageTab('ranking')}
          className={`flex-1 py-2.5 transition cursor-pointer text-center ${
            myPageTab === 'ranking' ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white' : 'text-gray-500 hover:text-black'
          }`}
        >
          🏆 総合ランキング
        </button>
        <button
          onClick={() => setMyPageTab('settings')}
          className={`flex-1 py-2.5 transition cursor-pointer text-center ${
            myPageTab === 'settings' ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white' : 'text-gray-500 hover:text-black'
          }`}
        >
          🔑 API設定
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
        {/* タブ1: 自分のアクティビティ */}
        {myPageTab === 'activity' && (
          <div className="space-y-3">
            {myPosts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl">
                まだ投稿履歴がありません。
              </div>
            ) : (
              myPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 p-3 rounded-xl bg-gray-50 space-y-2">
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>カテゴリー: <b>{post.category || ENJOY_CATEGORIES[1]}</b> | 日時: {post.date}</span>
                    <button
                      onClick={(e) => handleDelete(post.id, post.handle, e)}
                      className="text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      [削除]
                    </button>
                  </div>
                  <div className="text-black text-xs">
                    {renderContentWithEmbed(post.content)}
                  </div>
                  {post.mediaUrl && renderMedia(post.mediaUrl)}
                </div>
              ))
            )}
          </div>
        )}

        {/* タブ2: 総合ランキング */}
        {myPageTab === 'ranking' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg border border-gray-200">
              <span className="font-bold text-gray-700">TOP10ランキング</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setRankingType('likes')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    rankingType === 'likes' ? 'bg-emerald-700 text-white' : 'bg-white border text-gray-700'
                  }`}
                >
                  👍 高評価順
                </button>
                <button
                  onClick={() => setRankingType('replies')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    rankingType === 'replies' ? 'bg-emerald-700 text-white' : 'bg-white border text-gray-700'
                  }`}
                >
                  💬 レス数順
                </button>
              </div>
            </div>

            {top10Ranking.length === 0 ? (
              <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl">
                ランキング対象の投稿がありません。
              </div>
            ) : (
              <div className="space-y-2">
                {top10Ranking.map((post, idx) => {
                  const titleText = post.content.startsWith('【') && post.content.includes('】\n')
                    ? post.content.split('】\n')[0].replace('【', '')
                    : post.content.split('\n')[0];

                  return (
                    <div
                      key={post.id}
                      className="border border-gray-200 p-2.5 rounded-xl bg-white flex justify-between items-center gap-3"
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px] ${
                          idx === 0 ? 'bg-amber-400 text-white' :
                          idx === 1 ? 'bg-slate-300 text-gray-800' :
                          idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="truncate flex-1">
                          <div className="font-bold text-blue-900 truncate">{titleText}</div>
                          <div className="text-[10px] text-gray-500">
                            投稿者: {post.author} ({post.category || ENJOY_CATEGORIES[1]})
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 font-bold text-[11px]">
                        {rankingType === 'likes' ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            👍 {post.likesCount}
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            💬 {post.replyCount}
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

        {/* タブ3: API設定 */}
        {myPageTab === 'settings' && (
          <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-bold text-gray-700">Gemini API キー設定</label>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer bg-transparent border-none"
                >
                  {showApiKey ? '🙈 隠す' : '👁️ 表示'}
                </button>
              </div>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={userApiKeyInput}
                onChange={(e) => setUserApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 font-mono text-xs text-black"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                キーを保存
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // 通常時はモーダル用背景（黒半透明）で包み、isFullPage のときはそのまま全画面で返す
  if (isFullPage) {
    return contentBody;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      {contentBody}
    </div>
  );
}