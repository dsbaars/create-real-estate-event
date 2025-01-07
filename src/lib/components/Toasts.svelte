<script lang="ts">
    import { toasts } from '$lib/stores/toast';
    import Toast from './Toast.svelte';
</script>

{#each $toasts as toast (toast.id)}
    <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => toasts.remove(toast.id)}
    />
{/each} 