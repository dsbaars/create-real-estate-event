<script lang="ts">
    import { NDKEvent } from '@nostr-dev-kit/ndk';
    import { BlossomClient } from 'blossom-client-sdk';
    import { ndk } from '$lib/stores/ndk';
	import { blossomSigner } from '$lib/signers/BlossomSigner';
    import { onMount } from 'svelte';
    import maplibregl from 'maplibre-gl';
    import Geohash from 'latlon-geohash';
    import Prism from 'prismjs';
    import 'prismjs/themes/prism-tomorrow.css';
    import 'prismjs/components/prism-json';
    import { browser } from '$app/environment';
    import AddressInput from './form/AddressInput.svelte';
    import ImageUpload from './form/ImageUpload.svelte';
    import AmenitiesSection from './form/AmenitiesSection.svelte';
    import JsonPreview from './form/JsonPreview.svelte';
    import { toasts } from '$lib/stores/toast';

    export let pubkey: string;

    let images: File[] = [];
    let imageHashes: string[] = [];
    let isDragging = false;
    let kind = 30403;
    
    let title = '';
    let price = '';
    let currency = 'USD';
    let bedrooms = '';
    let bathrooms = '';
    let size = '';
    let sizeUnit = 'm²';
    let content = '';

    const blossom = new BlossomClient('https://files.dbtc.link', blossomSigner);

    interface BlossomResponse {
        url: string;
    }
    
    async function calculateSHA256(file: File): Promise<string> {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        
        const files = e.dataTransfer?.files;
        if (!files) return;
        
        for (const file of Array.from(files)) {
            if (file.type.startsWith('image/')) {
                images = [...images, file];
                const hash = await calculateSHA256(file);
                imageHashes = [...imageHashes, hash];
            }
        }
    }
    
    function resetForm() {
        images = [];
        imageHashes = [];
        title = '';
        price = '';
        bedrooms = '';
        bathrooms = '';
        size = '';
        content = '';
        tags = [];
        toilets = '';
        floors = '';
        beachDistance = '';
        beachDistanceUnit = 'km';
        lotSize = '';
        lotSizeUnit = 'm²';
        availability = 'Long term';
        resinType = 'Buy Now';
        completionDate = '';
        locationType = '';
        amenities = Object.fromEntries(
            Object.keys(amenities).map(key => [key, false])
        );
    }
    
    async function handleSubmit() {
        if (!window.nostr) {
            toasts.error('Please install a Nostr extension');
            return;
        }
        
        // Upload images to Blossom
        const uploadedImages = await Promise.all(
            images.map(async (image: File) => {
                const response = await blossom.uploadBlob(image) as BlossomResponse;
                console.log(response);
                return response.url;
            })
        );
        
        const submissionTags = [
            ['d', String(crypto.randomUUID())],
            ['title', String(title)],
            ['price', String(price), String(currency)],
            ['t', 'real-estate'],
            ['bedrooms', String(bedrooms)],
            ['bathrooms', String(bathrooms)],
            ['size', String(size)],
            ['size_unit', String(sizeUnit)],
            ...uploadedImages.map((url: string, i: number) => ['image', String(url), String(imageHashes[i])]),
            ...tags
        ];
        
        try {
            const ndkEvent = new NDKEvent(ndk);
            ndkEvent.kind = kind;
            ndkEvent.tags = submissionTags;
            
            ndkEvent.content = content;
            ndkEvent.pubkey = pubkey;
            
            let relays = await ndkEvent.publish();
            console.log(relays);
            
            toasts.success('Listing published successfully!');
            resetForm();
        } catch (error) {
            console.error('Error publishing event:', error);
            toasts.error('Error publishing listing');
        }
    }

    let csvInput: HTMLInputElement;
    let address = '';
    let coordinates: [number, number] | null = null;
    let map: maplibregl.Map | null = null;
    let mapContainer: HTMLDivElement;
    let marker: maplibregl.Marker | null = null;
    let geohash: string = '';

    onMount(() => {
        // Initialize map but don't show it until we have coordinates
        map = new maplibregl.Map({
            container: mapContainer,
            style: '/map.json', // Get a free key from maptiler.com
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
                
                // Generate geohash
                geohash = Geohash.encode(coordinates[0], coordinates[1], 9);
                
                // Update map
                if (map) {
                    map.setCenter([coordinates[1], coordinates[0]]);
                    
                    // Update or create marker
                    if (marker) {
                        marker.setLngLat([coordinates[1], coordinates[0]]);
                    } else {
                        marker = new maplibregl.Marker()
                            .setLngLat([coordinates[1], coordinates[0]])
                            .addTo(map);
                    }
                }

                // Add coordinates and geohash to content
                const locationInfo = `\nCoordinates: ${coordinates[0]}, ${coordinates[1]}\nGeohash: ${geohash}`;
                if (!content.includes('Coordinates:')) {
                    content = content + locationInfo;
                }
                
                // Create new location tags array
                const locationTags = [
                    ['g', geohash]
                ];

                // Add additional location tags if available
                if (addressDetails) {
                    if (addressDetails.road) locationTags.push(['street', addressDetails.road]);
                    if (addressDetails.city || addressDetails.town) locationTags.push(['city', addressDetails.city || addressDetails.town]);
                    if (addressDetails.district) locationTags.push(['district', addressDetails.district]);
                    if (addressDetails.state || addressDetails.region) locationTags.push(['area', addressDetails.state || addressDetails.region]);
                    if (addressDetails.country) locationTags.push(['country', addressDetails.country]);
                    if (addressDetails.postcode) locationTags.push(['postcode', addressDetails.postcode]);
                }

                // Remove any existing location tags
                tags = tags.filter(tag => !['g', 'street', 'city', 'district', 'area', 'country', 'postcode'].includes(tag[0]));
                
                // Add new location tags
                tags = [...tags, ...locationTags];

                // Add formatted address to content if not already there
                const formattedAddress = data[0].display_name;
                if (formattedAddress && !content.includes('Full Address:')) {
                    content = content + `\nFull Address: ${formattedAddress}`;
                }

                alert('Address geocoded successfully!');
            } else {
                alert('No results found for this address');
            }
        } catch (error) {
            console.error('Error geocoding address:', error);
            alert('Error geocoding address');
        }
    }

    async function handleCSVImport(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        
        const text = await file.text();
        // Split by newlines and handle both \r\n and \n
        const rows = text.split(/\r?\n/).map(row => {
            // Better CSV parsing regex that handles quoted fields with commas
            const matches = row.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g) || [];
            return matches.map(field => 
                field.replace(/^,/, '') // Remove leading comma
                    .replace(/^"|"$/g, '') // Remove surrounding quotes
                    .replace(/""/g, '"') // Replace double quotes with single
                    .trim()
            );
        });

        let bedroomData: { [key: string]: any } = {};
        let currentSection = '';
        
        for (let i = 0; i < rows.length; i++) {
            const [variable, data] = rows[i];
            if (!variable) continue;

            const cleanVariable = variable.trim();
            
            switch(cleanVariable) {
                case 'Property Price':
                    currentSection = 'price';
                    break;
                case 'Living Area (m²)':
                    currentSection = 'size';
                    break;
                case 'Number of Bathrooms':
                    currentSection = 'bathrooms';
                    break;
                case '1 Bedroom':
                    if (currentSection === 'price') {
                        // Handle price format "$214,750"
                        const priceStr = data.replace(/[$,]/g, '').trim();
                        bedroomData.price = priceStr;
                    } else if (currentSection === 'size') {
                        bedroomData.size = data.trim();
                    } else if (currentSection === 'bathrooms') {
                        bedroomData.bathrooms = data.trim();
                    }
                    break;
                case 'Street Address':
                    if (data) {
                        address = data.trim();
                    }
                    break;
                case 'Summary':
                    if (data) {
                        content = data.trim();
                    }
                    break;
                case 'Unique identier':
                    if (data) {
                        title = data.trim();
                    }
                    break;
                case 'Number of Toilets':
                    if (data && data !== 'same as bathrooms') {
                        toilets = data.trim();
                    }
                    break;
                case 'Floors':
                    if (data) {
                        floors = data.trim();
                    }
                    break;
                case 'Beach Proximity':
                    if (data) {
                        const [distance, unit] = data.trim().split(' ');
                        beachDistance = distance;
                        if (unit) beachDistanceUnit = unit;
                    }
                    break;
                case 'Lot Size (m²)':
                    if (data && data.toLowerCase() !== 'na') {
                        lotSize = data.trim();
                        lotSizeUnit = 'm²';
                    }
                    break;
                case 'Year Built':
                    if (data) {
                        completionDate = data.trim();
                    }
                    break;
            }
        }

        // Set the form values from collected data
        if (bedroomData.price) price = bedroomData.price;
        if (bedroomData.size) {
            size = bedroomData.size;
            sizeUnit = 'm²';
        }
        if (bedroomData.bathrooms) bathrooms = bedroomData.bathrooms;
        bedrooms = '1'; // Default to 1 bedroom

        // Collect amenities
        const amenities = [];
        const amenityRows = rows.filter(row => row[1]?.trim() === 'Yes');
        for (const row of amenityRows) {
            const amenityName = row[0]?.trim();
            if (amenityName && ['Swimming Pool', 'Home Office Space', 'Balcony', 'Security System'].includes(amenityName)) {
                amenities.push(amenityName);
            }
        }

        // Add amenities to content
        if (amenities.length > 0) {
            const amenitiesText = '\n\nAmenities:\n' + amenities.map(a => `- ${a}`).join('\n');
            content = content + amenitiesText;
        }

        // Add location information
        const locationFields = {
            'Street Address': 'Address',
            'City': 'City',
            'Region / Province / County': 'Region',
            'Country': 'Country'
        };

        const locationInfo = [];
        for (const row of rows) {
            const fieldName = row[0]?.trim();
            if (fieldName && fieldName in locationFields && row[1]) {
                locationInfo.push(`${locationFields[fieldName as keyof typeof locationFields]}: ${row[1].trim()}`);
            }
        }

        if (locationInfo.length > 0) {
            const locationText = '\n\nLocation:\n' + locationInfo.join('\n');
            content = content + locationText;
        }

        // Automatically trigger geocoding if address is set
        if (address) {
            await geocodeAddress();
        }

        // Reset file input
        target.value = '';
    }

    // Add tags to top-level variables
    let tags: string[][] = [];
    
    // Add these new variables at the top with the other form fields
    let propertyType = 'condominium'; // t tag for property type
    let toilets = '';
    let floors = '';
    let beachDistance = '';
    let beachDistanceUnit = 'km';
    let availability = 'Long term';
    let resinType = 'Buy Now';
    let completionDate = '';
    let locationType = '';
    let lotSize = '';
    let lotSizeUnit = 'm²';

    // Add these as boolean fields
    let amenities = {
        securitySystem: false,
        swimmingPool: false,
        homeOffice: false,
        solarPanels: false,
        garden: false,
        heating: false,
        cooling: false,
        parking: false,
        balcony: false,
        terrace: false,
        vacationHome: false,
        permanentResidence: false,
        residentialArea: false,
        propertyManagement: false,
        rentalPool: false,
        nearNatureReserve: false,
        hasJacuzzi: false,
        hasCoworking: false,
        hasPlungePool: false
    };

    // Add a computed property for the preview
    $: previewEvent = {
        kind,
        content,
        tags: [
            ['d', crypto.randomUUID()],
            ['title', title || ''],
            ['price', price || '', currency],
            ['t', 'real-estate'],
            ['t', propertyType],
            ['bedrooms', bedrooms || ''],
            ['bathrooms', bathrooms || ''],
            ...(toilets ? [['toilets', toilets]] : []),
            ['size', size || ''],
            ['size_unit', sizeUnit],
            ...(lotSize ? [
                ['lot_size', lotSize],
                ['lot_size_unit', lotSizeUnit]
            ] : []),
            ...(availability ? [['availability', availability]] : []),
            ...(resinType ? [['resin-type', resinType]] : []),
            ...(completionDate ? [['completion_date', completionDate]] : []),
            ...(floors ? [['floors', floors]] : []),
            ...(beachDistance ? [
                ['beach_distance', beachDistance],
                ['beach_distance_unit', beachDistanceUnit]
            ] : []),
            ...(locationType ? [['location_type', locationType]] : []),
            // Boolean amenities
            ...Object.entries(amenities)
                .filter(([_, value]) => value)
                .map(([key, _]) => [key.replace(/([A-Z])/g, '_$1').toLowerCase(), 'true']),
            ...images.map((_, i) => ['image', '', imageHashes[i]]),
            ...tags
        ].filter(tag => tag.some(item => item !== '')), // Remove empty tags
        pubkey,
        created_at: Math.floor(Date.now() / 1000)
    };

    // Add a variable to track if preview is ready
    let isPreviewReady = false;

    // Initialize Prism only on the client side
    onMount(() => {
        isPreviewReady = true;
    });

    // Make the formatted preview reactive to all form fields and only run on client
    $: previewEventFormatted = browser && isPreviewReady ? Prism.highlight(
        JSON.stringify(previewEvent, null, 2),
        Prism.languages.json,
        'json'
    ) : '';
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
    
    /* Add styles for the preview */
    pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    /* Add these styles for the preview */
    .preview-container {
        background: #1e1e1e;
        border-radius: 0.5rem;
        padding: 1rem;
    }

    .preview-container pre {
        margin: 0;
        padding: 0;
        background: transparent;
        font-family: 'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, 'Courier New', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        tab-size: 2;
    }

    .preview-container code {
        background: transparent !important;
        padding: 0 !important;
        font-family: inherit;
        white-space: pre-wrap;
        word-break: break-word;
    }

    /* Override Prism theme colors for better visibility */
    :global(.preview-container .token.property) {
        color: #9cdcfe;
    }

    :global(.preview-container .token.string) {
        color: #ce9178;
    }

    :global(.preview-container .token.number) {
        color: #b5cea8;
    }

    :global(.preview-container .token.boolean) {
        color: #569cd6;
    }

    :global(.preview-container .token.punctuation) {
        color: #d4d4d4;
    }

    /* Add a subtle scrollbar */
    .preview-scroll {
        max-height: 800px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    }

    .preview-scroll::-webkit-scrollbar {
        width: 8px;
    }

    .preview-scroll::-webkit-scrollbar-track {
        background: transparent;
    }

    .preview-scroll::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }
</style>

<div class="max-w-7xl mx-auto bg-base-100 rounded-lg shadow-xl p-6">
    <h1 class="text-2xl font-bold mb-6">Create Real Estate Listing</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left column: Form -->
        <div class="space-y-6">
            <div class="form-control mb-6">
                <label class="label">
                    <span class="label-text">Import from CSV</span>
                </label>
                <input
                    type="file"
                    accept=".csv"
                    class="file-input file-input-bordered w-full"
                    on:change={handleCSVImport}
                    bind:this={csvInput}
                />
            </div>
            
            <!-- Address Input and Map -->
            <AddressInput
                bind:address
                bind:coordinates
                bind:geohash
                bind:content
                bind:tags
            />
            
            <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Type</span>
                    </label>
                    <select bind:value={kind} class="select select-bordered">
                        <option value={30402}>Published Listing</option>
                        <option value={30403}>Draft Listing</option>
                    </select>
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Title</span>
                    </label>
                    <input
                        type="text"
                        bind:value={title}
                        class="input input-bordered"
                        required
                    />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Price</span>
                        </label>
                        <input
                            type="number"
                            bind:value={price}
                            class="input input-bordered"
                            required
                        />
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Currency</span>
                        </label>
                        <select bind:value={currency} class="select select-bordered">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Bedrooms</span>
                        </label>
                        <input
                            type="number"
                            bind:value={bedrooms}
                            class="input input-bordered"
                            required
                        />
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Bathrooms</span>
                        </label>
                        <input
                            type="number"
                            bind:value={bathrooms}
                            class="input input-bordered"
                            required
                        />
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Size</span>
                        </label>
                        <input
                            type="number"
                            bind:value={size}
                            class="input input-bordered"
                            required
                        />
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Size Unit</span>
                        </label>
                        <select bind:value={sizeUnit} class="select select-bordered">
                            <option value="m²">m²</option>
                            <option value="ft²">ft²</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Property Type</span>
                        </label>
                        <select bind:value={propertyType} class="select select-bordered">
                            <option value="condominium">Condominium</option>
                            <option value="house">House</option>
                            <option value="apartment">Apartment</option>
                            <option value="villa">Villa</option>
                        </select>
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Toilets (optional)</span>
                        </label>
                        <input
                            type="number"
                            bind:value={toilets}
                            class="input input-bordered"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Floors (optional)</span>
                        </label>
                        <input
                            type="number"
                            bind:value={floors}
                            class="input input-bordered"
                        />
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Completion Date (optional)</span>
                        </label>
                        <input
                            type="month"
                            bind:value={completionDate}
                            class="input input-bordered"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Beach Distance (optional)</span>
                        </label>
                        <input
                            type="number"
                            bind:value={beachDistance}
                            class="input input-bordered"
                        />
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Distance Unit</span>
                        </label>
                        <select bind:value={beachDistanceUnit} class="select select-bordered">
                            <option value="km">km</option>
                            <option value="m">m</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Lot Size (optional)</span>
                        </label>
                        <input
                            type="number"
                            bind:value={lotSize}
                            class="input input-bordered"
                        />
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Lot Size Unit</span>
                        </label>
                        <select bind:value={lotSizeUnit} class="select select-bordered">
                            <option value="m²">m²</option>
                            <option value="ft²">ft²</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Availability</span>
                        </label>
                        <select bind:value={availability} class="select select-bordered">
                            <option value="Long term">Long term</option>
                            <option value="Short term">Short term</option>
                            <option value="Per direct">Per direct</option>
                        </select>
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text">Type</span>
                        </label>
                        <select bind:value={resinType} class="select select-bordered">
                            <option value="Buy Now">Buy Now</option>
                            <option value="Rent to Own">Rent to Own</option>
                        </select>
                    </div>
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Location Type (optional)</span>
                    </label>
                    <select bind:value={locationType} class="select select-bordered">
                        <option value="">Select type...</option>
                        <option value="Beachfront">Beachfront</option>
                        <option value="Downtown">Downtown</option>
                        <option value="Suburban">Suburban</option>
                    </select>
                </div>

                <!-- Amenities Section -->
                <AmenitiesSection bind:amenities />
                
                <!-- Image Upload -->
                <ImageUpload
                    bind:images
                    bind:imageHashes
                    bind:isDragging
                />
                
                <button type="submit" class="btn btn-primary w-full">
                    Publish Listing
                </button>
            </form>
        </div>

        <!-- Right column: Preview -->
        <JsonPreview {previewEvent} />
    </div>
</div> 