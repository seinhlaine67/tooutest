# TooU Phase 1 Backend Handoff

## Purpose

This document is the Phase 1 backend handoff for TooU.

It is meant for the backend developer who will connect the current frontend to Supabase.

Phase 1 should cover the first real production loop:

`signup -> create reader profile -> optionally create creator profile -> upload series and episodes -> show published series on Home and Explore -> open detail page -> read instantly -> bookmark / favorite / like -> update series views and likes`

This document includes:

- product flow
- Phase 1 scope
- recommended Supabase schema
- storage guidance
- API responsibilities
- JSON response shapes expected by the frontend
- which saved fields are expected to appear on which frontend pages

This schema is intentionally designed so we can expand it later in Phase 2 without breaking Phase 1 data.

---

## Recommended Stack For Phase 1

- `Supabase Auth` for signup, login, logout, session
- `Supabase Postgres` for relational app data
- `Supabase Storage` for avatars, covers, hero images, thumbnails, and episode media
- `Row Level Security` for profile ownership and creator-only write access

Important architecture rule:

- readers and creators must use the same auth account
- creator is an extension of a reader, not a separate account
- studio profile is also a creator profile, not a separate account type outside the creator system

That means:

- `individual creator` and `studio account` are both stored in `creator_profiles`
- the difference is controlled by `creator_type`
- both should be handled by the same auth and creator access flow

---

## Phase 1 Product Scope

### Included

- reader signup and login
- reader profile creation
- creator profile creation
- creator-only access to upload workspace
- series creation
- episode creation
- support for visual episodes and text chapters
- draft / scheduled / published episode states
- public published series listing on Home
- public published series listing on Explore
- public series detail page
- public episode reader
- series view increment when a reader enters a series
- bookmark series
- favorite series
- like episode
- comment on episodes
- edit own episode comments
- delete own episode comments
- series total likes rolled up from episode likes
- studio can add existing creators as artists / team members
- studio page shows those artists in a horizontally scrollable artist section
- studio artist cards link to each creator's own separate creator profile

### Not included yet

- payments
- egg purchases
- premium purchase unlocks
- creator payouts
- notifications backend
- advanced analytics dashboards
- community feed backend
- recommendation engine

Note:

The frontend currently has some local-only comment and community behavior, but for this handoff we are keeping Phase 1 focused on auth, profile, upload, listing, reading, and core reader interactions.

---

## App Flow To Build In Phase 1

### 1. Reader signup and session

Flow:

- user signs up with Supabase Auth
- backend creates one `profiles` row for that auth user
- frontend can fetch current session and current reader profile

Required outcome:

- every signed-in user has one stable user ID
- every signed-in user has one app profile row

### 2. Creator onboarding

Flow:

- signed-in reader chooses to become a creator
- reader completes creator registration
- backend creates one `creator_profiles` row tied to the same `profiles.id`
- if the creator is an `individual`, creator profile stores individual creator presentation data
- if the creator is a `studio`, creator profile stores studio presentation data in the same table using `creator_type = 'studio'`

Required outcome:

- one login account can be both reader and creator
- upload page is allowed only if creator profile exists
- studio profile is treated as a creator profile with studio presentation, not as a separate backend system

### 3. Creator upload flow

Flow:

- creator enters upload workspace
- creator creates one series
- creator adds one or more episodes
- content can be:
  - `visual` for webtoon / comics
  - `text` for novel / knowledge
- each episode can be:
  - `draft`
  - `scheduled`
  - `published`

Required outcome:

- published content becomes publicly listable
- draft and scheduled content stays creator-side only

### 4. Public browsing

Flow:

- Home page shows published series by category
- Explore page shows published series with filters
- cards show real data from backend, not hardcoded local arrays

Required outcome:

- newly published series appear in Home and Explore
- cards include cover, title, creator, genre, views, likes, and content type

### 5. Reading flow

Flow:

- reader clicks a series card
- backend increments series views by `+1`
- detail page loads series metadata and episode list
- reader opens an episode and reads immediately

Required outcome:

- every series open should register one view event
- detail page shows updated total views
- cards can later show updated views after refresh / re-fetch

### 6. Reader interactions

Flow:

- reader can bookmark a series
- reader can favorite a series
- reader can like an episode
- reader can comment on an episode
- reader can edit own episode comment
- reader can delete own episode comment

Required outcome:

- bookmark and favorite are stored per user per series
- episode like is stored per user per episode
- episode comments are stored per user per episode
- comment rows support edit state
- series total likes are derived from episode likes, or cached from them
- detail page and listing cards show the same series like total

---

## What The User Sees After Signup

This section is important because the backend developer asked what the real app flow looks like after account creation.

### A. Right after reader signup

After the user signs up:

- the user should be authenticated
- the app should be able to load the reader profile immediately
- the user should be redirected into the signed-in reader experience

What the user can see or do:

- open [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html) and see the signup information they just entered
- browse [index.html](/C:/Users/DELL/Downloads/Toou1st/index.html)
- browse [explore.html](/C:/Users/DELL/Downloads/Toou1st/explore.html)
- open [detail.html](/C:/Users/DELL/Downloads/Toou1st/detail.html)
- bookmark and favorite a series once interactions are connected to backend
- choose to become a creator through the creator registration flow

### B. If the user becomes an individual creator

After individual creator registration:

- the same signed-in account should now have a `creator_profiles` row
- the creator should be allowed into creator-only pages
- the creator should be able to upload series and episodes

What the creator can see or do:

- open creator profile / dashboard pages
- create series
- create episodes
- publish, draft, or schedule episodes
- have published content appear on Home and Explore

### C. If the user becomes a studio creator

After studio creator registration:

- the same signed-in account should now have a `creator_profiles` row with `creator_type = 'studio'`
- the studio profile is still part of the creator system
- the studio should use the same upload permissions as any other creator

What the studio can see or do:

- open creator dashboard
- maintain studio profile fields
- upload series under the studio identity
- have published works show publicly under the studio creator identity

### D. If the user is signed in but not a creator

Expected behavior:

- user can browse and read public content
- user cannot enter creator-only upload flow
- user should be redirected to creator registration if trying to access creator-only publishing features

### E. If the user is not signed in

Expected behavior:

- user may browse public content if product allows it
- any protected write action should require auth
- bookmark, favorite, upload, and profile editing should require login

---

## Core Data Model

The Phase 1 schema should stay normalized enough for future growth.

Recommended core entities:

1. `profiles`
2. `creator_profiles`
3. `series`
4. `episodes`
5. `episode_pages`
6. `episode_text_blocks`
7. `series_bookmarks`
8. `series_favorites`
9. `episode_likes`
10. `series_view_events`
11. `studio_memberships`
12. `episode_comments`

Optional but recommended for performance:

13. `series_stats`

`series_stats` can cache totals so Home, Explore, and Detail do not need heavy aggregation queries on every request.

---

## Supabase Tables

### 1. `profiles`

Purpose:

- main reader profile table
- one row per authenticated user

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | should match `auth.users.id` |
| `email` | `text` | usually copied from auth |
| `username` | `text` unique | public handle |
| `display_name` | `text` | nullable |
| `avatar_url` | `text` | public storage URL |
| `cover_url` | `text` | optional reader profile cover |
| `bio` | `text` | optional |
| `phone_number` | `text` | optional |
| `birthdate` | `date` | optional |
| `place` | `text` | optional |
| `content_interests` | `jsonb` | array of strings |
| `genre_interests` | `jsonb` | array of strings |
| `is_creator` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Notes:

- no passwords here
- auth credentials remain in Supabase Auth

### 2. `creator_profiles`

Purpose:

- creator-specific identity and presentation data
- one reader can have at most one creator profile in Phase 1

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` unique FK -> `profiles.id` | same person as reader |
| `creator_type` | `text` | `individual` or `studio` |
| `display_name` | `text` | creator / studio public name |
| `studio_name` | `text` | optional, mainly for studio-mode fields |
| `slug` | `text` unique | public profile path |
| `avatar_url` | `text` | profile picture |
| `hero_image_url` | `text` | cover / hero image |
| `bio` | `text` | about text |
| `phone_number` | `text` | optional |
| `national_id_url` | `text` | private storage reference if needed |
| `primary_format` | `text` | optional |
| `content_categories` | `jsonb` | array of strings |
| `artist_style` | `text` | optional |
| `publishing_goals` | `text` | optional |
| `portfolio_url` | `text` | optional |
| `verification_status` | `text` | `pending`, `verified`, `rejected` |
| `heat_score` | `numeric(3,1)` | default `0.0` |
| `followers_count` | `integer` | default `0` |
| `total_views_count` | `integer` | default `0` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Notes:

- if creator type is `studio`, this row still lives here


### 2A. `studio_memberships`

Purpose:

- connects a studio creator profile to individual creator profiles
- allows one studio to feature multiple creators as team members

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `studio_creator_profile_id` | `uuid` FK -> `creator_profiles.id` | must reference a row where `creator_type = 'studio'` |
| `member_creator_profile_id` | `uuid` FK -> `creator_profiles.id` | usually an individual creator |
| `role_label` | `text` | examples: `Writer`, `Illustrator`, `Editor` |
| `membership_status` | `text` | `active`, `pending`, `removed` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(studio_creator_profile_id, member_creator_profile_id)`

When this table is needed:

- a studio account can search for existing creator accounts
- a studio account can add those creators into its team
- the studio profile page should display those creators under the studio artist section
- clicking a studio team member should still open that creator's own profile page

This exact flow is part of the current product requirement, so `studio_memberships` is part of Phase 1 scope.

### 3. `series`

Purpose:

- one row per series
- main content object used by Home, Explore, Detail

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `creator_profile_id` | `uuid` FK -> `creator_profiles.id` | owner |
| `title` | `text` | |
| `slug` | `text` unique | public path |
| `type` | `text` | `webtoon`, `comics`, `novel`, `knowledge` |
| `genre` | `text` | |
| `audience` | `text` | |
| `synopsis` | `text` | |
| `cover_url` | `text` | card image |
| `hero_image_url` | `text` | detail page hero |
| `author_name` | `text` | denormalized for easy listing |
| `hashtags` | `jsonb` | array of strings |
| `default_access_type` | `text` | `free` or `premium` |
| `publication_status` | `text` | `draft` or `published` |
| `published_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Recommended indexes:

- unique index on `slug`
- index on `(publication_status, published_at desc)`
- index on `(type, publication_status)`
- index on `(creator_profile_id, created_at desc)`

### 4. `episodes`

Purpose:

- one row per episode or chapter under a series

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `series_id` | `uuid` FK -> `series.id` | |
| `title` | `text` | |
| `episode_number` | `integer` | order within series |
| `content_mode` | `text` | `visual` or `text` |
| `access_type` | `text` | `free` or `premium` |
| `publication_status` | `text` | `draft`, `scheduled`, `published` |
| `thumbnail_url` | `text` | optional |
| `notes` | `text` | optional |
| `scheduled_for` | `timestamptz` | nullable |
| `published_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(series_id, episode_number)`

Recommended indexes:

- index on `(series_id, episode_number asc)`
- index on `(series_id, publication_status, published_at desc)`

### 5. `episode_pages`

Purpose:

- ordered image pages for webtoon and comics episodes

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `episode_id` | `uuid` FK -> `episodes.id` | |
| `image_url` | `text` | storage URL |
| `sort_order` | `integer` | page order |
| `created_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(episode_id, sort_order)`

### 6. `episode_text_blocks`

Purpose:

- text content for novel and knowledge chapters

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `episode_id` | `uuid` FK -> `episodes.id` | |
| `body` | `text` | full text block |
| `sort_order` | `integer` | supports future multi-block chapters |
| `created_at` | `timestamptz` | default `now()` |

For Phase 1:

- one block per chapter is acceptable
- still keep `sort_order` so the model can expand later

### 7. `series_bookmarks`

Purpose:

- user bookmark state for a series

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK -> `profiles.id` | |
| `series_id` | `uuid` FK -> `series.id` | |
| `created_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(user_id, series_id)`

### 8. `series_favorites`

Purpose:

- user favorite state for a series

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK -> `profiles.id` | |
| `series_id` | `uuid` FK -> `series.id` | |
| `created_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(user_id, series_id)`

### 9. `episode_likes`

Purpose:

- per-user episode likes
- powers series total likes

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` FK -> `profiles.id` | |
| `episode_id` | `uuid` FK -> `episodes.id` | |
| `series_id` | `uuid` FK -> `series.id` | denormalized for easier aggregation |
| `created_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(user_id, episode_id)`

Recommended indexes:

- index on `(series_id)`
- index on `(episode_id)`

### 10. `series_view_events`

Purpose:

- append-only series view tracking
- one row per registered view event

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `series_id` | `uuid` FK -> `series.id` | |
| `user_id` | `uuid` FK -> `profiles.id` nullable | nullable for anonymous if later allowed |
| `session_key` | `text` | optional dedupe key |
| `created_at` | `timestamptz` | default `now()` |

Notes:

- if product wants exactly one view per page entry, backend can simply insert one event whenever detail is opened
- if dedupe is needed later, use `session_key`

### 11. `studio_memberships`

Purpose:

- connects a studio creator profile to individual creator profiles
- allows one studio to feature multiple creators as team members

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `studio_creator_profile_id` | `uuid` FK -> `creator_profiles.id` | must reference a row where `creator_type = 'studio'` |
| `member_creator_profile_id` | `uuid` FK -> `creator_profiles.id` | usually an individual creator |
| `role_label` | `text` | examples: `Writer`, `Illustrator`, `Editor` |
| `membership_status` | `text` | `active`, `pending`, `removed` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

Recommended constraints:

- unique `(studio_creator_profile_id, member_creator_profile_id)`

### 12. `episode_comments`

Purpose:

- stores reader comments under each episode
- supports edit and delete behavior for the reader's own comments

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `episode_id` | `uuid` FK -> `episodes.id` | |
| `series_id` | `uuid` FK -> `series.id` | useful for joins and moderation later |
| `user_id` | `uuid` FK -> `profiles.id` | comment author |
| `body` | `text` | comment text |
| `is_edited` | `boolean` | default `false` |
| `edited_at` | `timestamptz` | nullable |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |
| `deleted_at` | `timestamptz` | nullable if soft delete is preferred |

Recommended indexes:

- index on `(episode_id, created_at desc)`
- index on `(user_id, created_at desc)`

Recommendation:

- if the UI should preserve conversation structure cleanly later, start with flat comments now
- replies can be added in Phase 2 through a separate `parent_comment_id`

### 13. `series_stats` optional but recommended

Purpose:

- cached totals for fast listing and detail queries

Suggested fields:

| column | type | notes |
| --- | --- | --- |
| `series_id` | `uuid` PK FK -> `series.id` | one row per series |
| `views_count` | `integer` | default `0` |
| `likes_count` | `integer` | default `0` |
| `bookmarks_count` | `integer` | default `0` |
| `favorites_count` | `integer` | default `0` |
| `episodes_count` | `integer` | default `0` |
| `updated_at` | `timestamptz` | default `now()` |

Recommendation:

- maintain this with triggers or small backend functions
- much cheaper than aggregating from raw events on every Home / Explore request

---

## Storage Design

Do not store image binaries inside Postgres rows.

Use Supabase Storage.

### Recommended buckets

- `profile-avatars`
- `profile-covers`
- `creator-heroes`
- `creator-verification` private
- `series-covers`
- `series-heroes`
- `episode-thumbnails`
- `episode-media`

### File visibility

- `creator-verification` should be private
- public content media can be public in Phase 1
- premium media protection can come later

---

## RLS / Permission Rules

Minimum recommended rules:

### `profiles`

- user can read own profile
- public can read safe public profile fields if needed
- user can update only own row

### `creator_profiles`

- creator can read own row
- public can read public creator profiles
- creator can update only own row
- only authenticated user can create a creator profile for self

### `series`

- creator can create series only if they own the matching `creator_profile_id`
- creator can update only their own series
- public can read only `publication_status = 'published'`

### `episodes`

- creator can create and update episodes only under own series
- public can read only published episodes belonging to published series

### `series_bookmarks`, `series_favorites`, `episode_likes`

- authenticated users can create and delete only their own interaction rows
- users can read only their own interaction rows unless admin logic says otherwise

### `series_view_events`

- service role or edge function can insert
- if the frontend inserts directly, restrict to authenticated users only in Phase 1

### `studio_memberships`

- public can read active studio memberships for public studio profiles
- studio owner can create, update, and remove memberships only for their own studio creator profile
- member creator rows should reference existing `creator_profiles` rows

### `episode_comments`

- public can read comments for published episodes if product wants open discussion
- authenticated users can create comments only as themselves
- authenticated users can update only their own comments
- authenticated users can delete only their own comments unless moderation is added later

---

## Backend Responsibilities

The backend does not need to use these exact route names, but it must provide these capabilities.

### Auth

- signup
- login
- logout
- get current session

### Profiles

- get current reader profile
- create or upsert current reader profile
- update current reader profile

### Creator profile

- create creator profile
- get current creator profile
- update current creator profile
- check whether current user is a creator
- for studio accounts, add existing creators into studio team
- list studio team members
- remove studio team members

### Series

- create series
- update creator-owned series
- list creator-owned series
- list public published series
- get public series detail by `id` or `slug`
- return Home page sections using the ranking rules in this document
- return Explore page category feeds using genre and popularity rules in this document

### Episodes

- create episode
- update episode
- list creator-owned episodes
- list public published episodes for a series
- get single readable episode

### Interactions

- add bookmark
- remove bookmark
- add favorite
- remove favorite
- like episode
- unlike episode
- register series view
- create episode comment
- update own episode comment
- delete own episode comment

---

## JSON Shapes Expected By Frontend

These are recommended response shapes.

The exact names can change, but the data contract should stay close to this.

---

## Home And Explore Content Rules

This section should be treated as product logic for backend listing queries.

The backend developer asked what should appear after a creator uploads content and how it should be placed on Home and Explore.

The rules below are the intended Phase 1 behavior.

### General rule for public listing

- only publicly visible published series should appear on Home and Explore
- draft episodes and draft series should never appear publicly
- scheduled episodes should appear publicly only after their publish time passes
- card counts should come from backend totals, not local frontend guesses

### Card data required for Home and Explore

Every public card payload should include at least:

- `id`
- `slug`
- `title`
- `type`
- `genre`
- `coverUrl`
- `heroImageUrl` if available
- `authorName`
- `stats.views`
- `stats.likes`
- `badges`
- `publishedAt`
- `latestEpisodePublishedAt`

### Ranking formulas

To make the backend implementation clear, use these definitions:

- `views_count`: total series views
- `likes_count`: total series likes
- `popularity_score`: `views_count + likes_count`
- `average_score`: a midpoint-style score based on average scale of views and likes across current public content

The backend does not need a mathematically complex recommendation engine in Phase 1.

Simple query logic is acceptable as long as the result follows these business rules.

### Home: `Trending Now`

Purpose:

- show the strongest currently performing content

Rule:

- rank by highest `views_count` and highest `likes_count`
- backend may implement this as ordering by `popularity_score desc`

Recommended query behavior:

- published series only
- order by `popularity_score desc`, then `published_at desc`

### Home: `New Releases`

Purpose:

- show newly launched series and series with newly released episodes

Rule:

- if a new episode was released recently, the series should appear here with a `New Ep` style badge
- if a series itself was first published within the last 30 days, it should continue to appear here as `New`

Recommended query behavior:

- include published series where either:
  - `series.published_at >= now() - interval '30 days'`
  - or the latest published episode is recent
- order by newest relevant publish activity first

Recommended backend helper fields:

- `isNewSeries`
- `hasNewEpisode`
- `latestEpisodePublishedAt`

Badge rule:

- `hasNewEpisode = true` should map to `New Ep`
- else if `isNewSeries = true` should map to `New`

### Home: `TOOU Top Picks`

Purpose:

- mix very strong content with solid average-performing content

Rule:

- half of the rail should come from highest-performing content
- half of the rail should come from average-performing content

Recommended query behavior:

1. take top content ordered by `popularity_score desc`
2. take average-content pool around the middle performance band
3. merge them into one section

Practical backend definition for average-performing content:

- exclude the top extreme performers
- exclude the lowest performers
- select from the middle band by `popularity_score`

This does not need ML.

A simple percentile or middle-slice query is good enough for Phase 1.

### Home: `Binge-worthy Series`

Purpose:

- surface content that deserves discovery, not only already dominant hits

Rule:

- mix lower-view content with average-view content
- do not make this rail only the biggest hits

Recommended query behavior:

- take a portion from low-view published content
- take a portion from average-view published content
- merge and sort by freshness or engagement quality

Practical backend recommendation:

- use `views_count asc` bands for discovery candidates
- filter out completely empty or inactive content if needed

### Home: `Knowledge Books`

Purpose:

- show top knowledge-category series

Rule:

- only `type = 'knowledge'`
- sort by highest views and likes

Recommended query behavior:

- filter by `type = 'knowledge'`
- order by `popularity_score desc`

### Home: genre rails

Purpose:

- place each series into its matching genre section

Rule:

- romance series go to romance rail
- action series go to action rail
- mystery series go to mystery rail
- fantasy series go to fantasy rail
- horror series go to horror rail
- comedy series go to comedy rail

Recommended query behavior:

- filter published series by `genre`
- order by `popularity_score desc` or newest as needed per section

### Explore: popularity ranking

Purpose:

- show the strongest content first when Explore is in popularity mode

Rule:

- highest views and highest likes should rank first

Recommended query behavior:

- order by `popularity_score desc`

### Explore: category and genre filtering

Purpose:

- let readers browse by type and genre

Rule:

- content should appear in the matching category or genre feed only
- for example:
  - romance in romance
  - action in action
  - mystery in mystery
  - fantasy in fantasy
  - horror in horror
  - comedy in comedy

Recommended query behavior:

- filter by `type` and/or `genre`
- then apply ranking requested by current Explore mode

### Recommendation to backend developer

For Phase 1, the cleanest implementation is to expose either:

1. one `home_sections` endpoint that already returns pre-grouped rails
2. or separate endpoints per rail, each following the rules above

Option 1 is usually easier for the frontend.

Suggested grouped response shape:

```json
{
  "sections": {
    "trendingNow": [],
    "newReleases": [],
    "toouTopPicks": [],
    "bingeWorthy": [],
    "knowledgeBooks": [],
    "romance": [],
    "action": [],
    "mystery": [],
    "fantasy": [],
    "horror": [],
    "comedy": []
  }
}
```

### 1. Session payload

```json
{
  "user": {
    "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
    "email": "mira@example.com"
  },
  "profile": {
    "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
    "username": "mira",
    "displayName": "Mira",
    "avatarUrl": "https://...",
    "isCreator": true
  },
  "creatorProfile": {
    "id": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
    "creatorType": "individual",
    "displayName": "Mira Lynn",
    "slug": "mira-lynn"
  }
}
```

### 1A. Reader signup payload

These are the current frontend signup fields from [signup.html](/C:/Users/DELL/Downloads/Toou1st/signup.html).

```json
{
  "email": "mira@example.com",
  "password": "plain password handled by auth only",
  "username": "mira",
  "phoneNumber": "09xxxxxxxxx",
  "birthdate": "2001-06-03",
  "place": "Yangon",
  "avatarFile": "binary upload",
  "contentInterests": ["Novel", "Knowledge"],
  "genreInterests": ["Fantasy", "Mystery"]
}
```

Recommended backend result after successful signup:

```json
{
  "user": {
    "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
    "email": "mira@example.com"
  },
  "profile": {
    "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
    "username": "mira",
    "displayName": "mira",
    "phoneNumber": "09xxxxxxxxx",
    "birthdate": "2001-06-03",
    "place": "Yangon",
    "avatarUrl": "https://...",
    "contentInterests": ["Novel", "Knowledge"],
    "genreInterests": ["Fantasy", "Mystery"],
    "isCreator": false
  }
}
```

### 1B. Creator registration payload

These are the current creator registration fields from [publish.html](/C:/Users/DELL/Downloads/Toou1st/publish.html).

```json
{
  "creatorType": "individual",
  "displayName": "Mira Lynn",
  "studioName": "",
  "studioHeroImageFile": null,
  "phoneNumber": "+95 9...",
  "nationalId": "12/ABC(N)123456",
  "primaryFormat": "novel",
  "creatorFormats": ["novel", "knowledge"],
  "artistStyle": "prose-first",
  "goals": "serialized fantasy novel",
  "bio": "Writer of magical academy stories",
  "portfolio": "https://..."
}
```

Studio example:

```json
{
  "creatorType": "studio",
  "displayName": "TooU Originals",
  "studioName": "TooU Studio",
  "studioHeroImageFile": "binary upload",
  "phoneNumber": "+95 9...",
  "nationalId": "12/ABC(N)123456",
  "primaryFormat": "webtoon",
  "creatorFormats": ["webtoon", "comics"],
  "artistStyle": "cinematic",
  "goals": "weekly studio webtoon slate",
  "bio": "A shared studio identity",
  "portfolio": "https://..."
}
```

Recommended backend result after creator registration:

```json
{
  "creatorProfile": {
    "id": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
    "userId": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
    "creatorType": "studio",
    "displayName": "TooU Originals",
    "studioName": "TooU Studio",
    "slug": "toou-originals",
    "avatarUrl": "https://...",
    "heroImageUrl": "https://...",
    "phoneNumber": "+95 9...",
    "primaryFormat": "webtoon",
    "contentCategories": ["webtoon", "comics"],
    "artistStyle": "cinematic",
    "goals": "weekly studio webtoon slate",
    "bio": "A shared studio identity",
    "portfolioUrl": "https://...",
    "verificationStatus": "pending"
  }
}
```

### 2. Public series card payload for Home / Explore

```json
{
  "id": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "slug": "moonlit-pages",
  "title": "Moonlit Pages",
  "type": "novel",
  "genre": "Fantasy",
  "audience": "Teen",
  "coverUrl": "https://...",
  "heroImageUrl": "https://...",
  "authorName": "Mira Lynn",
  "creator": {
    "id": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
    "slug": "mira-lynn",
    "displayName": "Mira Lynn"
  },
  "stats": {
    "views": 1204,
    "likes": 284
  },
  "badges": [
    "new"
  ],
  "isNewSeries": true,
  "hasNewEpisode": false,
  "latestEpisodePublishedAt": "2026-04-05T08:00:00Z",
  "popularityScore": 1488,
  "publishedAt": "2026-04-05T08:00:00Z"
}
```

### 3. Public series detail payload

```json
{
  "id": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "slug": "moonlit-pages",
  "title": "Moonlit Pages",
  "type": "novel",
  "genre": "Fantasy",
  "audience": "Teen",
  "synopsis": "A story about...",
  "coverUrl": "https://...",
  "heroImageUrl": "https://...",
  "hashtags": ["magic", "academy"],
  "defaultAccessType": "free",
  "authorName": "Mira Lynn",
  "creator": {
    "id": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
    "slug": "mira-lynn",
    "displayName": "Mira Lynn",
    "avatarUrl": "https://..."
  },
  "stats": {
    "views": 1204,
    "likes": 284,
    "bookmarks": 97,
    "favorites": 65
  },
  "viewerState": {
    "bookmarked": true,
    "favorited": false
  },
  "episodes": [
    {
      "id": "dad1f2d0-6e34-4ed0-bf2f-529f1f444444",
      "episodeNumber": 1,
      "title": "Chapter 1",
      "contentMode": "text",
      "accessType": "free",
      "publicationStatus": "published",
      "publishedAt": "2026-04-05T08:00:00Z"
    }
  ]
}
```

### 4. Episode reader payload for visual content

```json
{
  "id": "dad1f2d0-6e34-4ed0-bf2f-529f1f444444",
  "seriesId": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "episodeNumber": 2,
  "title": "Episode 2",
  "contentMode": "visual",
  "accessType": "free",
  "notes": "",
  "thumbnailUrl": "https://...",
  "pages": [
    {
      "id": "56fe0d4d-4db0-4092-9fdf-2ef3a3555555",
      "imageUrl": "https://...",
      "sortOrder": 1
    },
    {
      "id": "66fe0d4d-4db0-4092-9fdf-2ef3a3666666",
      "imageUrl": "https://...",
      "sortOrder": 2
    }
  ],
  "viewerState": {
    "liked": false
  },
  "stats": {
    "episodeLikes": 12,
    "seriesLikes": 284
  },
  "comments": [
    {
      "id": "cb1f54d0-42e5-4819-9661-011223344556",
      "body": "This chapter was worth the wait.",
      "isEdited": false,
      "createdAt": "2026-04-05T09:10:00Z",
      "updatedAt": "2026-04-05T09:10:00Z",
      "author": {
        "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
        "username": "mira",
        "displayName": "Mira",
        "avatarUrl": "https://..."
      },
      "viewerState": {
        "canEdit": true,
        "canDelete": true
      }
    }
  }
}
```

### 5. Episode reader payload for text content

```json
{
  "id": "dad1f2d0-6e34-4ed0-bf2f-529f1f444444",
  "seriesId": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "episodeNumber": 1,
  "title": "Chapter 1",
  "contentMode": "text",
  "accessType": "free",
  "notes": "",
  "textBlocks": [
    {
      "id": "a2df0f88-6ab7-41b8-ae0e-aabbcc777777",
      "body": "The first paragraph of the chapter...",
      "sortOrder": 1
    }
  ],
  "viewerState": {
    "liked": true
  },
  "stats": {
    "episodeLikes": 12,
    "seriesLikes": 284
  },
  "comments": [
    {
      "id": "cb1f54d0-42e5-4819-9661-011223344556",
      "body": "The prose is really strong here.",
      "isEdited": true,
      "createdAt": "2026-04-05T09:10:00Z",
      "updatedAt": "2026-04-05T09:15:00Z",
      "author": {
        "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
        "username": "mira",
        "displayName": "Mira",
        "avatarUrl": "https://..."
      },
      "viewerState": {
        "canEdit": true,
        "canDelete": true
      }
    }
  }
}
```

### 6. Interaction response: bookmark / favorite

```json
{
  "seriesId": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "bookmarked": true,
  "favorited": false,
  "stats": {
    "bookmarks": 98,
    "favorites": 65
  }
}
```

### 7. Interaction response: episode like

```json
{
  "episodeId": "dad1f2d0-6e34-4ed0-bf2f-529f1f444444",
  "seriesId": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "liked": true,
  "stats": {
    "episodeLikes": 13,
    "seriesLikes": 285
  }
}
```

### 8. Interaction response: series view registration

```json
{
  "seriesId": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "stats": {
    "views": 1205
  }
}
```

### 9. Episode comment create / update response

```json
{
  "comment": {
    "id": "cb1f54d0-42e5-4819-9661-011223344556",
    "episodeId": "dad1f2d0-6e34-4ed0-bf2f-529f1f444444",
    "seriesId": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
    "body": "This chapter was worth the wait.",
    "isEdited": true,
    "createdAt": "2026-04-05T09:10:00Z",
    "updatedAt": "2026-04-05T09:15:00Z",
    "author": {
      "id": "6aa1c52f-7f1b-4cc7-a654-0e6a3a111111",
      "username": "mira",
      "displayName": "Mira",
      "avatarUrl": "https://..."
    }
  }
}
```

### 10. Creator-owned series payload

```json
{
  "id": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
  "title": "Moonlit Pages",
  "type": "novel",
  "publicationStatus": "published",
  "defaultAccessType": "free",
  "stats": {
    "views": 1204,
    "likes": 284,
    "episodes": 12
  },
  "episodes": [
    {
      "id": "dad1f2d0-6e34-4ed0-bf2f-529f1f444444",
      "episodeNumber": 1,
      "title": "Chapter 1",
      "publicationStatus": "published",
      "accessType": "free",
      "scheduledFor": null,
      "publishedAt": "2026-04-05T08:00:00Z"
    },
    {
      "id": "00a1f2d0-6e34-4ed0-bf2f-529f1f888888",
      "episodeNumber": 2,
      "title": "Chapter 2",
      "publicationStatus": "scheduled",
      "accessType": "premium",
      "scheduledFor": "2026-04-07T08:00:00Z",
      "publishedAt": null
    }
  ]
}
```

### 11. Public studio profile payload

```json
{
  "id": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
  "creatorType": "studio",
  "slug": "toou-originals",
  "displayName": "TooU Originals",
  "studioName": "TooU Studio",
  "avatarUrl": "https://...",
  "heroImageUrl": "https://...",
  "bio": "A shared studio identity",
  "stats": {
    "followers": 1240,
    "totalViews": 58000,
    "heat": 9.8
  },
  "artists": [
    {
      "membershipId": "9ef1cb98-c0f3-4d98-9fff-011223344556",
      "creatorProfileId": "1ab2c3d4-e5f6-4789-9abc-011223344556",
      "slug": "mira-lynn",
      "displayName": "Mira Lynn",
      "avatarUrl": "https://...",
      "roleLabel": "Lead Illustrator"
    }
  ],
  "featuredWorks": [
    {
      "id": "3b6b704e-d5fa-4df1-8e32-3d7e8d333333",
      "slug": "moonlit-pages",
      "title": "Moonlit Pages",
      "coverUrl": "https://...",
      "genre": "Fantasy",
      "stats": {
        "views": 1204,
        "likes": 284
      }
    }
  ]
}
```

### 12. Studio membership write payload

```json
{
  "studioCreatorProfileId": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
  "memberCreatorProfileId": "1ab2c3d4-e5f6-4789-9abc-011223344556",
  "roleLabel": "Lead Illustrator"
}
```

Recommended success response:

```json
{
  "membership": {
    "id": "9ef1cb98-c0f3-4d98-9fff-011223344556",
    "studioCreatorProfileId": "f91e6bb7-c8b3-44f7-8a4b-0f4a4a222222",
    "memberCreatorProfileId": "1ab2c3d4-e5f6-4789-9abc-011223344556",
    "roleLabel": "Lead Illustrator",
    "membershipStatus": "active"
  }
}
```

---

## Field-To-Page Mapping

This section tells the backend developer where the saved data will appear in the frontend.

### Reader signup fields

Saved from [signup.html](/C:/Users/DELL/Downloads/Toou1st/signup.html):

| input field | backend field | shown on frontend |
| --- | --- | --- |
| `username` | `profiles.username` | [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html), nav/profile surfaces |
| `email` | `profiles.email` | profile/account surfaces |
| `phoneNumber` | `profiles.phone_number` | [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html) / profile editor |
| `birthdate` | `profiles.birthdate` | [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html) / profile editor |
| `place` | `profiles.place` | [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html) / profile editor |
| `avatar` | `profiles.avatar_url` | [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html), comment headers, community headers |
| `contentInterests` | `profiles.content_interests` | reader preference surfaces later |
| `genreInterests` | `profiles.genre_interests` | reader preference surfaces later |

### Creator registration fields

Saved from [publish.html](/C:/Users/DELL/Downloads/Toou1st/publish.html):

| input field | backend field | shown on frontend |
| --- | --- | --- |
| `creatorType` | `creator_profiles.creator_type` | creator/studio page logic |
| `displayName` | `creator_profiles.display_name` | creator profile page, cards, detail page creator label |
| `studioName` | `creator_profiles.studio_name` | studio-specific profile surfaces |
| `studioHeroImage` | `creator_profiles.hero_image_url` | studio profile hero section |
| `phoneNumber` | `creator_profiles.phone_number` | creator edit/account surfaces |
| `nationalId` | private verification record | not public |
| `primaryFormat` | `creator_profiles.primary_format` | creator snapshot / profile |
| `creatorFormats` | `creator_profiles.content_categories` | creator capabilities / filters later |
| `artistStyle` | `creator_profiles.artist_style` | creator info surfaces |
| `goals` | `creator_profiles.publishing_goals` | creator info surfaces |
| `bio` | `creator_profiles.bio` | creator / studio profile about section |
| `portfolio` | `creator_profiles.portfolio_url` | creator profile / edit surfaces |

### Studio membership fields

| backend field | shown on frontend |
| --- | --- |
| `studio_memberships.member_creator_profile_id` | connects studio page artist to real creator profile |
| `studio_memberships.role_label` | shown under artist name on studio page |
| joined creator `display_name` | shown in studio artist rail |
| joined creator `avatar_url` | shown in studio artist rail |

### Series fields

| backend field | shown on frontend |
| --- | --- |
| `series.title` | Home cards, Explore cards, Detail hero, creator published works |
| `series.cover_url` | Home cards, Explore cards, creator published works |
| `series.hero_image_url` | Detail hero |
| `series.synopsis` | Detail page synopsis |
| `series.genre` | cards and detail metadata |
| `series.type` | category rails, Explore filters, detail rendering mode |
| `series.author_name` | cards and detail page |
| `series.hashtags` | detail page tag chips |

### Series stats fields

| backend field | shown on frontend |
| --- | --- |
| `series_stats.views_count` | Home cards, Explore cards, Detail hero |
| `series_stats.likes_count` | Home cards, Explore cards, Detail hero |
| `series_stats.bookmarks_count` | optional count displays later |
| `series_stats.favorites_count` | optional count displays later |

### Episode fields

| backend field | shown on frontend |
| --- | --- |
| `episodes.title` | episode list and reader header |
| `episodes.episode_number` | episode dropdown and list |
| `episodes.content_mode` | determines image reader or text reader |
| `episodes.thumbnail_url` | episode cards / editor surfaces |
| `episodes.notes` | reader supporting text |
| `episode_pages.image_url` | webtoon/comics reader body |
| `episode_text_blocks.body` | novel/knowledge reader body |

### Episode comment fields

| backend field | shown on frontend |
| --- | --- |
| `episode_comments.body` | comment text under the episode reader |
| `episode_comments.is_edited` | `Edited` label in the comment meta |
| `episode_comments.created_at` | timestamp like `Just now`, `1 hour ago` |
| joined profile `username` / `display_name` | comment header identity |
| joined profile `avatar_url` | circular avatar in comment header |

---

## Suggested Aggregation Rules

### Views

- when a reader enters a series detail page, create one `series_view_events` row
- `series_stats.views_count` increments by `+1`

### Likes

- when a reader likes an episode, create one `episode_likes` row
- `series_stats.likes_count` should represent total likes across all episodes in that series

Two acceptable approaches:

1. derive likes live with aggregate queries
2. maintain `series_stats.likes_count` with trigger / function

For performance, the second approach is better.

### Bookmarks and favorites

- bookmark and favorite are separate states
- both are per-user per-series
- counts can also be cached in `series_stats`

### Episode comments

- comments should be ordered newest-first or oldest-first consistently across the product
- current reader experience is easiest if comments are returned already ordered by `created_at asc`
- comment edit should set `is_edited = true` and update `edited_at`

---

## Suggested Implementation Order

### Step 1

Set up Supabase Auth and session retrieval.

### Step 2

Create `profiles` and auto-create one profile row after signup.

### Step 3

Create `creator_profiles` and mark `profiles.is_creator = true`.

### Step 4

Protect upload access so only authenticated creators can create series or episodes.

### Step 5

Implement series and episode creation with Storage uploads.

### Step 6

Implement public Home and Explore listing from published series.

### Step 7

Implement detail and episode reader endpoints.

### Step 8

Implement bookmarks, favorites, likes, views, and episode comments.

### Step 9

Add `series_stats` optimization if needed immediately.

---

## Notes For Phase 2 Later

These are intentionally postponed:

- follows
- community posts and replies
- purchases and premium unlocking
- notification center
- creator earnings
- payment integration

The current Phase 1 schema is designed so these can be added later with separate tables instead of rewriting the base account and content model.

---

## Final Direction To Backend Developer

Please treat this as the minimum real backend for launchable Phase 1 behavior.

The most important business rules are:

- one auth account per person
- reader and creator share the same auth identity
- only creators can upload
- only published content appears publicly
- entering a series adds one view
- liking an episode updates the series total likes
- bookmarks and favorites are stored per user per series
- episode comments belong to the episode and can be created, edited, and deleted by the comment owner
- studio accounts can add existing creators as artists while those creators keep separate profiles

If any detail needs to be simplified for the first backend pass, keep the schema stable and simplify the service logic, not the data model.

---

## Relevant Frontend Files

- [signup.html](/C:/Users/DELL/Downloads/Toou1st/signup.html)
- [publish.html](/C:/Users/DELL/Downloads/Toou1st/publish.html)
- [upload.html](/C:/Users/DELL/Downloads/Toou1st/upload.html)
- [profile.html](/C:/Users/DELL/Downloads/Toou1st/profile.html)
- [index.html](/C:/Users/DELL/Downloads/Toou1st/index.html)
- [explore.html](/C:/Users/DELL/Downloads/Toou1st/explore.html)
- [detail.html](/C:/Users/DELL/Downloads/Toou1st/detail.html)
- [assets/js/signup.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/signup.js)
- [assets/js/publish.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/publish.js)
- [assets/js/upload.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/upload.js)
- [assets/js/profile.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/profile.js)
- [assets/js/home.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/home.js)
- [assets/js/explore.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/explore.js)
- [assets/js/detail.js](/C:/Users/DELL/Downloads/Toou1st/assets/js/detail.js)
