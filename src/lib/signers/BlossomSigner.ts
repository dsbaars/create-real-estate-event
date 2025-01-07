import { ndk } from '$lib/stores/ndk';
import { NDKEvent, type NDKSigner, type NostrEvent } from '@nostr-dev-kit/ndk';
import { BlossomClient, type EventTemplate } from 'blossom-client-sdk';

export const blossomSigner = async (draft: EventTemplate) => {
    const pubKey = (await ndk.signer?.user())?.pubkey;
  
    // add the pubkey to the draft event
    const event: NDKEvent = new NDKEvent(ndk);
    event.kind = draft.kind;
    event.content = draft.content;
    event.tags = draft.tags;
    event.pubkey = pubKey;

    // get the signature
    const sig = await event.sign();
  
    // return the event + id + sig
    return { ...event, sig: event.sig, id: event.id };
  };
  