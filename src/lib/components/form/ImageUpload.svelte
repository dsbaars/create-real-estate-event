<script lang="ts">
    export let images: File[] = [];
    export let imageHashes: string[] = [];
    export let isDragging = false;

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
</script>

<div
    class="border-2 border-dashed p-8 text-center cursor-pointer"
    class:border-primary={isDragging}
    on:dragenter|preventDefault={() => isDragging = true}
    on:dragleave|preventDefault={() => isDragging = false}
    on:dragover|preventDefault
    on:drop={handleDrop}
>
    <p>Drag and drop images here</p>
    {#if images.length > 0}
        <div class="mt-4 grid grid-cols-3 gap-4">
            {#each images as image, i}
                <div class="relative">
                    <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        class="w-full h-32 object-cover rounded"
                    />
                    <p class="text-xs mt-1 break-all">SHA256: {imageHashes[i]}</p>
                </div>
            {/each}
        </div>
    {/if}
</div> 