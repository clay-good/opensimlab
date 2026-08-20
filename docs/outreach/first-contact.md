# Draft outreach note

**This is a draft for Clay to send, not product content.** No institution named
here has been contacted, has agreed to anything, or is affiliated with this
project, and nothing in the application says otherwise. If that changes, the
change belongs in `GOVERNANCE.md` with a name and a date on it.

## Who to approach, and in what order

Approach the people who teach, not the people who procure. There is nothing to
buy, so procurement has nothing to decide, and a free tool routed through a
purchasing process dies there.

1. **A course or simulation coordinator in a nurse anesthesia program.** They
   feel the constraint this addresses most directly: sim lab time is scarce and
   expensive, and students arrive at it having read about induction rather than
   having seen one.
2. **A simulation center educator at a hospital.** They run debriefs for a
   living and will have the sharpest opinion on whether the PEARLS structure is
   worth anything.
3. **A medical school anesthesiology clerkship director.** Smaller ask: a
   pre-clerkship resource for students who get two weeks and no continuity.

Ask each for one thing only. Not adoption.

## What to ask for

**"Would you look at one scenario and tell me what a student would learn from it
that they shouldn't?"**

That is the whole ask. It is small, it is flattering in the right way — it
treats them as the expert they are — and it is the thing the project actually
needs. Adoption without review would be worse than no adoption.

Do not ask for:

- a meeting, before they have seen it
- a pilot, a cohort, or a letter of support
- anything that implies you want their name on it

## The note itself

> Subject: A free anesthesia simulator, and a request for one hour of scepticism
>
> Dr [name],
>
> I've built a free, browser-based anesthesia simulator — no accounts, no
> install, works offline, and nothing a student does ever leaves their device.
> It's at [link].
>
> It is not finished and I'm not asking you to adopt it. The pharmacology is
> transcribed by hand from Eleveld 2018 and Minto 1997 with the citations in the
> source, the physiology is checked against the Benumof apnea curves, and every
> one of those numbers is currently unreviewed by anybody with a licence. The
> site says so on the front page and lists every unsigned item by name.
>
> That's why I'm writing. Would you be willing to run one scenario — the routine
> induction takes about twelve minutes — and tell me what a student would take
> away from it that they shouldn't? A list of what's wrong is worth more to me
> than any number of people using it.
>
> If it turns out to be useful, it's free and open source, it maps to the COA and
> NBCRNA content areas, and a program can host it inside their own network with
> no dependency on me. But that's a conversation for after somebody qualified
> has told me what's broken.
>
> [name]

## Before you send it

- Have the custom domain live. A `workers.dev` URL reads as a prototype, and the
  site is currently `noindex` precisely because it is one.
- Run the three scenarios yourself the week before, so nothing embarrassing is
  waiting on the first click.
- Read the limitations register end to end. Somebody will ask about one of them,
  and knowing which ones you already disclosed is the difference between
  credible and defensive.
- Be ready to say plainly that this does not count toward clinical hours. If a
  program director thinks you are implying otherwise, the conversation is over.

## When somebody says yes

Give them `/for-educators`, not a slide deck. Then put their name, credential,
declared competing interests and re-review date into the editorial board record
and let the build gate do the rest — the moment a real reviewer signs, the alpha
banner and the "not clinically reviewed" markers stop appearing on what they
signed, automatically. That is the point of building the gate first.
