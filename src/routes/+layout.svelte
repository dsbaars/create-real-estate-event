<script lang="ts">
	import '../app.scss';
	import Toasts from '$lib/components/Toasts.svelte';
	let { children } = $props();
</script>

<Toasts />
<slot />
