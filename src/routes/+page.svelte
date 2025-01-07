<script lang="ts">
    import { onMount } from 'svelte';
    import { ndk } from '$lib/stores/ndk';
    import { browser } from '$app/environment';
    import { NDKEvent, type NDKUser } from '@nostr-dev-kit/ndk';
    
    import ListingsTable from '$lib/components/ListingsTable.svelte';
    import CreateListingForm from '$lib/components/CreateListingForm.svelte';
    import RelayStatus from '$lib/components/RelayStatus.svelte';

    let pubkey: string = '';
    let npub: string = '';
    let events: NDKEvent[] = [];
    let eventRelays: Map<string, Set<string>> = new Map();
    let connectedRelays: Set<string> = new Set();
    let profile: NDKUser | null = null;
    let hasNostrExtension = true;

    onMount(async () => {
        if (browser) {
            hasNostrExtension = typeof window.nostr !== 'undefined';
            if (!hasNostrExtension) return;

            await ndk.connect();
            pubkey = (await ndk.signer?.user())?.pubkey ?? '';
            npub = (await ndk.signer?.user())?.npub ?? '';

            profile = await ndk.getUser({ pubkey })?.fetchProfile();

            // Track relay connections
            ndk.pool?.on('relay:connect', (relay) => {
                connectedRelays.add(relay.url);
                connectedRelays = connectedRelays;
            });

            ndk.pool?.on('relay:disconnect', (relay) => {
                connectedRelays.delete(relay.url);
                connectedRelays = connectedRelays;
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

{#if !hasNostrExtension}
    <div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div class="max-w-2xl w-full bg-base-100 rounded-lg shadow-xl p-8 text-center">
            <div class="mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 class="text-2xl font-bold mb-4">Nostr Extension Required</h1>
            <p class="mb-6 text-base-content/80">
                To use this application, you need to install a Nostr browser extension. 
                We recommend one of the following:
            </p>
            <div class="space-y-4">
                <a 
                    href="https://getalby.com/products/browser-extension" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="block p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                    <h2 class="font-semibold">Alby</h2>
                    <p class="text-sm text-base-content/70">A Bitcoin & Nostr browser extension</p>
                </a>
                <a 
                    href="https://github.com/fiatjaf/nos2x" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="block p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                    <h2 class="font-semibold">nos2x</h2>
                    <p class="text-sm text-base-content/70">A minimal Nostr signer extension</p>
                </a>
            </div>
            <p class="mt-6 text-sm text-base-content/60">
                After installing an extension, please refresh this page.
            </p>
        </div>
    </div>
{:else}
    <div class="navbar bg-base-100">
        <a class="btn btn-ghost text-xl">{profile?.displayName ?? pubkey} <small class="text-xs text-gray-500">{npub}</small></a>
    </div>

    <div class="min-h-screen bg-base-200 p-4">
        <ListingsTable {events} {eventRelays} />
        <CreateListingForm {pubkey} />
    </div>

    <RelayStatus {connectedRelays} />
{/if}