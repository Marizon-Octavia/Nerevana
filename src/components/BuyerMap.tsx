import { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { SupplierProfile } from '../data/mockData';
import { AppUser } from '../types';
import { calculateDistanceMiles } from '../utils/procurement';
import { CheckCircle2, Phone, Star, Package, Navigation, MapPin } from 'lucide-react';

interface BuyerMapProps {
  suppliers: SupplierProfile[];
  user: AppUser;
  onSelectSupplier: (supplier: SupplierProfile) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const CATEGORIES = [
  'All',
  'Stationery & Paper',
  'Lab & Science',
  'Classroom Tech',
  'Facility & Safety',
  'Sports & Physical Ed',
];

export default function BuyerMap({
  suppliers,
  user,
  onSelectSupplier,
  selectedCategory,
  onSelectCategory,
}: BuyerMapProps) {
  const [activeSupplier, setActiveSupplier] = useState<SupplierProfile | null>(null);

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyAijIX4EDQ2s3IpQH-ohym0wj78Kt0YFSQ';

  // Filter suppliers by category
  const filteredSuppliers = suppliers.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.categories.some((c) => c.toLowerCase().includes(selectedCategory.toLowerCase()));
  });

  const center = {
    lat: user.lat || 40.7306,
    lng: user.lng || -73.9352,
  };

  return (
    <div className="relative w-full h-full flex flex-col min-h-[480px] md:min-h-[580px] rounded-lg overflow-hidden border border-sky-100 shadow-sm bg-white">
      {/* Category filter pills floating on top of map */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-md shadow-xs transition-all ${
              selectedCategory === cat
                ? 'bg-sky-600 text-white font-semibold'
                : 'bg-white/95 text-slate-700 hover:bg-white border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Google Map Container */}
      <div className="w-full h-[460px] md:h-[540px] relative">
        <APIProvider apiKey={apiKey}>
          <Map
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            mapId="DEMO_MAP_ID"
            defaultCenter={center}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: '100%', height: '100%' }}
          >
            {/* School Buyer's own Location Marker */}
            <AdvancedMarker
              position={center}
              title={`Your School: ${user.organization}`}
            >
              <div className="flex flex-col items-center">
                <div className="bg-sky-600 text-white p-2 rounded-md shadow-md ring-2 ring-sky-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold bg-white text-slate-800 px-1.5 py-0.5 rounded-xs shadow mt-1 whitespace-nowrap">
                  {user.organization || 'My School'}
                </span>
              </div>
            </AdvancedMarker>

            {/* Supplier Pins */}
            {filteredSuppliers.map((supp) => {
              const distance = calculateDistanceMiles(
                { lat: center.lat, lng: center.lng },
                { lat: supp.lat, lng: supp.lng }
              );

              return (
                <AdvancedMarker
                  key={supp.id}
                  position={{ lat: supp.lat, lng: supp.lng }}
                  onClick={() => setActiveSupplier(supp)}
                  title={supp.organization}
                >
                  <Pin
                    background="#0284c7"
                    borderColor="#0369a1"
                    glyphColor="#ffffff"
                    scale={1.05}
                  />
                </AdvancedMarker>
              );
            })}

            {/* Active Supplier InfoWindow */}
            {activeSupplier && (
              <InfoWindow
                position={{ lat: activeSupplier.lat, lng: activeSupplier.lng }}
                onCloseClick={() => setActiveSupplier(null)}
              >
                <div className="p-1 max-w-[240px] text-slate-800">
                  <div className="flex items-center gap-1 text-sky-700 text-[11px] font-semibold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Verified Edu Supplier</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-tight">
                    {activeSupplier.organization}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {activeSupplier.address}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-500" />
                      <span>{activeSupplier.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Navigation className="w-3 h-3 text-sky-600" />
                      <span>
                        {calculateDistanceMiles(
                          { lat: center.lat, lng: center.lng },
                          { lat: activeSupplier.lat, lng: activeSupplier.lng }
                        )}{' '}
                        mi
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSupplier(activeSupplier);
                        setActiveSupplier(null);
                      }}
                      className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <Package className="w-3 h-3" />
                      <span>View Catalog ({activeSupplier.itemCount})</span>
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Supplier Quick Cards Carousel at bottom of map for fast mobile tapping */}
      <div className="p-3 bg-slate-50/90 border-t border-sky-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700">
            Nearby Verified Suppliers ({filteredSuppliers.length})
          </span>
          <span className="text-[11px] text-slate-500">Tap pin or card to inspect</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {filteredSuppliers.map((supp) => {
            const distance = calculateDistanceMiles(
              { lat: center.lat, lng: center.lng },
              { lat: supp.lat, lng: supp.lng }
            );

            return (
              <div
                key={supp.id}
                onClick={() => onSelectSupplier(supp)}
                className="flex-shrink-0 w-64 p-3 bg-white rounded-md border border-slate-200/90 hover:border-sky-300 shadow-xs cursor-pointer transition-all hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-1">
                  <h5 className="font-semibold text-xs text-slate-900 truncate">
                    {supp.organization}
                  </h5>
                  <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-xs">
                    {distance} mi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{supp.address}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span className="text-slate-600 font-medium">{supp.deliveryTime}</span>
                  <span className="text-sky-700 font-semibold">Browse &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
