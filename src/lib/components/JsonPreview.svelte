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

    // Make the preview update reactively
    $: previewEventString = JSON.stringify(previewEvent, null, 2);
    $: previewEventFormatted = browser && isPreviewReady ? Prism.highlight(
        previewEventString,
        Prism.languages.json,
        'json'
    ) : previewEventString;
</script>

<style>
    .preview-container {
        background: #1e1e1e;
        border-radius: 0.5rem;
        padding: 1rem;
    }

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

    pre {
        margin: 0;
        padding: 0;
        background: transparent;
        font-family: 'JetBrains Mono', ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, 'Courier New', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        tab-size: 2;
    }

    code {
        background: transparent !important;
        padding: 0 !important;
        font-family: inherit;
        white-space: pre-wrap;
        word-break: break-word;
    }

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
                    <pre><code class="language-json">{previewEventString}</code></pre>
                {/if}
            </div>
        </div>
    </div>
</div> 