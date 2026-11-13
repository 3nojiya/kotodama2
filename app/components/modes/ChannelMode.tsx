// app/components/modes/ChannelMode.tsx
'use client';

import React from 'react';
import { PostForm } from '../shared/PostForm';
import ThreadChatSection from '../shared/ThreadChatSection';

interface ChannelModeProps {
  openMenuPostId?: number | null;
  setOpenMenuPostId?: React.Dispatch<React.SetStateAction<number | null>>;
  categories: string[];
  currentCategory: string;
  setCurrentCategory: (cat: string) => void;
  isBookmarkView: boolean;
  setIsBookmarkView: (val: boolean) => void;
  channelSearchQuery: string;
  setChannelSearchQuery: (query: string) => void;
  mainReplies: any[];
  replies: any[];
  selectedJaneThreadId: number | null;
  setSelectedJaneThreadId: (id: number | null) => void;
  viewLimitMode: 'all' | '50' | '100';
  setViewLimitMode: (mode: 'all' | '50' | '100') => void;
  account: any;
  newAuthorName: string;
  setNewAuthorName: (name: string) => void;
  newEmail: string;
  setNewEmail: (email: string) => void;
  newThreadTitle: string;
  setNewThreadTitle: (title: string) => void;
  newComment: string;
  setNewComment: (comment: string) => void;
  isTargetAll: boolean;
  setIsTargetAll: (val: boolean) => void;
  isSubmitting: boolean;
  handlePost: (e: React.FormEvent) => void;
  handleReplySubmit: (parentId: number, customText?: string) => void;
  handleDelete: (id: number, handle: string | undefined, e: React.MouseEvent) => void;
  handleSaveEdit: (id: number, handle: string | undefined, isThread: boolean) => void;
  handleOpenTranslateModal: (text: string, e: React.MouseEvent) => void;
  fetchPosts: () => void;
  scrollToNewThreadForm: () => void;
  newThreadFormRef: React.RefObject<HTMLDivElement | null>;
  renderBookmarkStampButton: (replyId: number) => React.ReactNode;
  renderMedia: (url: string) => React.ReactNode;
  renderContentWithEmbed: (content: string) => React.ReactNode;
  setIsAuthModalOpen: (val: boolean) => void;
  editingReplyKey: string | null;
  setEditingReplyKey: (key: string | null) => void;
  editTitle: string;
  setEditTitle: (title: string) => void;
  editContent: string;
  setEditContent: (content: string) => void;
  editMediaUrl: string;
  setEditMediaUrl: (url: string) => void;
  replyInputs: { [key: number]: string };
  setReplyInputs: (inputs: any) => void;
  blockedUsers?: string[];
  reportedPosts?: number[];
  banVotes?: Record<string, { count: number; voters: string[] }>;
  handleToggleBlock?: (handle: string) => void;
  handleReportPost?: (postId: number) => void;
  handleVoteBan?: (targetHandle: string) => void;
  // ★ ホーム（総合タイムライン）表示用のフラグ（親から受け取る、または未定義なら内部で管理も可）
  isHomeView?: boolean;
  setIsHomeView?: (val: boolean) => void;
}

export function ChannelMode(props: ChannelModeProps) {
  const threadTopRef = React.useRef<HTMLDivElement>(null);
  const [openMenuPostId, setOpenMenuPostId] = React.useState<number | null>(null);
  const {
    categories,
    currentCategory,
    setCurrentCategory,
    isBookmarkView,
    setIsBookmarkView,
    channelSearchQuery,
    setChannelSearchQuery,
    mainReplies,
    replies,
    selectedJaneThreadId,
    setSelectedJaneThreadId,
    viewLimitMode,
    setViewLimitMode,
    account,
    newThreadTitle,
    setNewThreadTitle,
    newComment,
    setNewComment,
    isTargetAll,
    setIsTargetAll,
    isSubmitting,
    handlePost,
    handleReplySubmit,
    handleDelete,
    handleSaveEdit,
    handleOpenTranslateModal,
    fetchPosts,
    scrollToNewThreadForm,
    newThreadFormRef,
    renderBookmarkStampButton,
    renderMedia,
    renderContentWithEmbed,
    setIsAuthModalOpen,
    editingReplyKey,
    setEditingReplyKey,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    editMediaUrl,
    setEditMediaUrl,
    replyInputs,
    setReplyInputs,
    handleToggleBlock,
    handleReportPost,
    handleVoteBan,
    banVotes,
    isHomeView = true, // デフォルトはホーム（総合タイムライン）
    setIsHomeView,
  } = props;

  const selectedThread = replies.find(r => r.id === selectedJaneThreadId);
  const selectedThreadChildPosts = selectedJaneThreadId ? replies.filter(r => r.parentId === selectedJaneThreadId) : [];

  let displayedPosts = selectedThreadChildPosts;
  if (viewLimitMode === '50') {
    displayedPosts = selectedThreadChildPosts.slice(-50);
  } else if (viewLimitMode === '100') {
    displayedPosts = selectedThreadChildPosts.slice(0, 100);
  }

  return (
    <div className="min-h-screen font-sans text-xs bg-[#eef3f8] text-[#000] p-2">
      <div className="max-w-6xl mx-auto my-3 bg-white border border-[#b0b0b0] shadow-sm grid grid-cols-12 min-h-[80vh]">
        
        {/* 左サイドバー（ホーム・カテゴリー一覧・お気に入り） */}
        <div className="col-span-3 sm:col-span-2 bg-[#f0f4f8] border-r border-[#c0c0c0] p-2 space-y-3 text-[11px] overflow-y-auto max-h-[80vh]">
          
          {/* ★ ホーム（総合スレッド一覧）ボタンを新設 */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsHomeView?.(true);
                setIsBookmarkView(false);
              }}
              className={`block w-full text-left px-2 py-1.5 rounded font-bold cursor-pointer transition ${
                isHomeView && !isBookmarkView ? 'bg-[#800000] text-white shadow-xs' : 'bg-white text-blue-900 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              🏠 ホーム（総合）
            </button>
          </div>

          <div className="border-t border-gray-300 pt-2 space-y-1">
            <div className="font-bold text-[#800000] border-b border-[#c0c0c0] pb-1">■ カテゴリー一覧 ({categories.length}件)</div>
            <div className="space-y-1">
              {categories.map((catName) => (
                <button
                  key={catName}
                  onClick={() => {
                    setCurrentCategory(catName);
                    setIsHomeView?.(false);
                    setIsBookmarkView(false);
                  }}
                  className={`block w-full text-left px-1.5 py-1 rounded cursor-pointer truncate ${
                    !isHomeView && !isBookmarkView && currentCategory === catName ? 'bg-[#800000] text-white font-bold' : 'text-blue-900 hover:underline'
                  }`}
                >
                  ・{catName}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-300 pt-2 space-y-1">
            <button 
              onClick={() => {
                setIsBookmarkView(!isBookmarkView);
                if (!isBookmarkView) setIsHomeView?.(false);
              }} 
              className="text-blue-900 font-bold hover:underline block cursor-pointer"
            >
              {isBookmarkView ? '・板に戻る' : '⭐ お気に入り'}
            </button>
          </div>
        </div>

        {/* メイン表示領域 */}
        <div className="col-span-9 sm:col-span-10 p-4 space-y-6 bg-[#fffbf5]">
          <div className="bg-[#e6e6d8] border border-[#d0d0c0] p-3 text-center rounded flex flex-col md:flex-row justify-between items-center gap-3">
            <h1 className="text-base font-bold text-[#800000]">
              {isBookmarkView 
                ? '言霊・チャンネルモード板 (お気に入り)' 
                : isHomeView 
                  ? '言霊・チャンネルモード板 (総合スレッド一覧)' 
                  : `言霊・チャンネルモード板 (カテゴリー: ${currentCategory})`}
            </h1>
            <div className="flex items-center gap-1 bg-white border border-gray-400 px-2 py-1 rounded">
              <span className="text-gray-500">🔍</span>
              <input
                type="text"
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                placeholder="スレッドを検索..."
                className="outline-none text-xs text-black bg-transparent w-40"
              />
            </div>
          </div>

          {/* スレッド一覧 */}
          <div className="border border-[#c0c0c0] bg-white p-3 rounded space-y-2">
            <div className="font-bold text-[#800000] border-b border-gray-200 pb-1 flex justify-between items-center">
              <span>▼ スレッド一覧 ({mainReplies.filter(r => r.content.toLowerCase().includes(channelSearchQuery.toLowerCase())).length}件)</span>
              {account.isLoggedIn && (
                <button onClick={scrollToNewThreadForm} className="text-blue-800 text-[11px] hover:underline cursor-pointer font-bold">
                  [＋新規スレッド作成フォームへ]
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              {mainReplies
                .filter(thread => thread.content.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                .map((thread, idx) => {
                  const threadCount = replies.filter(r => r.parentId === thread.id).length;
                  const threadTitleText = thread.content.startsWith('【') && thread.content.includes('】\n') 
                    ? thread.content.split('】\n')[0].replace('【', '') 
                    : thread.content.split('\n')[0];

                  return (
                    <div 
                      key={thread.id} 
                      onClick={() => {
                        setSelectedJaneThreadId(thread.id);
                        setTimeout(() => {
                          threadTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }}
                      className="truncate flex items-center justify-between gap-1 cursor-pointer hover:text-blue-600 transition py-0.5"
                    >
                      <div className="truncate flex items-center gap-1">
                        <span>{idx + 1}:</span>
                        <img 
                          src="https://flagcdn.com/jp.svg" 
                          alt="JP" 
                          className="w-4 h-3 inline-block shrink-0 border border-gray-200" 
                        />
                        <span className="truncate">{threadTitleText}</span>
                        <span className="text-gray-500 font-normal">({threadCount})</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 選択中のスレッド詳細 */}
          {selectedThread ? (
            <div ref={threadTopRef} className="border border-[#c0c0c0] bg-white p-4 rounded space-y-4 shadow-sm">
              {/* タイトルと編集・削除ボタン・自治ボタン */}
              <div className="border-b-2 border-[#800000] pb-2 flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-sm font-bold text-[#800000]">
                  {selectedThread.content.startsWith('【') && selectedThread.content.includes('】\n') 
                    ? selectedThread.content.split('】\n')[0].replace('【', '') 
                    : selectedThread.content.split('\n')[0]}
                </h2>
                <div className="flex items-center gap-2">
                  {/* ▼ チャンネルモード親スレッド用の自治メニューボタン */}
                  {selectedThread.handle !== account?.handle && (
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuPostId(openMenuPostId === selectedThread.id ? null : selectedThread.id);
                        }}
                        className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>自治</span>
                        <span className="text-[9px]">▾</span>
                      </button>

                      {openMenuPostId === selectedThread.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 py-1.5 text-sm font-bold text-gray-800 divide-y divide-gray-100"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleBlock?.(selectedThread.handle);
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
                              handleReportPost?.(selectedThread.id);
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
                              handleVoteBan?.(selectedThread.handle);
                              setOpenMenuPostId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-sky-600 transition-colors flex justify-between items-center cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-base">🗳️</span>
                              <span>出禁投票</span>
                            </span>
                            <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-black">
                              {banVotes?.[selectedThread.handle?.replace(/^@+/, '')]?.count || 0}票
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {account.isLoggedIn && account.handle === selectedThread.handle && editingReplyKey !== selectedThread.id && (
                    <button onClick={() => { 
                      setEditingReplyKey(selectedThread.id); 
                    }} className="text-blue-800 text-[11px] hover:underline cursor-pointer">[編集]</button>
                  )}
                  {account.isLoggedIn && account.handle === selectedThread.handle && (
                    <button onClick={(e) => handleDelete(selectedThread.id, selectedThread.handle, e)} className="text-red-600 text-[11px] hover:underline cursor-pointer">[削除]</button>
                  )}
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs leading-relaxed">
                <div className="border-b border-gray-200 pb-3 space-y-1">
                  <div className="text-gray-700 flex justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1">
                      <b className="text-green-800">1</b>
                      <img 
                        src="https://flagcdn.com/jp.svg" 
                        alt="JP" 
                        className="w-4 h-3 inline-block shrink-0 border border-gray-200 align-middle" 
                      />
                      名前：<b className="text-blue-950">{selectedThread.author}</b> [{selectedThread.date}]
                    </div>
                    <div className="flex gap-2 font-sans items-center">
                      <button onClick={(e) => handleOpenTranslateModal(selectedThread.content, e)} className="text-indigo-600 font-bold hover:underline cursor-pointer">✨翻訳</button>
                      {renderBookmarkStampButton(selectedThread.id)}
                    </div>
                  </div>

                  {editingReplyKey === `reply-${selectedThread.id}` ? (
                    <div className="space-y-2 pt-2 bg-gray-50 p-2 rounded border border-gray-300 font-sans">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">タイトル:</label>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="スレッドタイトル..." className="w-full p-1.5 border rounded text-xs text-black bg-white" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-0.5">本文:</label>
                        <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="本文..." className="w-full p-2 border rounded text-xs text-black bg-white" />
                      </div>
                      <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURLを変更..." className="w-full p-1 border rounded text-xs bg-white text-black" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingReplyKey(null)} className="px-2 py-1 bg-gray-200 rounded cursor-pointer">キャンセル</button>
                        <button onClick={() => handleSaveEdit(selectedThread.id, selectedThread.handle, true)} className="px-2 py-1 bg-blue-800 text-white rounded font-bold cursor-pointer">編集を保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="pl-2 pt-1 text-black font-sans">
                      {renderContentWithEmbed(
                        selectedThread.content.startsWith('【') && selectedThread.content.includes('】\n')
                          ? selectedThread.content.split('】\n')[1]
                          : selectedThread.content
                      )}
                    </div>
                  )}

                  {selectedThread.mediaUrl && renderMedia(selectedThread.mediaUrl)}
                </div>
              </div>

              {/* フッターナビゲーション */}
              <div className="bg-[#f5f5ea] border border-[#d0d0c0] p-2 text-center text-xs space-x-3 text-blue-900 font-bold rounded">
                <button onClick={() => setViewLimitMode('all')} className={`hover:underline cursor-pointer ${viewLimitMode === 'all' ? 'text-red-700 underline font-black' : ''}`}>全部読む</button>
                <span>|</span>
                <button onClick={() => setViewLimitMode('50')} className={`hover:underline cursor-pointer ${viewLimitMode === '50' ? 'text-red-700 underline font-black' : ''}`}>最新50</button>
                <span>|</span>
                <button onClick={() => setViewLimitMode('100')} className={`hover:underline cursor-pointer ${viewLimitMode === '100' ? 'text-red-700 underline font-black' : ''}`}>1-100</button>
                <span>|</span>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:underline cursor-pointer">板のトップ</button>
                <span>|</span>
                <button onClick={fetchPosts} className="hover:underline cursor-pointer">🔄 リロード</button>
              </div>

              <ThreadChatSection
                theme="channel"
                parentThread={selectedThread}
                childPosts={displayedPosts}
                account={account}
                replyInputText={replyInputs[selectedThread.id] || ''}
                setReplyInputText={(val) => setReplyInputs({ ...replyInputs, [selectedThread.id]: val })}
                isSubmitting={isSubmitting}
                handleReplySubmit={(pId, text) => handleReplySubmit(pId, text)}
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
          ) : (
            <div className="p-8 text-center text-gray-500 border border-dashed rounded">スレッドを選択すると表示されます</div>
          )}

          {/* 新規スレッド作成フォーム */}
          <div ref={newThreadFormRef}>
            <PostForm
              theme="channel"
              account={account}
              newThreadTitle={newThreadTitle}
              setNewThreadTitle={setNewThreadTitle}
              newComment={newComment}
              setNewComment={setNewComment}
              isTargetAll={isTargetAll}
              setIsTargetAll={setIsTargetAll}
              isSubmitting={isSubmitting}
              onSubmit={handlePost}  
            />
          </div>

        </div>
      </div>
    </div>
  );
}
