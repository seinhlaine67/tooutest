export const creators = [
  {
    id: "creator-emma-chen",
    slug: "emma-chen",
    name: "Emma Chen",
    type: "creator",
    avatar: "/images/image1.png",
    cover: "/images/image1.png",
    bio: "Fantasy-first storyteller building emotional webtoons and long-form novel worlds for TooU readers.",
    followers: "1,250",
    rating: "4.8"
  },
  {
    id: "creator-luna-house",
    slug: "luna-house-studio",
    name: "Luna House Studio",
    type: "studio",
    avatar: "/images/logo.png",
    cover: "/images/image1.png",
    bio: "A creator studio publishing romance, fantasy, and youth-focused illustrated stories across multiple formats.",
    followers: "2,480",
    rating: "4.9"
  },
  {
    id: "creator-aria-noor",
    slug: "aria-noor",
    name: "Aria Noor",
    type: "creator",
    avatar: "/images/image1.png",
    cover: "/images/image1.png",
    bio: "Writes romance and drama stories built for quick mobile reading and emotional pacing.",
    followers: "3,180",
    rating: "4.9"
  },
  {
    id: "creator-atelier-nova",
    slug: "atelier-nova",
    name: "Atelier Nova",
    type: "studio",
    avatar: "/images/logo.png",
    cover: "/images/image1.png",
    bio: "An illustration-forward studio releasing science fiction, comedy, and experimental digital comics.",
    followers: "1,980",
    rating: "4.7"
  },
  {
    id: "creator-thant-min",
    slug: "thant-min",
    name: "Thant Min",
    type: "creator",
    avatar: "/images/image1.png",
    cover: "/images/image1.png",
    bio: "Builds action-heavy comics and knowledge-first formats with clean pacing and strong hooks.",
    followers: "1,140",
    rating: "4.6"
  },
  {
    id: "creator-paper-moon-house",
    slug: "paper-moon-house",
    name: "Paper Moon House",
    type: "studio",
    avatar: "/images/logo.png",
    cover: "/images/image1.png",
    bio: "A publishing house focused on novels, serialized mysteries, and literary horror for mobile readers.",
    followers: "2,120",
    rating: "4.8"
  }
];

export const series = [
  {
    id: "series-shadows-of-destiny",
    slug: "shadows-of-destiny",
    title: "Shadows of Destiny",
    creatorId: "creator-emma-chen",
    creatorName: "Emma Chen",
    type: "webtoon",
    genre: "Fantasy",
    views: "892K",
    likes: "45K",
    rating: "4.8",
    followers: "12.4K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New Ep",
    synopsis:
      "A warrior must unite fractured realms using ancient shadow powers before rival houses tear the kingdoms apart.",
    hashtags: ["Fantasy", "Action", "Adventure"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: The Shadow Gate",
        free: true,
        likes: "5.1K",
        views: "18.3K",
        comments: [
          { user: "Luna", body: "The opening hook is really strong." },
          { user: "Kai", body: "I like how the visual mood is introduced." }
        ],
        images: ["/images/image1.png", "/images/image1.png"]
      },
      {
        id: "ep2",
        title: "Episode 2: Echoes of Fire",
        free: true,
        likes: "4.8K",
        views: "16.9K",
        comments: [{ user: "Mira", body: "That cliffhanger was worth the build-up." }],
        images: ["/images/image1.png"]
      },
      {
        id: "ep3",
        title: "Episode 3: Oathbound",
        free: false,
        likes: "3.9K",
        views: "12.4K",
        images: ["/images/image1.png"]
      },
      {
        id: "ep4",
        title: "Episode 4: After the Ash",
        free: false,
        likes: "3.2K",
        views: "10.8K",
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-midnight-libra",
    slug: "midnight-libra",
    title: "Midnight Libra",
    creatorId: "creator-emma-chen",
    creatorName: "Emma Chen",
    type: "novel",
    genre: "Mystery",
    views: "240K",
    likes: "21K",
    rating: "4.7",
    followers: "8.9K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "Hot",
    synopsis:
      "A serialized mystery novel where every chapter shifts the balance between truth and deception.",
    hashtags: ["Mystery", "Novel", "Drama"],
    episodes: [
      {
        id: "ch1",
        title: "Chapter 1: The Red Ledger",
        free: true,
        likes: "3.3K",
        views: "11.4K",
        comments: [{ user: "Rei", body: "The prose is moody and sharp." }],
        body:
          "Rain glazed the station windows until the city beyond them looked invented.\n\nMara turned the red ledger over in her hands and felt the weight of a story someone had tried too hard to bury. The cover was cracked at the spine, the corners rubbed pale, but the lock had already been forced open.\n\nInside, every page was balanced like a confession. Dates. Payments. Names that should never have appeared beside each other.\n\nBy the time the platform announcement broke through the static, Mara understood one thing clearly: if this ledger had reached her, someone else had already failed to keep it hidden."
      }
    ]
  },
  {
    id: "series-romance-in-bloom",
    slug: "romance-in-bloom",
    title: "Romance in Bloom",
    creatorId: "creator-luna-house",
    creatorName: "Luna House Studio",
    type: "webtoon",
    genre: "Romance",
    views: "320K",
    likes: "29K",
    rating: "4.9",
    followers: "15.2K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New",
    synopsis:
      "A bright campus romance with polished panels, soft tension, and a weekly confession rhythm.",
    hashtags: ["Romance", "Campus", "Drama"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: First Bloom",
        free: true,
        likes: "6.8K",
        views: "24.8K",
        comments: [{ user: "Ari", body: "This feels instantly bingeable." }],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-psychology-101",
    slug: "psychology-101",
    title: "Psychology 101",
    creatorId: "creator-luna-house",
    creatorName: "Luna House Studio",
    type: "knowledge",
    genre: "Knowledge",
    views: "120K",
    likes: "14K",
    rating: "4.6",
    followers: "6.1K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New",
    synopsis:
      "A knowledge-first chapter series that makes complex ideas readable in short, memorable lessons.",
    hashtags: ["Knowledge", "Learning", "Mindset"],
    episodes: [
      {
        id: "lesson1",
        title: "Lesson 1: Attention and Habit",
        free: true,
        likes: "2.9K",
        views: "8.2K",
        comments: [{ user: "Min", body: "This is easy to follow on mobile." }],
        body:
          "Attention is not just about focus. It is also about what your environment keeps asking your brain to notice.\n\nHabits form when a cue appears, a behavior follows, and some kind of reward closes the loop. The more visible and repeatable the cue is, the easier the habit becomes to trigger.\n\nIf you want to build a stronger routine, make the cue obvious and reduce the friction between deciding and doing."
      }
    ]
  },
  {
    id: "series-hero-rise",
    slug: "hero-rise",
    title: "Hero Rise",
    creatorId: "creator-emma-chen",
    creatorName: "Emma Chen",
    type: "webtoon",
    genre: "Action",
    views: "210K",
    likes: "30K",
    rating: "4.8",
    followers: "10.3K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New",
    synopsis:
      "A fast-moving action webtoon about a reluctant guardian rising into a citywide legend.",
    hashtags: ["Action", "Hero", "Adventure"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: Rising Call",
        free: true,
        likes: "4.2K",
        views: "14.8K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-war-chronicles",
    slug: "war-chronicles",
    title: "War Chronicles",
    creatorId: "creator-luna-house",
    creatorName: "Luna House Studio",
    type: "comics",
    genre: "Action",
    views: "450K",
    likes: "40K",
    rating: "4.7",
    followers: "9.7K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New Ep",
    synopsis:
      "A combat-heavy series built around squad tactics, large battles, and serialized campaign arcs.",
    hashtags: ["Action", "Comics", "War"],
    episodes: [
      {
        id: "issue1",
        title: "Issue 1: First Front",
        free: true,
        likes: "5.0K",
        views: "17.2K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-urban-legend",
    slug: "urban-legend",
    title: "Urban Legend",
    creatorId: "creator-emma-chen",
    creatorName: "Emma Chen",
    type: "novel",
    genre: "Horror",
    views: "90K",
    likes: "12K",
    rating: "4.6",
    followers: "5.6K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "Late Night",
    synopsis:
      "A horror serial where each chapter peels back another layer of an impossible city myth.",
    hashtags: ["Horror", "Mystery", "Novel"],
    episodes: [
      {
        id: "ch1",
        title: "Chapter 1: Static Hallway",
        free: true,
        likes: "2.5K",
        views: "8.5K",
        comments: [],
        body:
          "The hallway hummed before it appeared.\n\nEzra had lived in the building for six years and there had never been a fourth corridor between the laundry room and the stairwell. Yet there it was tonight: narrow, fluorescent, and stretching farther than the architecture allowed.\n\nAt the far end, a television whispered through white noise. Someone laughed softly on the other side of the static, as if they already knew he would come closer."
      }
    ]
  },
  {
    id: "series-starfall",
    slug: "starfall",
    title: "Starfall",
    creatorId: "creator-luna-house",
    creatorName: "Luna House Studio",
    type: "novel",
    genre: "Horror",
    views: "60K",
    likes: "7K",
    rating: "4.5",
    followers: "4.8K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New",
    synopsis:
      "A cosmic horror title blending fear, memory, and collapsing constellations.",
    hashtags: ["Horror", "Cosmic", "Novel"],
    episodes: [
      {
        id: "ch1",
        title: "Chapter 1: Falling Quiet",
        free: true,
        likes: "1.7K",
        views: "5.8K",
        comments: [],
        body:
          "The observatory lost sound first.\n\nNot silence exactly, but a thinning, as though every familiar noise had stepped backward into deep snow. Nora looked up through the dome and saw a single star detach from its constellation like a bead slipping from a torn thread.\n\nWhen it began to fall, the night around it seemed to remember something terrible."
      }
    ]
  },
  {
    id: "series-comedy-club",
    slug: "comedy-club",
    title: "Comedy Club",
    creatorId: "creator-luna-house",
    creatorName: "Luna House Studio",
    type: "cartoon",
    genre: "Comedy",
    views: "70K",
    likes: "9K",
    rating: "4.4",
    followers: "3.1K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "Fresh",
    synopsis:
      "A short-form comedy cartoon series built around recurring sketches and punchy visual timing.",
    hashtags: ["Comedy", "Cartoon", "Slice of Life"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: Opening Night",
        free: true,
        likes: "1.9K",
        views: "6.9K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-skyline-theory",
    slug: "skyline-theory",
    title: "Skyline Theory",
    creatorId: "creator-atelier-nova",
    creatorName: "Atelier Nova",
    type: "webtoon",
    genre: "Fantasy",
    views: "540K",
    likes: "38K",
    rating: "4.9",
    followers: "11.7K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New Ep",
    synopsis:
      "A city suspended in the sky begins to break apart when one archivist uncovers a forgotten weather engine.",
    hashtags: ["Fantasy", "Sky City", "Adventure"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: The Last Forecast",
        free: true,
        likes: "4.6K",
        views: "16.1K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-crimson-ledger",
    slug: "crimson-ledger",
    title: "Crimson Ledger",
    creatorId: "creator-paper-moon-house",
    creatorName: "Paper Moon House",
    type: "novel",
    genre: "Mystery",
    views: "410K",
    likes: "26K",
    rating: "4.8",
    followers: "9.9K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "Hot",
    synopsis:
      "A finance clerk finds a ledger that predicts disasters, and each missing page points to a new crime.",
    hashtags: ["Mystery", "Novel", "Crime"],
    episodes: [
      {
        id: "ch1",
        title: "Chapter 1: Missing Balance",
        free: true,
        likes: "3.8K",
        views: "12.2K",
        comments: [],
        body:
          "The numbers stopped adding up three nights before anyone noticed the dead man."
      }
    ]
  },
  {
    id: "series-campus-signal",
    slug: "campus-signal",
    title: "Campus Signal",
    creatorId: "creator-aria-noor",
    creatorName: "Aria Noor",
    type: "webtoon",
    genre: "Romance",
    views: "275K",
    likes: "24K",
    rating: "4.7",
    followers: "8.4K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New",
    synopsis:
      "A campus radio host keeps falling for the anonymous caller whose voice appears every midnight.",
    hashtags: ["Romance", "Campus", "Drama"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: Midnight Frequency",
        free: true,
        likes: "3.1K",
        views: "11.9K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-maker-lab",
    slug: "maker-lab",
    title: "Maker Lab",
    creatorId: "creator-thant-min",
    creatorName: "Thant Min",
    type: "knowledge",
    genre: "Knowledge",
    views: "155K",
    likes: "16K",
    rating: "4.6",
    followers: "6.9K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New",
    synopsis:
      "Short, practical lessons on product building, prototyping, and digital creativity for new creators.",
    hashtags: ["Knowledge", "Learning", "Product"],
    episodes: [
      {
        id: "lesson1",
        title: "Lesson 1: Start Ugly, Improve Fast",
        free: true,
        likes: "2.4K",
        views: "7.8K",
        comments: [],
        body:
          "Good products usually begin as rough versions that become clearer after real use."
      }
    ]
  },
  {
    id: "series-laugh-protocol",
    slug: "laugh-protocol",
    title: "Laugh Protocol",
    creatorId: "creator-atelier-nova",
    creatorName: "Atelier Nova",
    type: "cartoon",
    genre: "Comedy",
    views: "185K",
    likes: "18K",
    rating: "4.5",
    followers: "5.4K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "Fresh",
    synopsis:
      "A workplace comedy set inside a futuristic lab where every experiment turns into a social disaster.",
    hashtags: ["Comedy", "Cartoon", "Sci-Fi"],
    episodes: [
      {
        id: "ep1",
        title: "Episode 1: Test Subject Zero",
        free: true,
        likes: "2.1K",
        views: "7.1K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  },
  {
    id: "series-inkfront",
    slug: "inkfront",
    title: "Inkfront",
    creatorId: "creator-thant-min",
    creatorName: "Thant Min",
    type: "comics",
    genre: "Action",
    views: "305K",
    likes: "27K",
    rating: "4.7",
    followers: "7.2K",
    image: "/images/image1.png",
    detailImage: "/images/image1.png",
    badge: "New Ep",
    synopsis:
      "Street artists with living ink powers are pulled into a citywide turf war controlled by hidden patrons.",
    hashtags: ["Action", "Comics", "Urban"],
    episodes: [
      {
        id: "issue1",
        title: "Issue 1: Wall of Names",
        free: true,
        likes: "3.5K",
        views: "12.7K",
        comments: [],
        images: ["/images/image1.png"]
      }
    ]
  }
];

export function getCreatorById(creatorId) {
  return creators.find((creator) => creator.id === creatorId) ?? null;
}

export function getSeriesBySlug(slug) {
  return series.find((item) => item.slug === slug) ?? series[0];
}

export function getSeriesByCreator(creatorId, excludeSlug) {
  return series.filter(
    (item) => item.creatorId === creatorId && item.slug !== excludeSlug
  );
}
