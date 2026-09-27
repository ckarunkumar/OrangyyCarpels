import { X, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationInfo: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    ipAddress: string;
    userName: string;
  } | null;
}

export default function SystemLogsMapModal({ isOpen, onClose, locationInfo }: MapModalProps) {
  if (!isOpen || !locationInfo) return null;

  const { city, region, country, latitude, longitude, ipAddress, userName } = locationInfo;
  const locationLabel = [city, region, country].filter(Boolean).join(', ') || 'Unknown Location';
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';

  // Embeddable OpenStreetMap URL with bounding box
  const mapEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.05}%2C${latitude! - 0.05}%2C${longitude! + 0.05}%2C${latitude! + 0.05}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : null;

  const externalMapUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(locationLabel)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-studio-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-studio-border bg-studio-bg/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-studio-text leading-tight">Approximate Login Location</h3>
              <p className="text-[11px] text-studio-muted">{userName} • {ipAddress}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-studio-text flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-orange" />
              {locationLabel}
            </span>
            <a
              href={externalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-brand-orange hover:underline font-semibold flex items-center gap-1"
            >
              Open in Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="w-full h-56 rounded-lg overflow-hidden border border-studio-border bg-studio-bg flex items-center justify-center">
            {mapEmbedUrl ? (
              <iframe
                title="Login Map"
                src={mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
              />
            ) : (
              <div className="text-center p-6 text-studio-muted text-[12px]">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-studio-muted/40" />
                <p className="font-medium text-studio-text">{locationLabel}</p>
                <p className="text-[11px] text-studio-muted mt-1">Coordinates unavailable for local/private IP network.</p>
              </div>
            )}
          </div>

          {/* Non-exact location disclaimer */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-800">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Note:</strong> Location is approximate and derived from IP network routing. It does not represent an exact GPS device location.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-studio-bg/40 border-t border-studio-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-studio-border rounded-lg text-[12px] font-semibold text-studio-text hover:bg-studio-hover transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
