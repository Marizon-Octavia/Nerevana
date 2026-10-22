import { useState, useMemo } from 'react';
import { CatalogItem } from '../data/mockData';
import { AppUser } from '../types';
import { calculateDistanceMiles } from '../utils/procurement';
import {
  Search,
  SlidersHorizontal,
  Package,
  Clock,
  CheckCircle,
  Building,
  ShoppingCart,
  LayoutGrid,
  Table as TableIcon,
  X,
} from 'lucide-react';

interface BuyerCatalogProps {
  products: CatalogItem[];
  user: AppUser;
  onInitiateOrder: (product: CatalogItem) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  filterSupplierOrg?: string | null;
  onClearSupplierFilter?: () => void;
}

const CATEGORIES = [
  'All',
  'Stationery & Paper',
  'Lab & Science',
  'Classroom Tech',
  'Facility & Safety',
  'Cafeteria',
  'Sports & Physical Ed',
];

export default function BuyerCatalog({
  products,
  user,
  onInitiateOrder,
  selectedCategory,
  onSelectCategory,
  filterSupplierOrg,
  onClearSupplierFilter,
}: BuyerCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        if (filterSupplierOrg && item.supplierOrg !== filterSupplierOrg) {
          return false;
        }
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchOrg = item.supplierOrg.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchOrg && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return b.rating - a.rating;
      });
  }, [products, filterSupplierOrg, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="w-full space-y-4">
      {/* Top Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-sky-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items, equipment, supplies or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Supplier Filter Badge if active */}
        {filterSupplierOrg && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-800 font-medium">
            <span>Filtered by: {filterSupplierOrg}</span>
            <button
              onClick={onClearSupplierFilter}
              className="p-0.5 hover:bg-sky-200/50 rounded-xs"
              title="Clear vendor filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View mode toggle & Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'price-asc' | 'price-desc')}
            className="px-3 py-2 text-xs rounded-md border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-sky-400"
          >
            <option value="popular">Top Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          {/* Table / Grid switcher (for laptops & tablets) */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-md border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              title="Detailed Table View"
              className={`p-1.5 rounded-sm text-xs transition-colors ${
                viewMode === 'table' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              className={`p-1.5 rounded-sm text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Horizontal Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-slate-200 text-center">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No products match your criteria</h4>
          <p className="text-xs text-slate-400 mt-1">Try relaxing your search terms or category selection.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Optimal for procurement officers on tablets/laptops) */
        <div className="bg-white rounded-lg border border-sky-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Supplier &amp; Proximity</th>
                  <th className="py-3 px-4 text-center">MOQ / Stock</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((item) => {
                  const dist = calculateDistanceMiles(
                    { lat: user.lat, lng: user.lng },
                    { lat: item.lat, lng: item.lng }
                  );

                  return (
                    <tr key={item.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.title}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[150px]">
                          {item.supplierOrg}
                        </div>
                        <div className="text-[11px] text-sky-600 flex items-center gap-1 mt-0.5">
                          <span>{dist} miles away</span>
                          <span>•</span>
                          <span>{item.leadTimeDays}d lead</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-semibold text-slate-800">Min: {item.moq}</div>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          {item.inStock} in stock
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          ${item.price.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">per {item.unit}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onInitiateOrder(item)}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Order</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Mobile-first card responsive grid) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredProducts.map((item) => {
            const dist = calculateDistanceMiles(
              { lat: user.lat, lng: user.lng },
              { lat: item.lat, lng: item.lng }
            );

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg border border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.leadTimeDays}d lead
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="truncate">
                      <span className="font-medium text-slate-700 block truncate">
                        {item.supplierOrg}
                      </span>
                      <span className="text-[10px] text-sky-600">{dist} miles away</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-600 font-semibold block">
                        {item.inStock} avail
                      </span>
                      <span className="text-[10px] text-slate-400">MOQ: {item.moq}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-slate-900">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">/{item.unit}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInitiateOrder(item)}
                    className="py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
