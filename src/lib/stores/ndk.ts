import { browser } from '$app/environment';
import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import { NDKNip07Signer } from '@nostr-dev-kit/ndk';
import { onMount } from 'svelte';

let ndk: NDKSvelte;

if (browser) {
    ndk = new NDKSvelte({
        signer: new NDKNip07Signer()
    });
}

export { ndk };