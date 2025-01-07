<script lang="ts">
    export let amenities: Record<string, boolean>;

    function formatLabel(key: string): string {
        // First, convert camelCase to space-separated words
        const words = key.replace(/([A-Z])/g, ' $1').trim();
        // Then capitalize first letter of each word
        return words.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
</script>

<div class="form-control">
    <label class="label">
        <span class="label-text">Amenities</span>
    </label>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-base-200 rounded-lg">
        {#each Object.entries(amenities) as [key, value]}
            <label class="label cursor-pointer justify-start gap-2">
                <input
                    type="checkbox"
                    class="checkbox"
                    bind:checked={amenities[key]}
                />
                <span class="label-text">{formatLabel(key)}</span>
            </label>
        {/each}
    </div>
</div> 