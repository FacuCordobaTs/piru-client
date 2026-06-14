import { useEffect, useRef, useState } from 'react'
import { useGoogleMapsScript } from '@/hooks/useGoogleMapsScript'
import { cn } from '@/lib/utils'

interface AddressMapPreviewProps {
    lat?: number | null
    lng?: number | null
    address?: string
    className?: string
}

export function AddressMapPreview({ lat, lng, address, className }: AddressMapPreviewProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<google.maps.Map | null>(null)
    const markerRef = useRef<google.maps.Marker | null>(null)
    const isLoaded = useGoogleMapsScript()
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        lat != null && lng != null ? { lat, lng } : null
    )

    useEffect(() => {
        if (lat != null && lng != null) {
            setCoords({ lat, lng })
            return
        }
        if (!isLoaded || !address) return
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                const loc = results[0].geometry.location
                setCoords({ lat: loc.lat(), lng: loc.lng() })
            }
        })
    }, [isLoaded, lat, lng, address])

    useEffect(() => {
        if (!isLoaded || !mapRef.current || !coords) return

        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
                center: coords,
                zoom: 16,
                disableDefaultUI: true,
                gestureHandling: 'none',
                keyboardShortcuts: false,
                clickableIcons: false,
            })
            markerRef.current = new google.maps.Marker({
                position: coords,
                map: mapInstanceRef.current,
                animation: google.maps.Animation.DROP,
            })
        } else {
            mapInstanceRef.current.panTo(coords)
            markerRef.current?.setPosition(coords)
        }
    }, [isLoaded, coords])

    if (!coords && !address) return null

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-border shadow-sm',
                'animate-in fade-in slide-in-from-bottom-2 duration-300',
                className
            )}
        >
            <div ref={mapRef} className="w-full h-40" />
        </div>
    )
}
