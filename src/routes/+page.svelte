<script lang="ts">
    import { onMount } from 'svelte';
    import { ndk } from '$lib/stores/ndk';
    import { browser } from '$app/environment';
    import { NDKEvent } from '@nostr-dev-kit/ndk';
    import maplibregl from 'maplibre-gl';
    import Geohash from 'latlon-geohash';
    
    import ListingsTable from '$lib/components/ListingsTable.svelte';
    import CreateListingForm from '$lib/components/CreateListingForm.svelte';
    import RelayStatus from '$lib/components/RelayStatus.svelte';

    let pubkey: string = '';
    let npub: string = '';
    let events: NDKEvent[] = [];
    let eventRelays: Map<string, Set<string>> = new Map();
    let connectedRelays: Set<string> = new Set();
    let profile: NDKProfile | null = null;
    onMount(async () => {
        if (browser) {
            await ndk.connect();
            pubkey = (await ndk.signer?.user())?.pubkey ?? '';
            npub = (await ndk.signer?.user())?.npub ?? '';

            profile = await ndk.getUser({ pubkey })?.fetchProfile();

            // Track relay connections
            ndk.pool?.on('relay:connect', (relay) => {
                connectedRelays.add(relay.url);
                connectedRelays = connectedRelays; // Trigger reactivity
            });

            ndk.pool?.on('relay:disconnect', (relay) => {
                connectedRelays.delete(relay.url);
                connectedRelays = connectedRelays; // Trigger reactivity
            });

            let sub = ndk.subscribe({
                kinds: [30402, 30403] as number[],
                authors: [pubkey]
            });

            sub.on('event', (event) => {
                const relaySet = eventRelays.get(event.id) || new Set();
                event.relay?.url && relaySet.add(event.relay.url);
                eventRelays.set(event.id, relaySet);

                if (eventRelays.get(event.id)?.size === 0) {
                    eventRelays.set(event.id, new Set(event.onRelays.map(relay => relay.url)));
                } 
                if (!events.some(e => e.id === event.id)) {
                    events = [...events, event];
                }
            });
        }
    });
</script>

<div class="navbar bg-base-100">
    <a class="btn btn-ghost text-xl">{profile?.displayName ?? pubkey} <small class="text-xs text-gray-500">{npub}</small></a>
</div>

<div class="min-h-screen bg-base-200 p-4">
    <ListingsTable {events} {eventRelays} />
    <CreateListingForm {pubkey} />
</div>

<RelayStatus {connectedRelays} />