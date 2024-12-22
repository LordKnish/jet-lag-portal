import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { Layer, Coordinate, CircleData } from '../../types/map'

interface MoveToolProps {
  activeTool: string | null
  selectedObject: Layer | null
  onUpdateObject: (id: string, newData: Coordinate[] | CircleData | null) => void
  boundary?: [number, number][] // The outer game boundary, array of [lat, lng]
}

const MoveTool: React.FC<MoveToolProps> = ({
  activeTool,
  selectedObject,
  onUpdateObject,
  boundary = [],
}) => {
  const map = useMap()
  const layerRef = useRef<L.Circle | L.Polygon | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const ghostRef = useRef<L.Circle | L.Polygon | null>(null)

  // Keep track of the last valid center (so we can revert if out of boundary)
  const lastValidCenterRef = useRef<L.LatLng | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  /**
   * Simple "point in polygon" check using ray-casting.
   */
  const isPointInPolygon = (point: L.LatLng, polygon: [number, number][]): boolean => {
    const x = point.lng
    const y = point.lat
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1]
      const yi = polygon[i][0]
      const xj = polygon[j][1]
      const yj = polygon[j][0]

      const intersect =
        (yi > y) !== (yj > y) &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
      if (intersect) {
        inside = !inside
      }
    }

    return inside
  }

  /**
   * Checks whether a circle’s center is inside the boundary polygon.
   */
  const isCircleCenterInsideBoundary = (
    center: L.LatLng,
    boundaryPolygon: [number, number][]
  ): boolean => {
    return isPointInPolygon(center, boundaryPolygon)
  }

  /**
   * For polygons, we’ll just check if the bounding-box center is inside boundary.
   * This allows edges to cross outside as long as center is within.
   */
  const isPolygonCenterInsideBoundary = (
    latLngs: L.LatLng[],
    boundaryPolygon: [number, number][]
  ): boolean => {
    const bounds = L.latLngBounds(latLngs)
    const center = bounds.getCenter()
    return isPointInPolygon(center, boundaryPolygon)
  }

  // Our custom "move" icon
  const moveIcon = L.divIcon({
    html: `
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
          color: black;
        "
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" 
             width="16" height="16" fill="none" stroke="currentColor" 
             stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
          <line x1="128" y1="176" x2="128" y2="80" />
          <line x1="80" y1="128" x2="176" y2="128" />
          <polyline points="112 104 128 88 144 104" />
          <polyline points="144 152 128 168 112 152" />
        </svg>
      </div>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  useEffect(() => {
    if (activeTool !== 'move' || !selectedObject) {
      setShowTooltip(false)
      return
    }

    // Clear existing shapes/markers
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (markerRef.current) {
      map.removeLayer(markerRef.current)
      markerRef.current = null
    }
    if (ghostRef.current) {
      map.removeLayer(ghostRef.current)
      ghostRef.current = null
    }

    let layer: L.Circle | L.Polygon | null = null
    let centerLatLng: L.LatLng | null = null

    // Create the base shape
    if (selectedObject.type === 'circle') {
      const circleData = selectedObject.data as CircleData
      layer = L.circle([circleData.center[0], circleData.center[1]], {
        radius: circleData.radius,
        color: selectedObject.color || '#3388ff',
        weight: 2,
        fillOpacity: 0.4,
      })
      centerLatLng = L.latLng(circleData.center[0], circleData.center[1])
    } else if (selectedObject.type === 'polygon' || selectedObject.type === 'rectangle') {
      const coords = selectedObject.data as Coordinate[]
      layer = L.polygon(
        coords.map(([lat, lng]) => [lat, lng]),
        {
          color: selectedObject.color || '#3388ff',
          weight: 2,
          fillOpacity: 0.4,
        }
      )
      centerLatLng = layer.getBounds().getCenter()
    }

    if (!layer || !centerLatLng) {
      return
    }

    layer.addTo(map)
    layerRef.current = layer

    // Store the last valid center
    lastValidCenterRef.current = centerLatLng

    const marker = L.marker(centerLatLng, { draggable: true, icon: moveIcon }).addTo(map)
    markerRef.current = marker
    setShowTooltip(true)

    let ghostShape: L.Circle | L.Polygon | null = null

    marker.on('dragstart', () => {
      if (layer instanceof L.Circle) {
        ghostShape = L.circle(layer.getLatLng(), {
          radius: layer.getRadius(),
          color: '#666',
          dashArray: '4',
          weight: 2,
          fillOpacity: 0.1,
        })
      } else if (layer instanceof L.Polygon) {
        const latLngs = layer.getLatLngs()[0] as L.LatLng[]
        ghostShape = L.polygon(latLngs, {
          color: '#666',
          dashArray: '4',
          weight: 2,
          fillOpacity: 0.1,
        })
      }
      if (ghostShape) {
        ghostShape.addTo(map)
        ghostRef.current = ghostShape
      }
    })

    // While dragging, move the ghost shape + boundary-check
    marker.on('drag', () => {
      if (!ghostShape) {
        return
      }
      const currentCenter = marker.getLatLng()

      if (ghostShape instanceof L.Circle && layer instanceof L.Circle) {
        ghostShape.setLatLng(currentCenter)
        const inside = isCircleCenterInsideBoundary(currentCenter, boundary)
        ghostShape.setStyle({
          color: inside ? '#666' : '#ff0000',
          fillColor: inside ? '#666' : '#ff0000',
        })
      } else if (ghostShape instanceof L.Polygon && layer instanceof L.Polygon) {
        const oldCenter = lastValidCenterRef.current!
        const dx = currentCenter.lat - oldCenter.lat
        const dy = currentCenter.lng - oldCenter.lng
        const originalLatLngs = layer.getLatLngs()[0] as L.LatLng[]
        const movedLatLngs = originalLatLngs.map(
          (p) => L.latLng(p.lat + dx, p.lng + dy)
        )
        ghostShape.setLatLngs([movedLatLngs])

        // Check if the bounding-box center is inside boundary
        const inside = isPolygonCenterInsideBoundary(movedLatLngs, boundary)
        ghostShape.setStyle({
          color: inside ? '#666' : '#ff0000',
          fillColor: inside ? '#666' : '#ff0000',
        })
      }
    })

    // When dropping the shape, finalize or revert
    marker.on('dragend', () => {
      if (!ghostShape) {
        return
      }
      const dropCenter = marker.getLatLng()

      let isInside = true

      if (layer instanceof L.Circle && ghostShape instanceof L.Circle) {
        // Circle case - just check center
        isInside = isCircleCenterInsideBoundary(dropCenter, boundary)
        if (isInside) {
          layer.setLatLng(dropCenter)
          const radius = layer.getRadius()
          onUpdateObject(selectedObject.id, { center: [dropCenter.lat, dropCenter.lng], radius })
          lastValidCenterRef.current = dropCenter
        }
      } else if (layer instanceof L.Polygon && ghostShape instanceof L.Polygon) {
        const oldCenter = lastValidCenterRef.current!
        const dx = dropCenter.lat - oldCenter.lat
        const dy = dropCenter.lng - oldCenter.lng
        const latLngs = layer.getLatLngs()[0] as L.LatLng[]
        const newCoords = latLngs.map((p) => [p.lat + dx, p.lng + dy]) as Coordinate[]

        const ghostLatLngs = ghostShape.getLatLngs()[0] as L.LatLng[]
        isInside = isPolygonCenterInsideBoundary(ghostLatLngs, boundary)

        if (isInside) {
          layer.setLatLngs(newCoords)
          onUpdateObject(selectedObject.id, newCoords)
          lastValidCenterRef.current = dropCenter
        }
      }

      map.removeLayer(ghostShape)
      ghostRef.current = null

      // If out of boundary, revert marker position (and shape never moved)
      if (!isInside && lastValidCenterRef.current) {
        marker.setLatLng(lastValidCenterRef.current)
      }
    })

    // Cleanup
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      if (markerRef.current) {
        map.removeLayer(markerRef.current)
        markerRef.current = null
      }
      if (ghostRef.current) {
        map.removeLayer(ghostRef.current)
        ghostRef.current = null
      }
    }
  }, [
    activeTool,
    selectedObject,
    map,
    onUpdateObject,
    boundary, // Re-run if boundary changes
  ])

  return (
    <>
      {showTooltip && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[1000]">
          <span className="text-sm font-medium text-gray-700">
            Drag marker to move shape
          </span>
        </div>
      )}
    </>
  )
}

export default MoveTool
