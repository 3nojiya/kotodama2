// app/components/shared/ThreadChatSection.tsx
'use client';

import React, { useState } from 'react';
import { PostForm } from './PostForm';

interface ThreadChatSectionProps {
  theme: 'channel' | 'enjoy' | 'z';
  parentThread: any;
  childPosts: any[];
  account: any;
  replyInputText: string;
  setReplyInputText: (val: string) => void;
  isSubmitting: boolean;
  handleReplySubmit: (parentId: number, text?: string) => void;
  handleDelete: (id: number, handle: string | undefined, e: React.MouseEvent) => void;
  handleOpenTranslateModal: (text: string, e: React.MouseEvent) => void;
  renderBookmarkStampButton: (replyId: number) => React.ReactNode;
  renderMedia?: (url: string) => React.ReactNode;
  renderContentWithEmbed: (content: string) => React.ReactNode;
  setIsAuthModalOpen: (val: boolean) => void;
  editingReplyKey?: string | null;
  setEditingReplyKey?: (key: string | null) => void;
  editContent?: string;
  setEditContent?: (content: string) => void;
  editMediaUrl?: string;
  setEditMediaUrl?: (url: string) => void;
  handleSaveEdit?: (id: number, handle: string | undefined, isThread: boolean) => void;
  // ▼ 追加：自治機能用プロパティ
  blockedUsers?: string[];
  reportedPosts?: number[];
  banVotes?: Record<string, { count: number; voters: string[] }>;
  handleToggleBlock?: (handle: string) => void;
  handleReportPost?: (postId: number) => void;
  handleVoteBan?: (targetHandle: string) => void;
}

export default function ThreadChatSection(props: ThreadChatSectionProps) {
  const {
    theme,
    parentThread,
    childPosts,
    account,
    isSubmitting,
    handleReplySubmit,
    handleDelete,
    handleOpenTranslateModal,
    renderBookmarkStampButton,
    renderMedia,
    renderContentWithEmbed,
    setIsAuthModalOpen,
    editingReplyKey,
    setEditingReplyKey,
    editContent = '',
    setEditContent,
    editMediaUrl = '',
    setEditMediaUrl,
    handleSaveEdit,
    // ▼ 追加：自治機能の受け取り
    handleToggleBlock,
    handleReportPost,
    handleVoteBan,
    banVotes,
  } = props;

  // どのメッセージに対して返信フォームが開いているかを管理（メッセージIDを保持）
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  // 個別返信フォーム内の入力テキスト
  const [inlineReplyText, setInlineReplyText] = useState('');
  // ▼ 追加：どのレスの自治メニューが開いているかを管理するID
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);

  let wrapperStyle = "space-y-4 p-4 bg-sky-50/50 border border-sky-100 rounded-2xl shadow-sm";
  let childBoxStyle = "p-3 bg-white border border-gray-200 rounded-xl space-y-2 shadow-sm";
  
  if (theme === 'enjoy') {
    wrapperStyle = "space-y-4 pt-4 border-t border-gray-200";
    childBoxStyle = "p-3 bg-gray-50 border border-gray-200 rounded space-y-1 text-xs";
  } else if (theme === 'channel') {
    wrapperStyle = "space-y-3 pt-2 font-mono text-xs";
    childBoxStyle = "border-b border-gray-200 pb-3 space-y-1";
  }

  return (
    <div className={wrapperStyle}>
      <div className="font-bold text-xs flex items-center justify-between border-b pb-2 border-gray-200">
        <span className={theme === 'z' ? 'text-sky-700 font-bold' : ''}>💬 スレッド会話・チャット ({childPosts.length}件)</span>
      </div>

      <div className="space-y-3">
        {childPosts.length === 0 ? (
          <div className="text-gray-400 text-xs py-2 text-center">
            まだメッセージはありません。最初のチャットを書き込んでみましょう！
          </div>
        ) : (
          childPosts.map((child, idx) => {
            const isMyPost = account.isLoggedIn && account.handle === child.handle;
            const isEditing = editingReplyKey === `reply-${child.id}`;
            const isReplyingThis = activeReplyId === child.id;

            return (
              <div key={child.id} className={childBoxStyle}>
                
                {/* ▼ Zモードのときだけ専用レイアウト、それ以外は従来のレイアウトを適用 */}
                {theme === 'z' ? (
                  /* 【Zモード専用】丸いアカウントアイコン・国旗・名前・日時が左、ボタン類が右に1行で綺麗に収まる構成 */
                  <div className="flex items-center justify-between text-[11px] text-gray-500 gap-2 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                      <b className="text-sky-600 shrink-0">{idx + 1}.</b>

                      {/* 丸いアカウントアイコン */}
                      {child.avatarUrl ? (
                        <img 
                          src={child.avatarUrl} 
                          alt={child.author || 'Avatar'} 
                          className="w-4 h-4 rounded-full object-cover shrink-0 border border-gray-200 align-middle shadow-xs" 
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-sky-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 align-middle">
                          {(child.author || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* 国旗アイコン */}
                      <img 
                        src="https://flagcdn.com/jp.svg" 
                        alt="JP" 
                        className="w-4 h-3 shrink-0 border border-gray-200 align-middle" 
                      />

                      <span className="font-bold text-gray-900 shrink-0">{child.author}</span>
                      <span className="text-gray-400 truncate">[{child.date}]</span>
                      {child.mediaUrl && (
                        <span className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-sky-200 shrink-0">
                          🔗 メディア付
                        </span>
                      )}
                    </div>

                    {/* 右側のボタン群（返信・翻訳・お気に入り・自治） */}
                    <div className="flex items-center gap-2 text-[11px] shrink-0">
                      <button
                        onClick={() => {
                          if (isReplyingThis) {
                            setActiveReplyId(null);
                          } else {
                            setActiveReplyId(child.id);
                            const handleName = child.handle ? (child.handle.startsWith('@') ? child.handle : `@${child.handle}`) : `@${child.author}`;
                            setInlineReplyText(`${handleName} `);
                          }
                        }}
                        className="text-sky-600 hover:underline cursor-pointer font-bold bg-sky-50 px-2 py-0.5 rounded-full"
                      >
                        💬 返信
                      </button>

                      {isMyPost && setEditingReplyKey && !isEditing && (
                        <button
                          onClick={() => {
                            setEditingReplyKey(`reply-${child.id}`);
                            if (setEditContent) setEditContent(child.content);
                            if (setEditMediaUrl) setEditMediaUrl(child.mediaUrl || '');
                          }}
                          className="text-sky-600 hover:underline cursor-pointer font-medium"
                        >
                          [編集]
                        </button>
                      )}

                      <button
                        onClick={(e) => handleOpenTranslateModal(child.content, e)}
                        className="text-indigo-600 font-bold hover:underline cursor-pointer bg-indigo-50 px-2 py-0.5 rounded-full"
                      >
                        ✨ 翻訳
                      </button>

                      {isMyPost && (
                        <button
                          onClick={(e) => handleDelete(child.id, child.handle, e)}
                          className="text-red-500 font-bold hover:underline cursor-pointer"
                        >
                          [削除]
                        </button>
                      )}

                      {renderBookmarkStampButton(child.id)}

                      {child.handle !== account?.handle && (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuPostId(openMenuPostId === child.id ? null : child.id);
                            }}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>自治</span>
                            <span className="text-[10px]">▾</span>
                          </button>

                          {openMenuPostId === child.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 py-1.5 text-sm font-bold text-gray-800 divide-y divide-gray-100"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleBlock?.(child.handle);
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
                                  handleReportPost?.(child.id);
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
                                  handleVoteBan?.(child.handle);
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 hover:text-sky-600 transition-colors flex justify-between items-center cursor-pointer"
                              >
                                <span className="flex items-center gap-2.5">
                                  <span className="text-base">🗳️</span>
                                  <span>出禁投票</span>
                                </span>
                                <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-black">
                                  {banVotes?.[child.handle?.replace(/^@+/, '')]?.count || 0}票
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 【その他のモード（チャンネル・エンジョイ等）】従来の表示形式 */
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 border-b border-gray-100 pb-2">
                    <b className={theme === 'channel' ? 'text-green-800' : 'text-sky-600'}>
                      {idx + 1}.
                    </b>
                    <img src="https://flagcdn.com/jp.svg" alt="JP" className="w-4 h-3 inline-block shrink-0 border border-gray-200 align-middle" />
                    <span className="font-bold text-gray-900">{child.author}</span>
                    <span className="text-gray-400">[{child.date}]</span>
                  </div>
                )}

                {/* 編集モード */}
                {isEditing && setEditContent && handleSaveEdit ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 outline-none focus:bg-white resize-y min-h-[80px] max-h-[400px]"
                    />
                    {setEditMediaUrl && (
                      <input
                        type="text"
                        value={editMediaUrl}
                        onChange={(e) => setEditMediaUrl(e.target.value)}
                        placeholder="メディアURL..."
                        className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900"
                      />
                    )}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingReplyKey && setEditingReplyKey(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleSaveEdit(child.id, child.handle, false)}
                        className="px-4 py-1 bg-sky-500 text-white font-bold rounded-full text-xs shadow"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed text-gray-900">
                    {renderContentWithEmbed(child.content)}
                  </div>
                )}

                {child.mediaUrl && renderMedia && renderMedia(child.mediaUrl)}

                {/* 各メッセージの直下にポップアップするチャット風の返信フォーム欄 */}
                {isReplyingThis && (
                  <div className="mt-3 pl-4 border-l-2 border-sky-400 bg-sky-50/80 p-3 rounded-r-xl space-y-2 animate-fadeIn">
                    <div className="text-[11px] font-bold text-sky-700 flex justify-between items-center">
                      <span>💬 @{child.author} さんへ返信中</span>
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded"
                      >
                        ✕ 閉じる
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={inlineReplyText}
                      onChange={(e) => setInlineReplyText(e.target.value)}
                      placeholder="返信内容を入力..."
                      className="w-full p-2.5 bg-white border border-sky-300 rounded-xl text-xs text-gray-900 outline-none focus:border-sky-500 resize-y min-h-[80px] max-h-[300px] shadow-inner"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-bold cursor-pointer"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting || !inlineReplyText.trim()}
                        onClick={() => {
                          handleReplySubmit(parentThread.id, inlineReplyText);
                          setActiveReplyId(null);
                          setInlineReplyText('');
                        }}
                        className="px-4 py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full text-xs shadow disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? '送信中...' : '返信する 🚀'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* スレッド最下部の通常新規返信フォーム */}
      <PostForm
        theme={theme}
        account={account}
        parentId={parentThread.id}
        newComment={props.replyInputText}
        setNewComment={props.setReplyInputText}
        isSubmitting={isSubmitting}
        onSubmit={(e) => {
          e.preventDefault();
          handleReplySubmit(parentThread.id, props.replyInputText);
        }}
      />
    </div>
  );
}