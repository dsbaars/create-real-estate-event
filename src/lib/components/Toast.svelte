<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';

    export let message: string;
    export let type: 'success' | 'error' | 'info' = 'info';
    export let duration = 5000;
    export let onClose: () => void;

    onMount(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    });

    const alertClass = {
        success: 'alert-success',
        error: 'alert-error',
        info: 'alert-info'
    }[type];
</script>

<div class="toast toast-top toast-center z-50">
    <div
        class="alert {alertClass} shadow-lg"
        transition:fade={{ duration: 200 }}
    >
        <div class="flex items-center gap-2">
            {#if type === 'success'}
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {:else if type === 'error'}
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {/if}
            <span class="text-sm">{message}</span>
        </div>
    </div>
</div> 