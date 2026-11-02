export interface Reply {
  id: number;
  author: string;
  handle: string;
  date: string;
  content: string;
  translatedContent?: string;
  targetLang?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  lang: string;
  likes: number;
  dislikes: number;
  targetMode: string;
  category?: string;
  parentId: number | null;
  repostCount?: number;
  updatedAt?: string;
  views?: number;
}

export interface UserAccount {
  isLoggedIn: boolean;
  name: string;
  handle: string;
  avatarChar: string;
}

// エンジョイコリアのカテゴリをベースにした「全モード共通のカテゴリー一覧」（「雑談」を先頭に追加）
export const ENJOY_CATEGORIES = [
  'すべて',
  '雑談',
  'HOT! テーマトーク',
  '旅行・観光・風景',
  '歌手・ミュージシャン',
  'K-POP',
  'J-POP',
  '芸能・タレント',
  '映画',
  '韓国ドラマ',
  '日本ドラマ',
  '生活・文化',
  'ファッション・コスメ',
  'ニュース・経済',
  'スポーツ',
  'ユーモア',
  'ゲーム',
  'マンガ・アニメ',
  'PC・インターネット',
  'カメラ',
  'ケータイ・電化製品',
  '伝統文化・伝統芸能',
];

// 多言語翻訳用などの言語リスト
export const LANGUAGES = [
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ko', label: '韓国語 (Korean)' },
  { code: 'en', label: '英語 (English)' },
  { code: 'zh', label: '中国語 (Chinese)' },
  { code: 'es', label: 'スペイン語 (Spanish)' },
  { code: 'fr', label: 'フランス語 (French)' },
  { code: 'de', label: 'ドイツ語 (German)' },
  { code: 'pt', label: 'ポルトガル語 (Portuguese)' },
  { code: 'ru', label: 'ロシア語 (Russian)' },
];