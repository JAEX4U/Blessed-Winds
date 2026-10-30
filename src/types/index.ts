export interface UserData {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string;
  windBalance: number;
  gemBalance: number;
  level: number;
  xp: number;
  title: string;
  bio: string;
  blessingTier: string;
  equippedBadge: string;
  equippedAura: string;
  lastDailyClaim: string | null;
  streakDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  inventoryId: number;
  itemId: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  rarity: string;
  effectBonus: string;
  isEquipped: boolean;
  quantity: number;
  acquiredAt: string;
}

export interface QuestItem {
  id: number;
  questKey: string;
  title: string;
  description: string;
  rewardWinds: number;
  rewardGems: number;
  progress: number;
  target: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface TransactionItem {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export interface GameSessionItem {
  id: number;
  gameType: string;
  betWinds: number;
  payoutWinds: number;
  netProfit: number;
  score: number;
  details: string;
  createdAt: string;
}

export interface ShopItemData {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  priceWinds: number;
  priceGems: number;
  rarity: string;
  effectBonus: string;
  isFeatured: boolean;
}
