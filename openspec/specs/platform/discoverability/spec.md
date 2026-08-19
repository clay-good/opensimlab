# platform/discoverability Specification

## Purpose

Specifies how a student searching "anesthesia simulator" finds this, and how a shared link renders. Search visibility is genuinely hard here because the product is a client-side application behind a service worker with no server and no analytics. The descriptive weight is deliberately concentrated on the root domain; the simulator routes carry only the metadata they need and never marketing copy.

## Requirements

### Requirement: The Root Domain Carries The Search Weight

Descriptive content, structured data, and keyword-relevant prose SHALL live at `/` and the other informational routes. The simulator routes under `/anesthesia` SHALL carry only essential metadata.

#### Scenario: The landing page is the substantive indexable document

- **WHEN** the root document is fetched by a crawler
- **THEN** it contains the full below-the-fold prose, the module directory, the questions section, and the complete structured data, as static HTML in the initial response

#### Scenario: The simulator route stays clean

- **WHEN** `/anesthesia` is fetched
- **THEN** it carries a title, a meta description, a canonical URL, social preview tags, and a `SoftwareApplication` structured-data record, and it carries no marketing prose, no keyword section, no questions block, and no hidden text

#### Scenario: The simulator is still findable on its own terms

- **WHEN** a visitor searches for the simulator itself
- **THEN** `/anesthesia` is indexable with an accurate, specific title and description, and links back to the root domain for the fuller explanation

### Requirement: Every Indexable Route Is Prerendered Static HTML

Each indexable route SHALL be prerendered at build time to static HTML containing its own real content, so that a crawler, a browser with JavaScript disabled, and a link preview service all receive meaningful markup without executing the application.

#### Scenario: Content exists without JavaScript

- **WHEN** any indexable route is fetched with scripting disabled
- **THEN** its heading structure, primary content, and links are present in the response body, and no route returns an empty application shell

#### Scenario: The service worker never serves stale metadata to a crawler

- **WHEN** a crawler requests a route
- **THEN** it receives the current build's HTML, because the service worker is not registered for crawler user agents and navigation requests fall back to the network when a newer build exists

#### Scenario: Scenario briefing pages are indexable, sessions are not

- **WHEN** the route set is enumerated
- **THEN** scenario briefing pages are prerendered and indexable with their objectives and description, while transient session and debrief states carry `noindex` because they are per-learner and meaningless to a stranger

### Requirement: Per-Route Metadata

Every route SHALL declare a unique title, a meta description, a canonical URL, and language alternates where translations exist.

#### Scenario: Titles are specific and consistently formed

- **WHEN** route titles are enumerated
- **THEN** each is unique, under 60 characters, describes that page specifically, and follows one stated pattern ending in the site name — and an automated test fails the build on a duplicate or missing title

#### Scenario: Descriptions describe the page, not the project

- **WHEN** meta descriptions are enumerated
- **THEN** each is between 110 and 160 characters, describes that specific page, and is not a copy of the site-wide description

#### Scenario: Canonicals prevent duplicate indexing

- **WHEN** a route is reachable with a trailing slash, a query string, or a differing case
- **THEN** it declares a single canonical URL, and the host redirects variants to it with a permanent redirect

#### Scenario: Translations declare their alternates

- **WHEN** a route exists in more than one language
- **THEN** each declares reciprocal `hreflang` alternates including an `x-default`, verified by an automated check

### Requirement: Structured Data That Is Accurate

The site SHALL publish schema.org structured data as JSON-LD, describing only what is true.

#### Scenario: The right types are used

- **WHEN** the structured data is validated
- **THEN** the root declares `WebSite` and `Organization`, the simulator declares `SoftwareApplication` with its educational category and a price of zero, and each scenario briefing declares `LearningResource` with its `teaches`, `educationalLevel`, `learningResourceType`, and `isAccessibleForFree` properties, all passing a schema validator in continuous integration

#### Scenario: Medical credibility signals are real, not decorative

- **WHEN** structured data names reviewers or authorship
- **THEN** it draws those names and credentials from the clinical governance records, so the expertise signals a search engine reads are the same ones a human can audit on the governance page, and no reviewer is named who has not signed content

#### Scenario: No structured data makes a claim the site does not

- **WHEN** structured data is compared against the rendered page
- **THEN** every claim it asserts is present and true on the page, with no ratings, review counts, or credentials that do not exist

### Requirement: Social Previews

Every indexable route SHALL declare Open Graph and Twitter card tags with a preview image generated at build time from the design system.

#### Scenario: A shared link looks deliberate

- **WHEN** a link to any indexable route is pasted into a messaging or social application
- **THEN** it renders with the route's own title, its description, and a preview image drawn in Theater Dark showing the route's subject, at 1200 by 630 pixels

#### Scenario: Preview images are generated, not hand-made

- **WHEN** a new scenario is added
- **THEN** its preview image is produced by the build from the design tokens and the scenario's own title, with no manual asset step, and the images together stay within the download budget because they are never fetched by the application itself

### Requirement: Crawlability Basics

The site SHALL publish a sitemap and a robots file, and SHALL keep them generated rather than hand-maintained.

#### Scenario: The sitemap is generated and complete

- **WHEN** the build runs
- **THEN** `sitemap.xml` is regenerated listing every indexable route with its last-modified date, and an automated test asserts it matches the prerendered route set exactly

#### Scenario: Robots permits indexing and names the sitemap

- **WHEN** `robots.txt` is fetched
- **THEN** it permits crawling of indexable routes, disallows transient session routes, and names the sitemap URL

#### Scenario: Links are descriptive

- **WHEN** link text across the site is audited
- **THEN** no link reads "click here", "read more", or "learn more" without naming its destination, which serves screen reader users and crawlers with the same fix

### Requirement: Measurement Without Surveillance

Search performance SHALL be measured only through means that add no code to the page and observe no individual learner, and SHALL NOT be measured by any script running in a learner's browser.

#### Scenario: Search Console is permitted, page analytics are not

- **WHEN** search performance is monitored
- **THEN** it is done through a search engine's own webmaster console using a verification file or DNS record, which requires no script on the page, and the privacy requirement forbidding third-party requests and telemetry remains fully in force

#### Scenario: No tracking parameter is ever added to an outbound link

- **WHEN** the site links to its own or an external page
- **THEN** the URL carries no campaign, referral, or identifier parameter

### Requirement: Content Quality Over Volume

The project SHALL pursue search visibility only by publishing genuinely useful material, and SHALL NOT use techniques that trade a reader's interest for a ranking.

#### Scenario: Prohibited techniques are named and absent

- **WHEN** the site is audited
- **THEN** it contains no doorway pages, no keyword-permutation landing pages, no hidden or cloaked text, no link exchanges, and no machine-generated pages published without human review

#### Scenario: Health content is held to a higher bar

- **WHEN** any page carrying clinical statements is published
- **THEN** it names its reviewer and their credential, cites its sources, and shows its review date on the page, because search engines and readers both judge health content by whether its authorship and provenance are visible
