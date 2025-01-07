<script lang="ts">
    import Prism from 'prismjs';
    import 'prismjs/themes/prism-tomorrow.css';
    import 'prismjs/components/prism-json';
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';

    export let previewEvent: any;

    let isPreviewReady = false;

    onMount(() => {
        isPreviewReady = true;
    });

    $: previewEventFormatted = browser && isPreviewReady ? Prism.highlight(
        JSON.stringify(previewEvent, null, 2),
        Prism.languages.json,
        'json'
    ) : '';
</script>

<style>
    /* Copy all the preview styles from the original component */
    .preview-container {
        background: #1e1e1e;
        border-radius: 0.5rem;
        padding: 1rem;
    }

    /* ... rest of the styles ... */
</style>

<div class="sticky top-6">
    <div class="bg-base-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Event Preview</h2>
            <div class="text-sm text-base-content/60">
                {previewEvent.tags.length} tags
            </div>
        </div>
        <div class="preview-container">
            <div class="preview-scroll">
                {#if browser && isPreviewReady}
                    <pre><code class="language-json">{@html previewEventFormatted}</code></pre>
                {:else}
                    <pre><code class="language-json">{JSON.stringify(previewEvent, null, 2)}</code></pre>
                {/if}
            </div>
        </div>
    </div>
</div> 