"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation, Save, X } from 'lucide-react';

interface LocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number } | null) => void;
    initialLocation?: { lat: number; lng: number } | null;
}

const DEFAULT_CENTER = { lat: 27.7172, lng: 85.3240 }; // Kathmandu

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [marker, setMarker] = useState<google.maps.Marker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number, address?: string } | null>(initialLocation || null);

    useEffect(() => {
        const loadGoogleMaps = () => {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
            if (!apiKey) {
                setError("Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.");
                setIsLoading(false);
                return;
            }

            if (window.google && window.google.maps) {
                if (typeof window.google.maps.Map === 'function') {
                    initMap();
                    return;
                }
            }

            // Check if script already exists but hasn't finished loading
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src.includes('maps.googleapis.com/maps/api/js')) {
                    scripts[i].addEventListener('load', () => initMap());
                    return;
                }
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => initMap();
            script.onerror = () => {
                setError("Failed to load Google Maps");
                setIsLoading(false);
            };
            document.head.appendChild(script);
        };

        const initMap = () => {
            if (!mapRef.current) return;

            const center = initialLocation || DEFAULT_CENTER;
            const newMap = new google.maps.Map(mapRef.current, {
                center,
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });

            const newMarker = new google.maps.Marker({
                position: center,
                map: newMap,
                draggable: true,
                animation: google.maps.Animation.DROP,
            });

            setMap(newMap);
            setMarker(newMarker);
            setIsLoading(false);

            // Add search box
            if (searchInputRef.current) {
                const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current);
                autocomplete.bindTo('bounds', newMap);
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (!place.geometry || !place.geometry.location) return;

                    if (place.geometry.viewport) {
                        newMap.fitBounds(place.geometry.viewport);
                    } else {
                        newMap.setCenter(place.geometry.location);
                        newMap.setZoom(17);
                    }
                    newMarker.setPosition(place.geometry.location);
                    updateLocation(place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address);
                });
            }

            // Marker drag end listener
            newMarker.addListener('dragend', () => {
                const position = newMarker.getPosition();
                if (position) {
                    updateLocation(position.lat(), position.lng());
                }
            });

            // Map click listener
            newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    newMarker.setPosition(e.latLng);
                    updateLocation(e.latLng.lat(), e.latLng.lng());
                }
            });
        };

        const updateLocation = async (lat: number, lng: number, manualAddress?: string) => {
            let address = manualAddress;

            if (!address) {
                try {
                    const geocoder = new google.maps.Geocoder();
                    const response = await geocoder.geocode({ location: { lat, lng } });
                    if (response.results && response.results[0]) {
                        address = response.results[0].formatted_address;
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                }
            }

            // Fallback: Ensure address is NEVER undefined/empty for Firestore
            const safeAddress = address || `Pinned: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setSelectedLocation({ lat, lng, address: safeAddress });
        };

        loadGoogleMaps();
    }, [initialLocation]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                if (map && marker) {
                    map.setCenter(pos);
                    map.setZoom(17);
                    marker.setPosition(pos);
                    // This will trigger the updateLocation internal logic if we call it directly, 
                    // but we can't access updateLocation from here due to scope. 
                    // Instead, we can just fetch address here.
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ location: pos }).then((response) => {
                        if (response.results && response.results[0]) {
                            setSelectedLocation({ ...pos, address: response.results[0].formatted_address });
                        } else {
                            setSelectedLocation(pos);
                        }
                    }).catch(() => setSelectedLocation(pos));
                }
            },
            () => {
                alert("Error: The Geolocation service failed.");
            }
        );
    };

    const handleSave = () => {
        setIsSaving(true);
        onLocationSelect(selectedLocation);
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleClear = () => {
        onLocationSelect(null);
        setSelectedLocation(null);
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="relative group">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                <div
                    ref={mapRef}
                    className="w-full h-[250px] md:h-[300px]"
                />

                {isLoading && (
                    <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="h-8 w-8 border-3 border-green-600/20 border-t-green-600 rounded-full animate-spin" />
                    </div>
                )}

                <button
                    onClick={handleGetCurrentLocation}
                    type="button"
                    className="absolute bottom-4 right-4 bg-white p-2.5 rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-green-600 transition-colors z-10 active:scale-95"
                    title="Use current location"
                >
                    <Navigation className="h-5 w-5" />
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={!selectedLocation || isSaving}
                    type="button"
                    className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-all shadow-md shadow-green-900/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : selectedLocation ? "Confirm Location" : "Save Location"}
                </button>
                {selectedLocation && (
                    <button
                        onClick={handleClear}
                        type="button"
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {selectedLocation && (
                <div className="bg-green-50/50 p-2.5 rounded-lg border border-green-100/50 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <p className="text-xs font-bold text-green-800">Selected Location</p>
                    </div>
                    <p className="text-[10px] text-green-700 pl-5.5 leading-relaxed">
                        {selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
