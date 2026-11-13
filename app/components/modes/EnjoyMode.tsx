// app/components/modes/EnjoyMode.tsx
'use client';

import React from 'react';
import { PostForm } from '../shared/PostForm';
import ThreadChatSection from '../shared/ThreadChatSection';
interface EnjoyModeProps {
  categories: string[];
  currentCategory: string;
  setCurrentCategory: (cat: string) => void;
  isBookmarkView: boolean;
  setIsBookmarkView: (val: boolean) => void;
  mainReplies: any[];
  replies: any[];
  enjoySelectedThreadId: number | null;
  setEnjoySelectedThreadId: (id: number | null) => void;
  enjoyViewMode: 'list' | 'detail' | 'write';
  setEnjoyViewMode: (mode: 'list' | 'detail' | 'write') => void;
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
  handleZVote: (replyId: number, targetVote: 'like' | 'dislike', e: React.MouseEvent) => void;
  handleOpenEnjoyThread: (thread: any) => void;
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
}

export function EnjoyMode(props: EnjoyModeProps) {
  const [openMenuPostId, setOpenMenuPostId] = React.useState<number | null>(null);
  const {
    categories,
    currentCategory,
    setCurrentCategory,
    isBookmarkView,
    setIsBookmarkView,
    mainReplies,
    replies,
    enjoySelectedThreadId,
    setEnjoySelectedThreadId,
    enjoyViewMode,
    setEnjoyViewMode,
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
    handleZVote,
    handleOpenEnjoyThread,
    renderBookmarkStampButton,
    renderContentWithEmbed,
    setIsAuthModalOpen,
    editingReplyKey,
    setEditingReplyKey,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    replyInputs,
    setReplyInputs,
    handleToggleBlock,
    handleReportPost,
    handleVoteBan,
    banVotes,
  } = props;

  const [enjoyCurrentPage, setEnjoyCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 20;

  const selectedEnjoyThread = replies.find(r => r.id === enjoySelectedThreadId);
  const enjoyThreadChildPosts = enjoySelectedThreadId ? replies.filter(r => r.parentId === enjoySelectedThreadId) : [];

  const totalPages = Math.ceil(mainReplies.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (enjoyCurrentPage - 1) * ITEMS_PER_PAGE;
  const currentPaginatedReplies = mainReplies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="bg-[#fbfbfb] flex-1 text-gray-800 w-full overflow-hidden">
      <div className="border-b border-gray-300 px-6 py-3 flex items-center justify-between bg-white shadow-xs gap-4 flex-wrap">
       <div 
          onClick={() => { 
            setCurrentCategory('総合'); // ★ 総合一覧を表示するためのキーワード
            setEnjoyViewMode('list'); 
            setIsBookmarkView(false); 
          }} 
          className="text-3xl font-black italic tracking-wider text-[#1b5e20] cursor-pointer hover:opacity-80 transition select-none shrink-0 pr-4"
          title="総合スレッド一覧に戻る"
        >
          enjoy mode
        </div>

        <div className="flex-1 max-w-md mx-auto min-w-[200px]">
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full">
            <span className="text-gray-400 text-xs pl-1">🔍</span>
            <input
              type="text"
              placeholder="トピックを検索..."
              className="w-full outline-none text-xs text-black bg-transparent"
            />
          </div>
        </div>

        <div className="shrink-0">
          <button 
            onClick={() => setIsBookmarkView(!isBookmarkView)} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
              isBookmarkView 
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm' 
                : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            ⭐ {isBookmarkView ? '掲示板に戻る' : 'お気に入り一覧'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px] bg-white overflow-hidden">
        <div className="col-span-3 border-r border-gray-300 p-3 bg-[#f8faf9] space-y-3 text-xs overflow-y-auto max-h-[75vh] hidden md:block">
          <div className="font-bold text-[#1b5e20] border-b border-gray-300 pb-1">カテゴリー一覧 ({categories.length}件)</div>
          <div className="space-y-1">
            {categories.map((catName) => (
              <button
                key={catName}
                onClick={() => { 
                  setCurrentCategory(catName); 
                  setEnjoyViewMode('list'); 
                  setIsBookmarkView(false);
                }}
                className={`w-full text-left px-2 py-1 rounded flex justify-between items-center transition cursor-pointer truncate ${currentCategory === catName ? 'bg-[#1b5e20] text-white font-bold' : 'hover:bg-emerald-50 text-gray-700'}`}
              >
                <span className="truncate">・{catName}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 md:col-span-9 p-4 sm:p-6 space-y-4 bg-white overflow-hidden">
          {enjoyViewMode === 'write' ? (
            <div className="border border-gray-300 bg-[#fdfdf9] p-5 rounded-lg space-y-4 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="font-bold text-sm text-[#1b5e20]">◆ 新規トピック・書き込み (カテゴリー: {currentCategory})</h2>
                <button onClick={() => setEnjoyViewMode('list')} className="text-gray-600 hover:underline cursor-pointer">← 一覧に戻る</button>
              </div>

              <PostForm
                theme="enjoy"
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
          ) : enjoyViewMode === 'detail' && selectedEnjoyThread ? (
            <div className="space-y-4 overflow-hidden">
              <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                <button onClick={() => setEnjoyViewMode('list')} className="text-[#1b5e20] underline cursor-pointer font-bold">← トピック一覧に戻る</button>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <button 
                    onClick={() => setEnjoyViewMode('write')} 
                    className="bg-[#1b5e20] hover:bg-[#144517] text-white font-bold px-3 py-1 rounded text-xs cursor-pointer shadow shrink-0"
                  >
                    ✏️ 書き込み
                  </button>

                  {/* ▼ エンジョイモード親スレッド用の自治メニューボタン */}
                  {selectedEnjoyThread.handle !== account?.handle && (
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuPostId(openMenuPostId === selectedEnjoyThread.id ? null : selectedEnjoyThread.id);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>自治</span>
                        <span className="text-[10px]">▾</span>
                      </button>

                      {openMenuPostId === selectedEnjoyThread.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 py-1.5 text-sm font-bold text-gray-800 divide-y divide-gray-100"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleBlock?.(selectedEnjoyThread.handle);
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
                              handleReportPost?.(selectedEnjoyThread.id);
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
                              handleVoteBan?.(selectedEnjoyThread.handle);
                              setOpenMenuPostId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-sky-600 transition-colors flex justify-between items-center cursor-pointer"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="text-base">🗳️</span>
                              <span>出禁投票</span>
                            </span>
                            <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-black">
                              {banVotes?.[selectedEnjoyThread.handle?.replace(/^@+/, '')]?.count || 0}票
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {account.isLoggedIn && account.handle === selectedEnjoyThread.handle && (
                    <div className="flex items-center gap-3">
                      {editingReplyKey !== `reply-${selectedEnjoyThread.id}` && (
                        <button onClick={() => { 
                          setEditingReplyKey(`reply-${selectedEnjoyThread.id}`); 
                          const fullContent = selectedEnjoyThread.content;
                          if (fullContent.startsWith('【') && fullContent.includes('】\n')) {
                            const parts = fullContent.split('】\n');
                            setEditTitle(parts[0].replace('【', ''));
                            setEditContent(parts[1] || '');
                          } else {
                            setEditTitle('');
                            setEditContent(fullContent);
                          }
                        }} className="text-blue-700 font-bold hover:underline text-xs cursor-pointer">[✏️ 編集]</button>
                      )}
                      <button onClick={(e) => handleDelete(selectedEnjoyThread.id, selectedEnjoyThread.handle, e)} className="text-red-600 font-bold hover:underline cursor-pointer">[トピック削除]</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-gray-300 bg-white p-5 rounded-lg space-y-4 shadow-xs overflow-hidden">
                <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="break-words">
                    {selectedEnjoyThread.content.startsWith('【') && selectedEnjoyThread.content.includes('】\n') 
                      ? selectedEnjoyThread.content.split('】\n')[0].replace('【', '') 
                      : selectedEnjoyThread.content.split('\n')[0]}
                  </div>
                </h2>

                <div className="space-y-3 overflow-hidden">
                  <div className="flex justify-between items-center text-gray-500 text-[11px] bg-gray-50 p-2 rounded flex-wrap gap-1">
                    <div>
                      <span className="font-bold text-gray-700 mr-1">投稿者: <b>{selectedEnjoyThread.author}</b></span>
                      <img 
                        src="https://flagcdn.com/jp.svg" 
                        alt="JP" 
                        className="w-4 h-3 inline-block shrink-0 border border-gray-200 align-middle ml-1 mr-1" 
                      />
                      <span>({selectedEnjoyThread.date})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => handleOpenTranslateModal(selectedEnjoyThread.content, e)} className="text-indigo-600 font-bold hover:underline cursor-pointer">✨ 翻訳</button>
                      {renderBookmarkStampButton(selectedEnjoyThread.id)}
                    </div>
                  </div>

                  {editingReplyKey === `reply-${selectedEnjoyThread.id}` ? (
                    <div className="space-y-2 p-3 bg-gray-50 border rounded">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">タイトル:</label>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 border rounded text-xs bg-white text-black" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">本文:</label>
                        <textarea rows={4} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-2 border rounded text-xs bg-white text-black" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingReplyKey(null)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs cursor-pointer">キャンセル</button>
                        <button onClick={() => handleSaveEdit(selectedEnjoyThread.id, selectedEnjoyThread.handle, true)} className="px-4 py-1 bg-emerald-700 text-white font-bold rounded text-xs cursor-pointer">編集を保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-gray-800 overflow-hidden break-words">
                      {renderContentWithEmbed(
                        selectedEnjoyThread.content.startsWith('【') && selectedEnjoyThread.content.includes('】\n')
                          ? selectedEnjoyThread.content.split('】\n')[1]
                          : selectedEnjoyThread.content
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={(e) => handleZVote(selectedEnjoyThread.id, 'like', e)} className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[11px] hover:bg-emerald-100 cursor-pointer">👍 推薦投票 ({selectedEnjoyThread.likes})</button>
                    <button onClick={(e) => handleZVote(selectedEnjoyThread.id, 'dislike', e)} className="px-3 py-1 bg-red-50 border border-red-300 text-red-800 rounded text-[11px] hover:bg-red-100 cursor-pointer">👎 反対投票 ({selectedEnjoyThread.dislikes})</button>
                  </div>
                </div>

                <ThreadChatSection
                  theme="enjoy"
                  parentThread={selectedEnjoyThread}
                  childPosts={enjoyThreadChildPosts}
                  account={account}
                  replyInputText={replyInputs[selectedEnjoyThread.id] || ''}
                  setReplyInputText={(val) => setReplyInputs({ ...replyInputs, [selectedEnjoyThread.id]: val })}
                  isSubmitting={isSubmitting}
                  handleReplySubmit={handleReplySubmit}
                  handleDelete={handleDelete}
                  handleOpenTranslateModal={handleOpenTranslateModal}
                  renderBookmarkStampButton={renderBookmarkStampButton}
                  renderMedia={props.renderMedia}
                  renderContentWithEmbed={renderContentWithEmbed}
                  setIsAuthModalOpen={setIsAuthModalOpen}
                  editingReplyKey={editingReplyKey}
                  setEditingReplyKey={setEditingReplyKey}
                  editContent={editContent}
                  setEditContent={setEditContent}
                  editMediaUrl={props.editMediaUrl}
                  setEditMediaUrl={props.setEditMediaUrl}
                  handleSaveEdit={handleSaveEdit}
                  blockedUsers={props.blockedUsers}
                  reportedPosts={props.reportedPosts}
                  banVotes={banVotes}
                  handleToggleBlock={handleToggleBlock}
                  handleReportPost={handleReportPost}
                  handleVoteBan={handleVoteBan}
                />

              </div>
            </div>
          ) : (
            <div className="space-y-4 overflow-hidden">
              <div className="text-gray-500 text-[11px]">enjoyモード &gt; <b>{currentCategory}</b></div>
              
              <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
                <h2 className="text-sm font-bold text-gray-800 truncate">
                  {isBookmarkView ? '🌟 お気に入りスタンプ一覧' : (currentCategory === '総合' || currentCategory === 'すべて') ? '総合スレッド一覧' : `カテゴリー: ${currentCategory}`}
                </h2>
                {account.isLoggedIn && (
                  <button 
                    onClick={() => setEnjoyViewMode('write')} 
                    className="bg-[#1b5e20] hover:bg-[#144517] text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer shadow shrink-0"
                  >
                    ✏️ 書き込み
                  </button>
                )}
              </div>

              <div className="border border-gray-300 rounded overflow-x-auto text-xs min-w-[600px]">
                <div className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700 grid grid-cols-12 p-2">
                  <div className="col-span-7">タイトル</div>
                  <div className="col-span-3">投稿者</div>
                  <div className="col-span-2 text-center">閲覧数 / 推薦</div>
                </div>

                <div className="divide-y divide-gray-200 bg-white">
                  {mainReplies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">トピックがありません。「書き込み」ボタンから投稿してください。</div>
                  ) : (
                    currentPaginatedReplies.map((reply) => {
                      const totalReplies = replies.filter(r => r.parentId === reply.id).length;
                      const titleText = reply.content.startsWith('【') && reply.content.includes('】\n')
                        ? reply.content.split('】\n')[0].replace('【', '')
                        : reply.content.split('\n')[0];

                      return (
                        <div 
                          key={reply.id} 
                          onClick={() => handleOpenEnjoyThread(reply)}
                          className="grid grid-cols-12 p-2.5 items-center hover:bg-emerald-50/40 transition cursor-pointer"
                        >
                          <div className="col-span-7 flex items-center justify-between truncate pr-2 font-bold text-blue-900">
                            <div className="flex items-center gap-2 truncate">
                              <img 
                                src="https://flagcdn.com/jp.svg" 
                                alt="JP" 
                                className="w-4 h-3 inline-block shrink-0 border border-gray-200 align-middle" 
                              />
                              <div className="truncate flex items-center">{titleText}</div>
                              <span className="text-[10px] text-gray-500 font-normal shrink-0">({totalReplies})</span>
                            </div>
                          </div>
                          <div className="col-span-3 text-gray-600 truncate">{reply.author}</div>
                          <div className="col-span-2 text-center text-gray-500 text-[11px]">
                            <span className="font-semibold text-gray-700">{reply.views || 0}</span> / {reply.likes || 0}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ページネーションボタン部分 */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-1 text-xs items-center flex-wrap">
                  <button 
                    onClick={() => setEnjoyCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={enjoyCurrentPage === 1}
                    className="px-2.5 py-1 bg-gray-200 rounded disabled:opacity-50 cursor-pointer"
                  >
                    前へ
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setEnjoyCurrentPage(pageNumber)}
                      className={`px-2.5 py-1 font-bold rounded cursor-pointer ${
                        enjoyCurrentPage === pageNumber 
                          ? 'bg-[#1b5e20] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button 
                    onClick={() => setEnjoyCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={enjoyCurrentPage === totalPages}
                    className="px-2.5 py-1 bg-gray-200 rounded disabled:opacity-50 cursor-pointer"
                  >
                    次へ
                  </button>
                  <span className="text-gray-500 ml-2">全 {mainReplies.length} 件 ({enjoyCurrentPage} / {totalPages} ページ)</span>
                </div>

                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                  className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs cursor-pointer shadow"
                >
                  Back to Top
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}