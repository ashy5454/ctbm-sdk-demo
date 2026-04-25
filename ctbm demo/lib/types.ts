import type { ClassificationResult, Zone } from '@ctbm/core';

export interface Product {
  name: string;
  description: string;
  priceRange: string;
  category: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  zone: Zone;
  debugResult?: ClassificationResult;
  products?: Product[];
  showCCIPrompt?: boolean;
  timestamp: Date;
}
