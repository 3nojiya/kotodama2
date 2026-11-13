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

// ★ 「すべて」を削除し、純粋なカテゴリーのみのリストに変更
export const ENJOY_CATEGORIES = [
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
  // --- 主要・日本語周辺 ---
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'en', label: '英語 (English)' },
  { code: 'ko', label: '韓国語 (Korean)' },
  { code: 'zh-CN', label: '中国語（簡体字） (Chinese Simplified)' },
  { code: 'zh-TW', label: '中国語（繁体字） (Chinese Traditional)' },

  // --- アジア・オセアニア ---
  { code: 'hi', label: 'ヒンディー語 (Hindi)' },
  { code: 'id', label: 'インドネシア語 (Indonesian)' },
  { code: 'ms', label: 'マレー語 (Malay)' },
  { code: 'th', label: 'タイ語 (Thai)' },
  { code: 'vi', label: 'ベトナム語 (Vietnamese)' },
  { code: 'tl', label: 'タガログ語 / フィリピノ語 (Filipino)' },
  { code: 'my', label: 'ビルマ語 (Burmese)' },
  { code: 'km', label: 'クメール語 (Khmer)' },
  { code: 'lo', label: 'ラオス語 (Lao)' },
  { code: 'bn', label: 'ベンガル語 (Bengali)' },
  { code: 'ta', label: 'タミル語 (Tamil)' },
  { code: 'te', label: 'テルグ語 (Telugu)' },
  { code: 'mr', label: 'マラーティー語 (Marathi)' },
  { code: 'gu', label: 'グジャラート語 (Gujarati)' },
  { code: 'kn', label: 'カンナダ語 (Kannada)' },
  { code: 'ml', label: 'マラヤーラム語 (Malayalam)' },
  { code: 'si', label: 'シンハラ語 (Sinhala)' },
  { code: 'ne', label: 'ネパール語 (Nepali)' },
  { code: 'ur', label: 'ウルドゥー語 (Urdu)' },
  { code: 'pa', label: 'パンジャーブ語 (Punjabi)' },
  { code: 'mn', label: 'モンゴル語 (Mongolian)' },

  // --- ヨーロッパ ---
  { code: 'es', label: 'スペイン語 (Spanish)' },
  { code: 'fr', label: 'フランス語 (French)' },
  { code: 'de', label: 'ドイツ語 (German)' },
  { code: 'it', label: 'イタリア語 (Italian)' },
  { code: 'pt', label: 'ポルトガル語 (Portuguese)' },
  { code: 'ru', label: 'ロシア語 (Russian)' },
  { code: 'uk', label: 'ウクライナ語 (Ukrainian)' },
  { code: 'pl', label: 'ポーランド語 (Polish)' },
  { code: 'nl', label: 'オランダ語 (Dutch)' },
  { code: 'sv', label: 'スウェーデン語 (Swedish)' },
  { code: 'no', label: 'ノルウェー語 (Norwegian)' },
  { code: 'da', label: 'デンマーク語 (Danish)' },
  { code: 'fi', label: 'フィンランド語 (Finnish)' },
  { code: 'el', label: 'ギリシャ語 (Greek)' },
  { code: 'hu', label: 'ハンガリー語 (Hungarian)' },
  { code: 'cs', label: 'チェコ語 (Czech)' },
  { code: 'ro', label: 'ルーマニア語 (Romanian)' },
  { code: 'bg', label: 'ブルガリア語 (Bulgarian)' },
  { code: 'hr', label: 'クロアチア語 (Croatian)' },
  { code: 'sr', label: 'セルビア語 (Serbian)' },
  { code: 'sk', label: 'スロバキア語 (Slovak)' },
  { code: 'sl', label: 'スロベニア語 (Slovenian)' },
  { code: 'et', label: 'エストニア語 (Estonian)' },
  { code: 'lv', label: 'ラトビア語 (Latvian)' },
  { code: 'lt', label: 'リトアニア語 (Lithuanian)' },
  { code: 'sq', label: 'アルバニア語 (Albanian)' },
  { code: 'mk', label: 'マケドニア語 (Macedonian)' },
  { code: 'bs', label: 'ボスニア語 (Bosnian)' },
  { code: 'is', label: 'アイスランド語 (Icelandic)' },
  { code: 'ga', label: 'アイルランド語 (Irish)' },
  { code: 'cy', label: 'ウェールズ語 (Welsh)' },
  { code: 'mt', label: 'マルタ語 (Maltese)' },
  { code: 'eu', label: 'バスク語 (Basque)' },
  { code: 'gl', label: 'ガリシア語 (Galician)' },
  { code: 'ca', label: 'カタルーニャ語 (Catalan)' },
  { code: 'la', label: 'ラテン語 (Latin)' },

  // --- 中東・アフリカ ---
  { code: 'ar', label: 'アラビア語 (Arabic)' },
  { code: 'fa', label: 'ペルシャ語 (Persian)' },
  { code: 'tr', label: 'トルコ語 (Turkish)' },
  { code: 'he', label: 'ヘブライ語 (Hebrew)' },
  { code: 'am', label: 'アムハラ語 (Amharic)' },
  { code: 'sw', label: 'スワヒリ語 (Swahili)' },
  { code: 'ha', label: 'ハウサ語 (Hausa)' },
  { code: 'yo', label: 'ヨルバ語 (Yoruba)' },
  { code: 'ig', label: 'イボ語 (Igbo)' },
  { code: 'zu', label: 'ズールー語 (Zulu)' },
  { code: 'xh', label: 'コサ語 (Xhosa)' },
  { code: 'so', label: 'ソマリア語 (Somali)' },
  { code: 'az', label: 'アゼルバイジャン語 (Azerbaijani)' },
  { code: 'ka', label: 'ジョージア語 (Georgian)' },
  { code: 'hy', label: 'アルメニア語 (Armenian)' },
  { code: 'kk', label: 'カザフ語 (Kazakh)' },
  { code: 'uz', label: 'ウズベク語 (Uzbek)' },
  { code: 'ky', label: 'キルギス語 (Kyrgyz)' },
  { code: 'tk', label: 'トルクメン語 (Turkmen)' },
  { code: 'ps', label: 'パシュトゥー語 (Pashto)' },
  { code: 'ku', label: 'クルド語 (Kurdish)' },
];