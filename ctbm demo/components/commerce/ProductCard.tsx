import { Product } from '@/lib/types';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-normal text-[10px] uppercase tracking-wider">
          {product.category}
        </Badge>
        <span className="text-[10px] text-slate-400 font-medium tracking-wide">Sponsored</span>
      </div>
      
      <h4 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
        {product.name}
      </h4>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">
        {product.description}
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
        <span className="font-bold text-slate-900">{product.priceRange}</span>
        
        <a 
          href="#"
          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View Deal <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
