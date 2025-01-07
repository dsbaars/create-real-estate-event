<script lang="ts">
    import { NDKEvent } from '@nostr-dev-kit/ndk';
    import { ndk } from '$lib/stores/ndk';
    import { toasts } from '$lib/stores/toast';
    export let events: NDKEvent[] = [];
    export let eventRelays: Map<string, Set<string>>;

    async function handleDelete(event: NDKEvent) {
        try {
            const deleteEvent = new NDKEvent(ndk);
            deleteEvent.kind = 5; // Kind 5 is for deletion
            deleteEvent.tags = [
                ['e', event.id], // Reference to event being deleted
                ['k', event.kind?.toString() ?? ''] // Kind of event being deleted
            ];
            deleteEvent.content = 'Test content';
            await deleteEvent.publish();
            // Remove the event from local state
            events = events.filter(e => e.id !== event.id);
            toasts.success('Event deleted successfully');
        } catch (error) {
            console.error('Error deleting event:', error);
            toasts.error('Error deleting event');
        }
    }
</script>

<div class="max-w-6xl mx-auto bg-base-100 rounded-lg shadow-xl p-6 mb-6">
    <h2 class="text-xl font-bold mb-4">Your Listings</h2>
    {#if events.length > 0}
        <div class="overflow-x-auto">
            <table class="table w-full">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Event ID</th>
                        <th>Price</th>
                        <th>Type</th>
                        <th>Relays</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {#each events as event}
                        {@const title = event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled'}
                        {@const price = event.tags.find(t => t[0] === 'price')}
                        {@const currency = price?.[2] || 'USD'}
                        {@const relays = eventRelays.get(event.id) || new Set()}
                        <tr>
                            <td>{title}</td>
                            <td>{event.id}</td>
                            <td>{price?.[1] || 'N/A'} {currency}</td>
                            <td>{event.kind === 30402 ? 'Published' : 'Draft'}</td>
                            <td>
                                <div class="dropdown dropdown-hover">
                                    <label tabindex="0" class="btn btn-xs">
                                        {relays.size} relay{relays.size !== 1 ? 's' : ''}
                                    </label>
                                    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                        {#each Array.from(relays) as relay}
                                            <li class="text-xs truncate" title={relay}>{relay}</li>
                                        {/each}
                                    </ul>
                                </div>
                            </td>
                            <td>
                                <button 
                                    class="btn btn-error btn-sm"
                                    on:click={() => handleDelete(event)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <p class="text-center text-gray-500">No listings found</p>
    {/if}
</div> 