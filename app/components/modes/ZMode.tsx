// app/components/modes/ZMode.tsx
'use client';

import React, { useState, useRef } from 'react';
import ThreadChatSection from '../shared/ThreadChatSection';

interface ZModeProps {
  mainReplies?: any[];
  replies?: any[];
  followingList?: string[];
  categories?: any[];
  currentCategory?: string;
  isBookmarkView?: boolean;
  zTab?: string;
  selectedUserForTimeline?: string | null;
  activeDmUser?: string | null;
  directMessages?: any[];
  dmText?: string;
  newComment?: string;
  setNewComment?: React.Dispatch<React.SetStateAction<string>>;
  newThreadTitle?: string;
  setNewThreadTitle?: React.Dispatch<React.SetStateAction<string>>;
  isTargetAll?: boolean;
  setIsTargetAll?: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting?: boolean;
  account?: { isLoggedIn: boolean; handle: string; name: string; avatarUrl?: string };
  userReposts?: Record<string, boolean>;
  userVotes?: Record<string, string>;
  editingReplyKey?: string | null;
  replyInputs?: Record<string, string>;
  editContent?: string;
  editMediaUrl?: string;
  top10Ranking?: any[];
  activePostId?: string | number | null;

  setCurrentCategory?: (cat: string) => void;
  setActivePostId?: (id: any) => void;
  setIsBookmarkView?: (isB: boolean) => void;
  setZTab?: (tab: any) => void;
  setSelectedUserForTimeline?: (user: string | null) => void;
  setActiveDmUser?: (user: string | null) => void;
  setDmText?: (text: string) => void;
  setEditingReplyKey?: (key: any) => void;
  setEditContent?: (content: string) => void;
  setEditMediaUrl?: (url: string) => void;
  setReplyInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setIsAuthModalOpen?: (isOpen: boolean) => void;
  handlePost?: (e: React.FormEvent) => void;
  handleSendDm?: (e: React.FormEvent) => void;
  handleDelete?: (id: any, handle: string | undefined, e: React.MouseEvent) => void;
  handleToggleFollow?: (handle: string, ...args: any[]) => void;
  handleSaveEdit?: (id: any, ...args: any[]) => void;
  handleOpenTranslateModal?: (content: string, e: React.MouseEvent) => void;
  handleRepost?: (reply: any, e: React.MouseEvent) => void;
  handleZVote?: (id: any, type: any, ...args: any[]) => void;
  handleShare?: (id: any, ...args: any[]) => void;
  handleReplySubmit?: (parentId: any) => void;
  renderBookmarkStampButton?: (id: any) => React.ReactNode;
  renderMedia?: (url: string) => React.ReactNode;
  renderContentWithEmbed?: (content: string, theme?: string) => React.ReactNode;
  [key: string]: any;
  blockedUsers?: string[];
  reportedPosts?: number[];
  banVotes?: Record<string, { count: number; voters: string[] }>;
  handleToggleBlock?: (handle: string) => void;
  handleReportPost?: (postId: number) => void;
  handleVoteBan?: (targetHandle: string) => void;
}

export function ZMode(props: ZModeProps) {
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const {
    mainReplies = [],
    replies = [],
    followingList = [],
    categories = ['すべて', '雑談', 'HOT!テーマトーク', '旅行・観光・風景', '歌手・ミュージシャン'],
    currentCategory = 'すべて',
    isBookmarkView = false,
    zTab = 'timeline',
    selectedUserForTimeline = null,
    activeDmUser = null,
    directMessages = [],
    dmText = '',
    newComment = '',
    setNewComment = () => {},
    newThreadTitle = '',
    setNewThreadTitle = () => {},
    isTargetAll = true,
    setIsTargetAll = () => {},
    isSubmitting = false,
    account = { isLoggedIn: false, handle: '@guest', name: 'ゲスト' },
    userReposts = {},
    userVotes = {},
    editingReplyKey = null,
    replyInputs = {},
    editContent = '',
    editMediaUrl = '',
    top10Ranking = [],
    activePostId = null,

    setCurrentCategory = () => {},
    setActivePostId = () => {},
    setIsBookmarkView = () => {},
    setZTab = () => {},
    setSelectedUserForTimeline = () => {},
    setActiveDmUser = () => {},
    setDmText = () => {},
    setEditingReplyKey = () => {},
    setEditContent = () => {},
    setEditMediaUrl = () => {},
    setReplyInputs = () => {},
    setIsAuthModalOpen = () => {},
    handlePost = (e: React.FormEvent) => { e.preventDefault(); },
    handleSendDm = (e: React.FormEvent) => { e.preventDefault(); },
    handleDelete = () => {},
    handleToggleFollow = () => {},
    handleSaveEdit = () => {},
    handleOpenTranslateModal = () => {},
    handleRepost = () => {},
    handleZVote = () => {},
    handleShare = () => {},
    handleReplySubmit = () => {},
    renderBookmarkStampButton = () => null,
    renderMedia = () => null,
    renderContentWithEmbed = (content: string) => <span>{content}</span>,
    handleToggleBlock,
    handleReportPost,
    handleVoteBan,
    banVotes,
  } = props;
  
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEmojiTab, setActiveEmojiTab] = useState<'emoji' | 'aa' | null>(null);

  const [adminEmojis, setAdminEmojis] = useState<string[]>([]);
  const [adminAsciiArts, setAdminAsciiArts] = useState<string[]>([]);

  React.useEffect(() => {
    const savedEmojis = localStorage.getItem('kotodama_admin_emojis');
    if (savedEmojis) {
      try {
        const parsed = JSON.parse(savedEmojis);
        setAdminEmojis(parsed.map((item: any) => typeof item === 'string' ? item : item.content));
      } catch (e) {
        setAdminEmojis(['👍', '❤️', '🔥', '✨', '🎉', '👏', '💡', '📌', '⭐', '🚀', '👀', '💯']);
      }
    } else {
      setAdminEmojis(['👍', '❤️', '🔥', '✨', '🎉', '👏', '💡', '📌', '⭐', '🚀', '👀', '💯']);
    }

    const savedAA = localStorage.getItem('kotodama_admin_aa');
    if (savedAA) {
      try {
        const parsed = JSON.parse(savedAA);
        setAdminAsciiArts(parsed.map((item: any) => typeof item === 'string' ? item : item.content));
      } catch (e) {
        setAdminAsciiArts(['(・∀・)', '(^_^;)', '(>_<)', '(T_T)', '(｀・ω・´)', 'm(_ _)m', '＼(^o^)／', '( ﾟдﾟ)']);
      }
    } else {
      setAdminAsciiArts(['(・∀・)', '(^_^;)', '(>_<)', '(T_T)', '(｀・ω・´)', 'm(_ _)m', '＼(^o^)／', '( ﾟдﾟ)']);
    }
  }, []);
 
  const postInputRef = useRef<HTMLTextAreaElement>(null);

  const getCategoryName = (cat: any) => {
    if (!cat) return '';
    if (typeof cat === 'string') return cat;
    return cat.name || cat.id || String(cat);
  };

  const currentCatName = getCategoryName(currentCategory);

  const handleCategoryClick = (catItem: any) => {
    const catName = getCategoryName(catItem);
    setCurrentCategory(catName);
    setSelectedUserForTimeline(null);
    setIsBookmarkView(false);
    setZTab('timeline');
    setActivePostId(null);

    if (postInputRef.current) {
      postInputRef.current.focus();
    }
  };

  const insertText = (textToInsert: string) => {
    setNewComment((prev: string) => (prev || '') + textToInsert);
    if (postInputRef.current) {
      postInputRef.current.focus();
    }
  };

  const activeSinglePost = activePostId ? replies.find((r: any) => r.id === activePostId) : null;
  const activeChildPosts = activePostId ? replies.filter((r: any) => r.parentId === activePostId) : [];

  const filteredReplies = mainReplies.filter((reply: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      reply.content?.toLowerCase().includes(q) ||
      reply.author?.toLowerCase().includes(q) ||
      reply.category?.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // ★ Zモード：スレッド詳細が開かれているときは、画面全体（フルページ）を占有して表示
  // =========================================================================
  if (activePostId && activeSinglePost) {
    return (
      <div className="w-full max-w-5xl mx-auto min-h-screen bg-white text-gray-900 px-4 py-6 space-y-6">
        
        {/* フルページ用ヘッダー（戻るボタン ＆ タイトル） */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActivePostId(null)} 
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>←</span>
              <span>タイムラインに戻る</span>
            </button>
            <h1 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span className="text-emerald-600 font-black">𝕫</span>
              <span className="text-emerald-600">スレッド占有フルページ表示</span>
            </h1>
          </div>
          <span className="text-xs text-gray-400 font-bold">#{activeSinglePost.category}</span>
        </div>

        {/* 親スレッド本体のカード */}
        <div className="p-6 bg-emerald-50/20 border border-emerald-100 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              {activeSinglePost.avatarUrl ? (
                <img
                  src={activeSinglePost.avatarUrl}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shrink-0 shadow-sm">
                  {activeSinglePost.author.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-xs">{activeSinglePost.author}</span>
                  <img 
                    src="https://flagcdn.com/jp.svg" 
                    alt="JP" 
                    className="w-4 h-3 inline-block shrink-0 border border-gray-200 align-middle" 
                  />
                  <span className="text-gray-500 text-[11px]">{activeSinglePost.handle || '@user'}</span>
                  <span className="text-gray-400 text-[11px]">· {activeSinglePost.date}</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">#{activeSinglePost.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {activeSinglePost.handle !== account?.handle && (
                <button
                  type="button"
                  onClick={(e) => {
                    handleToggleFollow?.(activeSinglePost.handle, e);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                    followingList?.includes(activeSinglePost?.handle?.replace(/^@+/, ''))
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {followingList?.includes(activeSinglePost?.handle?.replace(/^@+/, '')) ? '✓ フォロー中' : '＋ フォロー'}
                </button>
              )}

              {/* 自治メニューボタン */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuPostId(openMenuPostId === activeSinglePost.id ? null : activeSinglePost.id);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition shadow-sm flex items-center gap-1 cursor-pointer"
                  title="ブロック・通報・出禁投票メニュー"
                >
                  <span>自治</span>
                  <span className="text-[10px]">▾</span>
                </button>

                {openMenuPostId === activeSinglePost.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 py-1.5 text-sm font-bold text-gray-800 divide-y divide-gray-100"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleBlock?.(activeSinglePost.handle);
                        setOpenMenuPostId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-red-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className="text-base">🚫</span>
                      <span>ブロック</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleReportPost?.(activeSinglePost.id);
                        setOpenMenuPostId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-amber-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className="text-base">⚠️</span>
                      <span>スパム通報</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleVoteBan?.(activeSinglePost.handle);
                        setOpenMenuPostId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-sky-600 transition-colors flex justify-between items-center cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-base">🗳️</span>
                        <span>出禁投票</span>
                      </span>
                      <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-black">
                        {banVotes?.[activeSinglePost.handle?.replace(/^@+/, '')]?.count || 0}票
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {account.isLoggedIn && account.handle === activeSinglePost.handle && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingReplyKey(activeSinglePost.id);
                      setEditContent(activeSinglePost.content);
                      setEditMediaUrl(activeSinglePost.mediaUrl || '');
                    }} 
                    className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                  >
                    [編集]
                  </button>
                  <button 
                    onClick={(e) => handleDelete(activeSinglePost.id, activeSinglePost.handle, e)} 
                    className="text-xs text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    [削除]
                  </button>
                </div>
              )}
            </div>
          </div>

          {editingReplyKey === activeSinglePost.id ? (
            <div className="space-y-2 pt-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs outline-none"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setEditingReplyKey(null)} 
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  キャンセル
                </button>
                <button 
                  onClick={() => handleSaveEdit(activeSinglePost.id)} 
                  className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-gray-900 pl-1">
              {renderContentWithEmbed(activeSinglePost.content, 'light')}
            </div>
          )}

          {activeSinglePost.mediaUrl && renderMedia(activeSinglePost.mediaUrl)}

          <div className="flex items-center justify-between pt-3 text-xs text-gray-500 border-t border-gray-100 flex-wrap gap-2">
            <button onClick={(e) => handleOpenTranslateModal(activeSinglePost.content, e)} className="text-emerald-700 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none bg-emerald-50 px-2.5 py-1 rounded-full">
              ✨ Gemini翻訳
            </button>
            <button
              onClick={(e) => handleShare(activeSinglePost.content, activeSinglePost.author, e)}
              className="text-gray-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none px-2.5 py-1 rounded-full hover:bg-emerald-50 transition"
              title="シェアする"
            >
              📤 シェア
            </button>
            <button
              onClick={(e) => handleRepost(activeSinglePost, e)}
              className={`cursor-pointer transition px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 border ${
                userReposts[activeSinglePost.id]
                  ? 'bg-emerald-500 text-white border-emerald-400 scale-105 shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300'
              }`}
            >
              <span>🔄 {userReposts[activeSinglePost.id] ? '再掲中' : '再掲'}</span>
              <span className="text-[11px] opacity-90">{activeSinglePost.repostCount || 0}</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button onClick={(e) => handleZVote(activeSinglePost.id, 'like', e)} className={`px-3 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${userVotes[`reply_${activeSinglePost.id}`] === 'like' ? 'bg-pink-600 text-white border-pink-500 font-bold shadow-sm' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
                ❤ {activeSinglePost.likes}
              </button>
              <button onClick={(e) => handleZVote(activeSinglePost.id, 'dislike', e)} className={`px-3 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${userVotes[`reply_${activeSinglePost.id}`] === 'dislike' ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
                👎 {activeSinglePost.dislikes}
              </button>
            </div>

            {renderBookmarkStampButton(activeSinglePost.id)}
          </div>
        </div>

        {/* レス一覧・チャットセクション（テーマz専用の1行レイアウトがここに適用されます） */}
        <ThreadChatSection
          theme="z"
          parentThread={activeSinglePost}
          childPosts={activeChildPosts}
          account={account}
          replyInputText={replyInputs[activeSinglePost.id] || ''}
          setReplyInputText={(val) => setReplyInputs({ ...replyInputs, [activeSinglePost.id]: val })}
          isSubmitting={isSubmitting}
          handleReplySubmit={handleReplySubmit}
          handleDelete={handleDelete}
          handleOpenTranslateModal={handleOpenTranslateModal}
          renderBookmarkStampButton={renderBookmarkStampButton}
          renderMedia={renderMedia}
          renderContentWithEmbed={renderContentWithEmbed}
          setIsAuthModalOpen={setIsAuthModalOpen}
          editingReplyKey={editingReplyKey}
          setEditingReplyKey={setEditingReplyKey}
          editContent={editContent}
          setEditContent={setEditContent}
          editMediaUrl={editMediaUrl}
          setEditMediaUrl={setEditMediaUrl}
          handleSaveEdit={handleSaveEdit}
          blockedUsers={props.blockedUsers}
          reportedPosts={props.reportedPosts}
          banVotes={banVotes}
          handleToggleBlock={handleToggleBlock}
          handleReportPost={handleReportPost}
          handleVoteBan={handleVoteBan}
        />
      </div>
    );
  }

  // =========================================================================
  // 通常のタイムライン一覧表示（左右のサイドバーあり）
  // =========================================================================
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 w-full max-w-full min-h-screen bg-white text-gray-900 px-2 md:px-6 gap-2">
      
      {/* 左サイドバー：カテゴリーメイン */}
      <div className="border-r border-gray-200 p-3 hidden md:flex md:col-span-3 flex-col justify-between sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto bg-gray-50/30">
        <div className="space-y-4">
          <div className="px-2 py-1 flex items-center">
            <div 
              onClick={() => {
                setCurrentCategory('総合'); // ★ 総合タイムラインに戻す
                setActivePostId(null); 
                setIsBookmarkView(false); 
                setZTab('timeline');
              }}
              className="cursor-pointer hover:opacity-80 transition select-none flex items-center"
              title="総合タイムラインに戻る"
            >
              <svg 
                viewBox="0 0 100 100" 
                aria-hidden="true" 
                className="w-9 h-9 transition-all duration-200 hover:scale-105 cursor-pointer text-emerald-500"
              >
                <path 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="5" 
                  strokeLinejoin="miter" 
                  strokeLinecap="square"
                  d="M 16 18 L 84 18 L 88 24 L 38 76 L 84 76 L 78 84 L 16 84 L 12 78 L 62 24 L 16 24 Z" 
                />
              </svg>
            </div>
          </div>

          <div className="pt-1">
            <div className="px-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 tracking-wider">
                📁 カテゴリー一覧
              </span>
            </div>

            <div className="space-y-1">
              {categories.map((catItem: any, idx: number) => {
                const catName = getCategoryName(catItem);
                const isActive = currentCatName === catName;
                return (
                  <button
                    key={catItem.id || idx}
                    onClick={() => handleCategoryClick(catItem)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex justify-between items-center cursor-pointer group ${
                      isActive 
                        ? 'bg-emerald-500 text-white shadow-xs font-bold scale-[1.01]' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">#{catName}</span>
                    <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-white' : 'text-emerald-600'}`}>
                      投稿 ✏️
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-2 py-2 text-[11px] text-gray-400 border-t border-gray-100">
          選択中: <span className="font-bold text-emerald-600">#{currentCatName}</span>
        </div>
      </div>

      {/* 中央エリア：検索窓 ＋ ダイレクト投稿 ＋ タイムライン */}
      <div className="col-span-1 md:col-span-6 border-r border-gray-200 min-h-screen bg-white p-2 md:p-4 space-y-4">
        
        <div className="bg-white border-b border-gray-100 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <span className="text-emerald-600 font-black">𝕫</span>
              {selectedUserForTimeline ? (
                <span className="text-emerald-600">@{selectedUserForTimeline} の投稿一覧</span>
              ) : isBookmarkView ? (
                <span className="text-pink-600">お気に入りスタンプ一覧</span>
              ) : zTab === 'following' ? (
                <span className="text-emerald-600">フォロー中のタイムライン</span>
              ) : zTab === 'dm' ? (
                <span className="text-teal-600">ダイレクトメッセージ (DM)</span>
              ) : (
                <span>タイムライン ({currentCatName})</span>
              )}
            </h1>
          </div>

          {zTab === 'timeline' && (
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                🔍
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`#${currentCatName} `}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-emerald-500 rounded-xl text-xs transition-all outline-none"
              />
            </div>
          )}
        </div>

        {zTab === 'timeline' && !selectedUserForTimeline && !isBookmarkView && (
          <form onSubmit={handlePost} className="p-3.5 bg-white border border-emerald-100 rounded-2xl shadow-xs space-y-3">
            <div className="text-xs font-bold text-emerald-600 flex items-center justify-between">
              <span>✏️ [{currentCatName}] にポストする</span>
              <span className="text-[10px] text-gray-400 font-normal">左のカテゴリー変更で連動</span>
            </div>

            {setNewThreadTitle && (
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="スレッドタイトル（任意）"
                className="w-full text-xs px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500"
              />
            )}

            <textarea
              ref={postInputRef}
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="いまどうしてる？"
              className="w-full text-xs p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-500 resize-none"
            />

            <div className="space-y-2 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setActiveEmojiTab(activeEmojiTab === 'emoji' ? null : 'emoji')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    activeEmojiTab === 'emoji' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  😊 絵文字 ({adminEmojis.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEmojiTab(activeEmojiTab === 'aa' ? null : 'aa')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                    activeEmojiTab === 'aa' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  (・∀・) AA・顔文字 ({adminAsciiArts.length})
                </button>

                {setIsTargetAll && (
                  <label className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTargetAll}
                      onChange={(e) => setIsTargetAll(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>全モードに共通発言する</span>
                  </label>
                )}
              </div>

              {activeEmojiTab === 'emoji' && (
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {adminEmojis.map((em, idx) => (
                    <button
                      key={`emoji-${idx}`}
                      type="button"
                      onClick={() => insertText(em)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-emerald-100 border border-gray-200 flex items-center justify-center text-sm transition cursor-pointer shrink-0"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}

              {activeEmojiTab === 'aa' && (
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {adminAsciiArts.map((aa, idx) => (
                    <button
                      key={`aa-${idx}`}
                      type="button"
                      onClick={() => insertText(aa)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 border border-gray-200 text-xs font-mono transition cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {aa}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-gray-400">
                <span>Markdown対応</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? '投稿中...' : 'ポストする'}
              </button>
            </div>
          </form>
        )}

        {zTab === 'dm' ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-r border-gray-200 pr-4 space-y-2">
              <h3 className="font-bold text-xs text-gray-500 mb-2">相互フォロー / 送信先</h3>
              {followingList.length === 0 ? (
                <div className="text-xs text-gray-400 p-2 bg-gray-50 rounded-xl">フォロー中のユーザーがいません</div>
              ) : (
                followingList.map((handle: string) => (
                  <button
                    key={handle}
                    onClick={() => setActiveDmUser(handle)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex justify-between items-center cursor-pointer ${activeDmUser === handle ? 'bg-emerald-500 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    <span>@{handle.replace(/^@+/, '')}</span>
                    <span className="text-[10px] opacity-80">💬</span>
                  </button>
                ))
              )}
            </div>

            <div className="col-span-2 space-y-4 flex flex-col h-[500px]">
              {activeDmUser ? (
                <>
                  <div className="font-bold text-xs border-b border-gray-200 pb-2 text-emerald-600 flex items-center justify-between">
                    <span>@{activeDmUser.replace(/^@+/, '')} とのチャット</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">DM接続中</span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner">
                    {directMessages
                      .filter((m: any) => (m.sender_handle === account.handle && m.receiver_handle === activeDmUser) || (m.sender_handle === activeDmUser && m.receiver_handle === account.handle))
                      .map((msg: any, idx: number) => {
                        const isMe = msg.sender_handle === account.handle;
                        return (
                          <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${isMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}`}>
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                              <span className="text-[9px] opacity-70 block text-right mt-1">{new Date(msg.created_at).toLocaleTimeString().slice(0, 5)}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {account.isLoggedIn ? (
                    <form onSubmit={handleSendDm} className="flex gap-2">
                      <input
                        type="text"
                        value={dmText}
                        onChange={(e) => setDmText(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-1 bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 outline-none focus:border-emerald-500 focus:bg-white shadow-sm"
                      />
                      <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow">
                        送信
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 text-center bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-xs text-gray-500">DMを送信するにはログインが必要です</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-2xl p-6 text-center bg-gray-50/50">
                  左側のリストからメッセージを送るユーザーを選択してください
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReplies.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                {isBookmarkView ? 'お気に入り登録されたポストはありません。' : 'ポストがまだ投稿されていません。'}
              </div>
            ) : (
              filteredReplies.map((reply: any) => {
                const isRep = userReposts[reply.id];
                const userVote = userVotes[`reply_${reply.id}`];
                const childPosts = replies.filter((r: any) => r.parentId === reply.id);
                const isMyPost = account.isLoggedIn && account.handle === reply.handle;
                const isEditing = editingReplyKey === reply.id;

                return (
                  <div 
                    key={reply.id} 
                    onClick={() => setActivePostId(reply.id)}
                    className="p-4 hover:bg-emerald-50/30 transition space-y-3 cursor-pointer border-b border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {reply.avatarUrl ? (
                          <img
                            src={reply.avatarUrl}
                            alt=""
                            onClick={(e) => {
                              e.stopPropagation();
                              if (reply.handle) setSelectedUserForTimeline(reply.handle.replace('@', ''));
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer hover:opacity-80 transition shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (reply.handle) setSelectedUserForTimeline(reply.handle.replace('@', ''));
                            }}
                            className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shrink-0 cursor-pointer hover:opacity-80 transition shadow-sm"
                          >
                            {reply.author.slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (reply.handle) setSelectedUserForTimeline(reply.handle.replace('@', ''));
                              }}
                              className="font-bold text-gray-900 hover:underline cursor-pointer text-xs"
                            >
                              {reply.author}
                            </span>
                            <img 
                              src="https://flagcdn.com/jp.svg" 
                              alt="JP" 
                              className="w-4 h-3 inline-block shrink-0 border border-gray-200 align-middle" 
                            />
                            <span className="text-gray-500 text-[11px]">{reply.handle || '@user'}</span>
                            <span className="text-gray-400 text-[11px]">· {reply.date}</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">#{reply.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                        {reply.handle !== account?.handle && (
                          <>
                            {(() => {
                              const cleanTargetHandle = (reply.handle || '').replace(/^@+/, '');
                              const isFollowing = followingList.some(h => h.replace(/^@+/, '') === cleanTargetHandle);

                              return (
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFollow?.(reply.handle, e)}
                                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-xs cursor-pointer ${
                                    isFollowing
                                      ? 'bg-white text-emerald-800 border border-emerald-300 hover:bg-gray-100'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                >
                                  {isFollowing ? '✓ フォロー中' : '＋ フォロー'}
                                </button>
                              );
                            })()}
                          </>
                        )}

                        {reply.handle !== account?.handle && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuPostId(openMenuPostId === reply.id ? null : reply.id);
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <span>自治</span>
                              <span className="text-[10px]">▾</span>
                            </button>

                            {openMenuPostId === reply.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 py-1.5 text-sm font-bold text-gray-800 divide-y divide-gray-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggleBlock?.(reply.handle);
                                    setOpenMenuPostId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-red-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                                >
                                  <span className="text-base">🚫</span>
                                  <span>ブロック</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleReportPost?.(reply.id);
                                    setOpenMenuPostId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-amber-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                                >
                                  <span className="text-base">⚠️</span>
                                  <span>スパム通報</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleVoteBan?.(reply.handle);
                                    setOpenMenuPostId(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-sky-600 transition-colors flex justify-between items-center cursor-pointer"
                                >
                                  <span className="flex items-center gap-2.5">
                                    <span className="text-base">🗳️</span>
                                    <span>出禁投票</span>
                                  </span>
                                  <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-black">
                                    {banVotes?.[reply.handle?.replace(/^@+/, '')]?.count || 0}票
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {account.isLoggedIn && account.handle === reply.handle && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingReplyKey(reply.id);
                                setEditContent(reply.content);
                                setEditMediaUrl(reply.mediaUrl || '');
                              }} 
                              className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                            >
                              [編集]
                            </button>
                            <button 
                              onClick={(e) => handleDelete(reply.id, reply.handle, e)} 
                              className="text-xs text-red-500 hover:underline font-bold cursor-pointer"
                            >
                              [削除]
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <textarea
                          rows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingReplyKey(null)} 
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            キャンセル
                          </button>
                          <button 
                            onClick={() => handleSaveEdit(reply.id)} 
                            className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed text-gray-900 pl-1">
                        {renderContentWithEmbed(reply.content, 'light')}
                      </div>
                    )}

                    {reply.mediaUrl && renderMedia(reply.mediaUrl)}

                    <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-gray-100 flex-wrap gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setActivePostId(reply.id); }} className="hover:text-emerald-600 flex items-center gap-1.5 transition cursor-pointer bg-transparent border-none font-medium">
                        💬 <span className="text-gray-700 font-bold">{childPosts.length}</span> レス
                      </button>

                      <button onClick={(e) => handleOpenTranslateModal(reply.content, e)} className="text-emerald-700 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none bg-emerald-50 px-2 py-1 rounded-full">
                        ✨ Gemini翻訳
                      </button>
                      <button
                        onClick={(e) => handleShare(reply.content, reply.author, e)}
                        className="text-gray-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none px-2 py-1 rounded-full hover:bg-emerald-50 transition"
                        title="シェアする"
                      >
                        📤 シェア
                      </button>
                      <button
                        onClick={(e) => handleRepost(reply, e)}
                        className={`cursor-pointer transition px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0 border ${
                          isRep
                            ? 'bg-emerald-500 text-white border-emerald-400 scale-105 shadow-sm'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300'
                        }`}
                      >
                        <span>🔄 {isRep ? '再掲中' : '再掲'}</span>
                        <span className="text-[11px] opacity-90">{reply.repostCount || 0}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button onClick={(e) => handleZVote(reply.id, 'like', e)} className={`px-2.5 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${userVote === 'like' ? 'bg-pink-600 text-white border-pink-500 font-bold shadow-sm' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
                          ❤ {reply.likes}
                        </button>
                        <button onClick={(e) => handleZVote(reply.id, 'dislike', e)} className={`px-2.5 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${userVote === 'dislike' ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm' : 'border-gray-200 hover:border-gray-400 text-gray-600'}`}>
                          👎 {reply.dislikes}
                        </button>
                      </div>

                      {renderBookmarkStampButton(reply.id)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 右サイドバー */}
      <div className="p-3 hidden md:flex md:col-span-3 flex-col space-y-4 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto bg-gray-50/30">
        <nav className="space-y-1 text-sm font-bold bg-white border border-gray-200 p-2.5 rounded-2xl shadow-xs">
          <div onClick={() => { setCurrentCategory('総合'); setActivePostId(null); setIsBookmarkView(false); setZTab('timeline'); }} className="p-3 hover:bg-emerald-50 rounded-xl cursor-pointer flex items-center gap-3 text-gray-800 hover:text-emerald-600 transition">
            <span className="text-base">🏠</span> ホーム
          </div>
          <div onClick={() => { setActivePostId(null); setZTab('timeline'); setIsBookmarkView(true); }} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition ${isBookmarkView ? 'bg-pink-100 text-pink-600 font-extrabold' : 'hover:bg-emerald-50 text-gray-800'}`}>
            <span className="text-red-500 text-base">⭐</span> お気に入り
          </div>
          <div onClick={() => { setActivePostId(null); setIsBookmarkView(false); setZTab('following'); }} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition ${zTab === 'following' ? 'bg-emerald-100 text-emerald-700 font-extrabold' : 'hover:bg-emerald-50 text-gray-800'}`}>
            <span className="text-emerald-500 text-base">👥</span> フォロー中 ({followingList.length})
          </div>
          <div onClick={() => { setActivePostId(null); setIsBookmarkView(false); setZTab('dm'); }} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition ${zTab === 'dm' ? 'bg-teal-100 text-teal-700 font-extrabold' : 'hover:bg-emerald-50 text-gray-800'}`}>
            <span className="text-teal-500 text-base">✉️</span> メッセージ
          </div>
        </nav>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <button
            onClick={() => setIsRankingOpen(!isRankingOpen)}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-bold text-gray-800 transition cursor-pointer"
          >
            <span className="flex items-center gap-2 text-amber-600">
              <span className="text-base">🏆</span> 総合人気ランキング
            </span>
            <span className={`text-xs text-gray-500 transition-transform duration-200 ${isRankingOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {isRankingOpen && (
            <div className="p-3 space-y-2 border-t border-gray-100">
              {top10Ranking.slice(0, 5).map((r: any, i: number) => {
                const titleStr = r.content.startsWith('【') && r.content.includes('】\n')
                  ? r.content.split('】\n')[0].replace('【', '')
                  : r.content.split('\n')[0];

                return (
                  <div 
                    key={r.id} 
                    onClick={() => {
                      setActivePostId(r.id);
                      setZTab('timeline');
                      setSelectedUserForTimeline(null);
                      setIsBookmarkView(false);
                    }}
                    className="flex items-center justify-between text-xs p-2 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        i === 0 ? 'bg-amber-400 text-black' : i === 1 ? 'bg-slate-300 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="truncate text-gray-700 hover:text-emerald-600 font-medium text-xs">
                        {titleStr}
                      </span>
                    </div>
                    <span className="text-[10px] text-pink-600 font-bold shrink-0 ml-1 bg-pink-50 px-2 py-0.5 rounded-full">❤ {r.likesCount}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}