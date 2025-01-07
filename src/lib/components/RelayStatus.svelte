<script lang="ts">
    import type { NDKRelay } from '@nostr-dev-kit/ndk';
    export let connectedRelays: Set<string>;
</script>

<div class="fixed bottom-4 right-4">
    <div class="dropdown dropdown-top dropdown-end">
        <label tabindex="0" class="btn btn-sm">
            <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                {connectedRelays.size} relay{connectedRelays.size !== 1 ? 's' : ''}
            </div>
        </label>
        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mb-2">
            {#each Array.from(connectedRelays) as relay}
                <li class="text-xs truncate" title={relay}>
                    <span class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 rounded-full bg-success"></div>
                        {relay}
                    </span>
                </li>
            {/each}
        </ul>
    </div>
</div> 