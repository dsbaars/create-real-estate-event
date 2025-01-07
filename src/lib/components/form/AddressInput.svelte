<script lang="ts">
    import maplibregl from 'maplibre-gl';
    import Geohash from 'latlon-geohash';
    import { onMount } from 'svelte';
    import { toasts } from '$lib/stores/toast';

    export let address = '';
    export let coordinates: [number, number] | null = null;
    export let geohash = '';
    export let content = '';
    export let tags: string[][] = [];

    let map: maplibregl.Map | null = null;
    let mapContainer: HTMLDivElement;
    let marker: maplibregl.Marker | null = null;

    onMount(() => {
        map = new maplibregl.Map({
            container: mapContainer,
            style: '/map.json',
            zoom: 15
        });
        
        return () => {
            map?.remove();
        };
    });

    async function geocodeAddress() {
        try {
            const encodedAddress = encodeURIComponent(address);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodedAddress}`);
            let data = await response.json();
            
            if (data && data[0]) {
                coordinates = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                const addressDetails = data[0].address;
                
                geohash = Geohash.encode(coordinates[0], coordinates[1], 9);
                
                if (map) {
                    map.setCenter([coordinates[1], coordinates[0]]);
                    
                    if (marker) {
                        marker.setLngLat([coordinates[1], coordinates[0]]);
                    } else {
                        marker = new maplibregl.Marker()
                            .setLngLat([coordinates[1], coordinates[0]])
                            .addTo(map);
                    }
                }

                const locationInfo = `\nCoordinates: ${coordinates[0]}, ${coordinates[1]}\nGeohash: ${geohash}`;
                if (!content.includes('Coordinates:')) {
                    content = content + locationInfo;
                }
                
                const locationTags = [
                    ['g', geohash]
                ];

                if (addressDetails) {
                    if (addressDetails.road) locationTags.push(['street', addressDetails.road]);
                    if (addressDetails.city || addressDetails.town) locationTags.push(['city', addressDetails.city || addressDetails.town]);
                    if (addressDetails.district) locationTags.push(['district', addressDetails.district]);
                    if (addressDetails.state || addressDetails.region) locationTags.push(['area', addressDetails.state || addressDetails.region]);
                    if (addressDetails.country) locationTags.push(['country', addressDetails.country]);
                    if (addressDetails.postcode) locationTags.push(['postcode', addressDetails.postcode]);
                }

                tags = tags.filter(tag => !['g', 'street', 'city', 'district', 'area', 'country', 'postcode'].includes(tag[0]));
                tags = [...tags, ...locationTags];

                const formattedAddress = data[0].display_name;
                if (formattedAddress && !content.includes('Full Address:')) {
                    content = content + `\nFull Address: ${formattedAddress}`;
                }

                toasts.success('Address geocoded successfully!');
            } else {
                toasts.error('No results found for this address');
            }
        } catch (error) {
            console.error('Error geocoding address:', error);
            toasts.error('Error geocoding address');
        }
    }
</script>

<style>
    @import 'maplibre-gl/dist/maplibre-gl.css';
    
    .map-container {
        height: 300px;
        width: 100%;
        display: none;
    }
    
    .map-container.visible {
        display: block;
    }
</style>

<div class="form-control">
    <label class="label">
        <span class="label-text">Street Address</span>
    </label>
    <div class="flex gap-2">
        <input
            type="text"
            bind:value={address}
            class="input input-bordered flex-1"
            placeholder="Enter street address"
        />
        <button
            type="button"
            class="btn btn-primary"
            on:click={geocodeAddress}
            disabled={!address}
        >
            Geocode
        </button>
    </div>
    {#if coordinates}
        <label class="label">
            <span class="label-text-alt">
                Lat: {coordinates[0]}, Lon: {coordinates[1]}
            </span>
        </label>
    {/if}
</div>

<div 
    class="map-container mb-4 rounded-lg overflow-hidden {coordinates ? 'visible' : ''}" 
    bind:this={mapContainer}
>
</div>

{#if coordinates && geohash}
    <div class="text-sm mb-4 space-y-1">
        <div>
            <span class="font-semibold">Coordinates:</span> 
            {coordinates[0]}, {coordinates[1]}
        </div>
        <div>
            <span class="font-semibold">Geohash:</span> 
            {geohash}
        </div>
    </div>
{/if} 