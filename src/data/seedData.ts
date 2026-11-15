import type { MediaItem, NewsArticle, UserReview, AdminAuditLog } from '../types/entertainment.ts';

export const INITIAL_FEATURED_ID = 693134; // Dune: Part Two

export const SEED_MEDIA: MediaItem[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    originalTitle: 'Dune: Part Two',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    mediaType: 'movie',
    releaseDate: '2024-03-01',
    posterPath: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropPath: '/assets/images/hero_dune_cinema_1793737311007.jpg',
    voteAverage: 8.2,
    voteCount: 5410,
    genres: ['Science Fiction', 'Adventure', 'Drama'],
    runtime: 166,
    status: 'Released',
    tagline: 'Long live the fighters.',
    featured: true,
    cast: [
      { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: 'https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg' },
      { id: 505710, name: 'Zendaya', character: 'Chani' },
      { id: 932967, name: 'Rebecca Ferguson', character: 'Lady Jessica' },
      { id: 1373737, name: 'Florence Pugh', character: 'Princess Irulan' },
      { id: 1475782, name: 'Austin Butler', character: 'Feyd-Rautha' },
      { id: 3894, name: 'Javier Bardem', character: 'Stilgar' }
    ],
    crew: [
      { id: 137427, name: 'Denis Villeneuve', job: 'Director', department: 'Directing' },
      { id: 947, name: 'Hans Zimmer', job: 'Original Music Composer', department: 'Sound' },
      { id: 960010, name: 'Greig Fraser', job: 'Director of Photography', department: 'Camera' }
    ],
    videos: [
      { id: 'v1', key: 'Way9Dexny3w', name: 'Official Trailer 3', site: 'YouTube', type: 'Trailer', official: true },
      { id: 'v2', key: 'U2Qp5pL38RE', name: 'Official Trailer 2', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 1899, providerName: 'Max', type: 'flatrate', link: 'https://www.max.com' },
      { providerId: 2, providerName: 'Apple TV', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'rent', link: 'https://tv.apple.com' },
      { providerId: 3, providerName: 'Amazon Video', type: 'rent', link: 'https://www.primevideo.com' }
    ],
    similarIds: [157336, 872585, 438631]
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II, chronicling both the scientific triumph and the profound moral crisis that followed.',
    mediaType: 'movie',
    releaseDate: '2023-07-21',
    posterPath: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    voteAverage: 8.1,
    voteCount: 8900,
    genres: ['Drama', 'History'],
    runtime: 180,
    status: 'Released',
    tagline: 'The world forever changes.',
    cast: [
      { id: 2037, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer' },
      { id: 5081, name: 'Emily Blunt', character: 'Katherine Oppenheimer' },
      { id: 1892, name: 'Matt Damon', character: 'Leslie Groves' },
      { id: 3223, name: 'Robert Downey Jr.', character: 'Lewis Strauss' }
    ],
    crew: [
      { id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' },
      { id: 1222479, name: 'Ludwig Göransson', job: 'Original Music Composer', department: 'Sound' }
    ],
    videos: [
      { id: 'v3', key: 'uYPbbksJxIg', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 1899, providerName: 'Peacock', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'flatrate', link: 'https://peacocktv.com' }
    ],
    similarIds: [693134, 157336]
  },
  {
    id: 157336,
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    mediaType: 'movie',
    releaseDate: '2014-11-05',
    posterPath: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    voteAverage: 8.4,
    voteCount: 35200,
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    runtime: 169,
    status: 'Released',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    cast: [
      { id: 10297, name: 'Matthew McConaughey', character: 'Joseph Cooper' },
      { id: 1813, name: 'Anne Hathaway', character: 'Amelia Brand' },
      { id: 83002, name: 'Jessica Chastain', character: 'Murphy Cooper' }
    ],
    crew: [
      { id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' },
      { id: 947, name: 'Hans Zimmer', job: 'Original Music Composer', department: 'Sound' }
    ],
    videos: [
      { id: 'v4', key: 'zSWdZVtXT7E', name: 'Official Trailer 3', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 1899, providerName: 'Paramount+', type: 'flatrate', link: 'https://paramountplus.com' }
    ]
  },
  {
    id: 335984,
    title: 'Blade Runner 2049',
    originalTitle: 'Blade Runner 2049',
    overview: 'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what’s left of society into chaos.',
    mediaType: 'movie',
    releaseDate: '2017-10-04',
    posterPath: 'https://image.tmdb.org/t/p/w780/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropPath: '/assets/images/hero_scifi_cyberpunk_1793737313682.jpg',
    voteAverage: 8.0,
    voteCount: 13200,
    genres: ['Science Fiction', 'Mystery', 'Drama'],
    runtime: 164,
    status: 'Released',
    tagline: 'There are still pages left in this story.',
    cast: [
      { id: 30614, name: 'Ryan Gosling', character: 'Officer K' },
      { id: 3, name: 'Harrison Ford', character: 'Rick Deckard' },
      { id: 224513, name: 'Ana de Armas', character: 'Joi' }
    ],
    crew: [
      { id: 137427, name: 'Denis Villeneuve', job: 'Director', department: 'Directing' },
      { id: 960010, name: 'Roger Deakins', job: 'Director of Photography', department: 'Camera' }
    ],
    videos: [
      { id: 'v5', key: 'gCcx85zbxz4', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 1899, providerName: 'Max', type: 'flatrate', link: 'https://max.com' }
    ]
  },
  {
    id: 95396,
    title: 'Severance',
    originalTitle: 'Severance',
    overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their job.',
    mediaType: 'tv',
    firstAirDate: '2022-02-18',
    posterPath: 'https://image.tmdb.org/t/p/w780/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    backdropPath: '/assets/images/hero_severance_series_1793737312253.jpg',
    voteAverage: 8.4,
    voteCount: 1450,
    genres: ['Drama', 'Mystery', 'Science Fiction'],
    numberOfSeasons: 2,
    numberOfEpisodes: 19,
    status: 'Returning Series',
    tagline: 'Please do not adjust your screen.',
    cast: [
      { id: 1253360, name: 'Adam Scott', character: 'Mark Scout' },
      { id: 110996, name: 'Patricia Arquette', character: 'Harmony Cobel' },
      { id: 6193, name: 'John Turturro', character: 'Irving Bailiff' },
      { id: 17419, name: 'Christopher Walken', character: 'Burt Goodman' }
    ],
    crew: [
      { id: 7399, name: 'Ben Stiller', job: 'Director / Executive Producer', department: 'Directing' },
      { id: 2474818, name: 'Dan Erickson', job: 'Creator', department: 'Writing' }
    ],
    videos: [
      { id: 'v6', key: 'xEQP4VVuyrY', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 2, providerName: 'Apple TV+', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'flatrate', link: 'https://tv.apple.com' }
    ]
  },
  {
    id: 126308,
    title: 'Shōgun',
    originalTitle: 'Shōgun',
    overview: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power and devastate his formidable enemies in feudal Japan.',
    mediaType: 'tv',
    firstAirDate: '2024-02-27',
    posterPath: 'https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
    backdropPath: '/assets/images/hero_shogun_feudal_1793737313036.jpg',
    voteAverage: 8.5,
    voteCount: 1280,
    genres: ['Drama', 'War & Politics', 'Action & Adventure'],
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    status: 'Returning Series',
    tagline: 'Honor is bought with blood.',
    cast: [
      { id: 21694, name: 'Hiroyuki Sanada', character: 'Lord Yoshii Toranaga' },
      { id: 1478701, name: 'Cosmo Jarvis', character: 'John Blackthorne' },
      { id: 1878952, name: 'Anna Sawai', character: 'Toda Mariko' }
    ],
    crew: [
      { id: 153018, name: 'Justin Marks', job: 'Showrunner / Creator', department: 'Writing' }
    ],
    videos: [
      { id: 'v7', key: 'yCMnZ24y16c', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 337, providerName: 'Hulu', type: 'flatrate', link: 'https://www.hulu.com' },
      { providerId: 337, providerName: 'Disney+', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'flatrate', link: 'https://disneyplus.com' }
    ]
  },
  {
    id: 100088,
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey.',
    mediaType: 'tv',
    firstAirDate: '2023-01-15',
    posterPath: 'https://image.tmdb.org/t/p/w780/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg',
    voteAverage: 8.6,
    voteCount: 4890,
    genres: ['Drama', 'Sci-Fi & Fantasy', 'Action & Adventure'],
    numberOfSeasons: 2,
    numberOfEpisodes: 16,
    status: 'Returning Series',
    tagline: 'When you’re lost in the darkness, look for the light.',
    cast: [
      { id: 1253360, name: 'Pedro Pascal', character: 'Joel Miller' },
      { id: 2008779, name: 'Bella Ramsey', character: 'Ellie Williams' }
    ],
    crew: [
      { id: 1224131, name: 'Craig Mazin', job: 'Creator / Writer', department: 'Writing' },
      { id: 1253361, name: 'Neil Druckmann', job: 'Creator / Writer', department: 'Writing' }
    ],
    videos: [
      { id: 'v8', key: 'uLtkt8BonwM', name: 'Official Teaser', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 1899, providerName: 'Max', type: 'flatrate', link: 'https://max.com' }
    ]
  },
  {
    id: 76331,
    title: 'Succession',
    originalTitle: 'Succession',
    overview: 'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down from the company.',
    mediaType: 'tv',
    firstAirDate: '2018-06-03',
    posterPath: 'https://image.tmdb.org/t/p/w780/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/d87JXX3DLkRJMfm5StCmmnmhHuX.jpg',
    voteAverage: 8.6,
    voteCount: 2100,
    genres: ['Drama'],
    numberOfSeasons: 4,
    numberOfEpisodes: 39,
    status: 'Ended',
    tagline: 'Blood is thicker than money.',
    cast: [
      { id: 3905, name: 'Brian Cox', character: 'Logan Roy' },
      { id: 55437, name: 'Jeremy Strong', character: 'Kendall Roy' },
      { id: 147814, name: 'Sarah Snook', character: 'Shiv Roy' },
      { id: 11115, name: 'Kieran Culkin', character: 'Roman Roy' }
    ],
    crew: [
      { id: 114620, name: 'Jesse Armstrong', job: 'Creator', department: 'Writing' },
      { id: 1222480, name: 'Nicholas Britell', job: 'Original Music Composer', department: 'Sound' }
    ],
    videos: [
      { id: 'v9', key: 'OzYxJV_rmE8', name: 'Season 4 Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 1899, providerName: 'Max', type: 'flatrate', link: 'https://max.com' }
    ]
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    mediaType: 'movie',
    releaseDate: '2024-07-26',
    posterPath: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg',
    voteAverage: 7.7,
    voteCount: 5200,
    genres: ['Action', 'Comedy', 'Science Fiction'],
    runtime: 128,
    status: 'Released',
    tagline: 'Come together.',
    cast: [
      { id: 10859, name: 'Ryan Reynolds', character: 'Wade Wilson / Deadpool' },
      { id: 6968, name: 'Hugh Jackman', character: 'Logan / Wolverine' },
      { id: 1742442, name: 'Emma Corrin', character: 'Cassandra Nova' }
    ],
    crew: [
      { id: 17825, name: 'Shawn Levy', job: 'Director', department: 'Directing' }
    ],
    videos: [
      { id: 'v10', key: '73_1biulkYk', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 337, providerName: 'Disney+', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'flatrate', link: 'https://disneyplus.com' }
    ]
  },
  {
    id: 1022789,
    title: 'Inside Out 2',
    originalTitle: 'Inside Out 2',
    overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust aren’t sure how to feel when Anxiety shows up.',
    mediaType: 'movie',
    releaseDate: '2024-06-14',
    posterPath: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
    voteAverage: 7.6,
    voteCount: 4700,
    genres: ['Animation', 'Family', 'Adventure', 'Comedy'],
    runtime: 96,
    status: 'Released',
    tagline: 'Make room for new emotions.',
    cast: [
      { id: 32281, name: 'Amy Poehler', character: 'Joy (voice)' },
      { id: 1391587, name: 'Maya Hawke', character: 'Anxiety (voice)' },
      { id: 147814, name: 'Phyllis Smith', character: 'Sadness (voice)' }
    ],
    crew: [
      { id: 148110, name: 'Kelsey Mann', job: 'Director', department: 'Directing' }
    ],
    videos: [
      { id: 'v11', key: 'LEjhY15eCx0', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 337, providerName: 'Disney+', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'flatrate', link: 'https://disneyplus.com' }
    ]
  },
  {
    id: 94605,
    title: 'Arcane',
    originalTitle: 'Arcane',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    mediaType: 'tv',
    firstAirDate: '2021-11-06',
    posterPath: 'https://image.tmdb.org/t/p/w780/87C0wecB8bHb1PsrKBI4kJiEkgV.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg',
    voteAverage: 8.7,
    voteCount: 3800,
    genres: ['Animation', 'Sci-Fi & Fantasy', 'Action & Adventure'],
    numberOfSeasons: 2,
    numberOfEpisodes: 18,
    status: 'Ended',
    tagline: 'Every legend has a beginning.',
    cast: [
      { id: 1011904, name: 'Hailee Steinfeld', character: 'Vi (voice)' },
      { id: 1009138, name: 'Ella Purnell', character: 'Jinx (voice)' }
    ],
    crew: [
      { id: 2474819, name: 'Christian Linke', job: 'Creator', department: 'Writing' }
    ],
    videos: [
      { id: 'v12', key: 'fXmAurh012s', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 8, providerName: 'Netflix', type: 'flatrate', link: 'https://netflix.com' }
    ]
  },
  {
    id: 912649,
    title: 'Venom: The Last Dance',
    originalTitle: 'Venom: The Last Dance',
    overview: 'Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on their last dance.',
    mediaType: 'movie',
    releaseDate: '2024-10-23',
    posterPath: 'https://image.tmdb.org/t/p/w780/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/original/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg',
    voteAverage: 6.8,
    voteCount: 2200,
    genres: ['Action', 'Science Fiction', 'Adventure'],
    runtime: 109,
    status: 'Released',
    tagline: 'Til death do they part.',
    cast: [
      { id: 2524, name: 'Tom Hardy', character: 'Eddie Brock / Venom' },
      { id: 19034, name: 'Chiwetel Ejiofor', character: 'Rex Strickland' }
    ],
    crew: [
      { id: 147815, name: 'Kelly Marcel', job: 'Director', department: 'Directing' }
    ],
    videos: [
      { id: 'v13', key: '__2bjWbetsA', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
    ],
    providers: [
      { providerId: 2, providerName: 'Apple TV', logoPath: 'https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg', type: 'rent', link: 'https://tv.apple.com' }
    ]
  },
  {
    id: 9900001,
    title: 'Meridian Drift',
    originalTitle: 'Meridian Drift',
    overview: 'An orbital cartographer uncovers an impossible signal drifting beneath the ice crust of Europa, triggering a high-stakes deep-space expedition.',
    mediaType: 'movie',
    releaseDate: '2026-12-18',
    posterPath: '/assets/images/hero_scifi_cyberpunk_1793737313682.jpg',
    backdropPath: '/assets/images/hero_scifi_cyberpunk_1793737313682.jpg',
    voteAverage: 0,
    voteCount: 0,
    genres: ['Science Fiction', 'Mystery'],
    runtime: 142,
    status: 'Post Production',
    tagline: 'Every signal leaves an echo.'
  },
  {
    id: 9900002,
    title: 'Winter at Takayama',
    originalTitle: 'Winter at Takayama',
    overview: 'Across three generations of master timber architects in northern Japan, a contested restoration project unearths decades-old family secrets.',
    mediaType: 'tv',
    firstAirDate: '2027-01-22',
    posterPath: '/assets/images/hero_shogun_feudal_1793737313036.jpg',
    backdropPath: '/assets/images/hero_shogun_feudal_1793737313036.jpg',
    voteAverage: 0,
    voteCount: 0,
    genres: ['Drama', 'History'],
    numberOfSeasons: 1,
    numberOfEpisodes: 8,
    status: 'In Production',
    tagline: 'Some foundations never settle.'
  },
  {
    id: 9900003,
    title: 'The Glass Consulate',
    originalTitle: 'The Glass Consulate',
    overview: 'When an encrypted diplomatic pouch vanishes mid-transit in Geneva, two rival intelligence archivists are forced into an uneasy 48-hour alliance.',
    mediaType: 'tv',
    firstAirDate: '2027-02-14',
    posterPath: '/assets/images/hero_severance_series_1793737312253.jpg',
    backdropPath: '/assets/images/hero_severance_series_1793737312253.jpg',
    voteAverage: 0,
    voteCount: 0,
    genres: ['Thriller', 'Mystery', 'Drama'],
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    status: 'In Production',
    tagline: 'Trust is an expiring credential.'
  },
  {
    id: 9900004,
    title: 'Sirocco',
    originalTitle: 'Sirocco',
    overview: 'A solar-sail cargo crew navigating an uncharted dust corridor races an approaching magnetic storm across the Mediterranean basin.',
    mediaType: 'movie',
    releaseDate: '2027-03-26',
    posterPath: '/assets/images/hero_dune_cinema_1793737311007.jpg',
    backdropPath: '/assets/images/hero_dune_cinema_1793737311007.jpg',
    voteAverage: 0,
    voteCount: 0,
    genres: ['Adventure', 'Science Fiction', 'Drama'],
    runtime: 154,
    status: 'Post Production',
    tagline: 'Catch the wind before the sky turns.'
  }
];

export const SEED_NEWS: NewsArticle[] = [
  {
    id: 'art-01',
    slug: 'the-architects-of-arrakis-denis-villeneuve-cinema',
    title: 'The Architects of Arrakis: How Denis Villeneuve Reshaped Modern Sci-Fi',
    excerpt: 'An in-depth editorial exploring the sensory minimalism, acoustic design, and narrative discipline behind Dune: Part Two and the evolution of widescreen world-building.',
    body: `From the brutalist architecture of Giedi Prime to the sweeping desert geometry of Arrakis, Denis Villeneuve and cinematographer Greig Fraser have established a visual grammar unlike anything in contemporary cinema.\n\nRather than indulging in standard digital clutter, Dune: Part Two enforces an austere restraint. Natural light, tactile grain, and Hans Zimmer's microtonal acoustic compositions ground the cosmic scale in immediate physical dread.\n\nIn this longform retrospective, ASTREON's editorial team examines how the franchise balances ancient religious allegory with technological skepticism—and what this means for the future of authored epics in a marketplace often saturated with transient visual effects.`,
    category: 'Deep Dive',
    image: '/assets/images/hero_dune_cinema_1793737311007.jpg',
    imageAlt: 'Arrakis desert horizon cinematic frame',
    author: 'Elena Vance',
    authorRole: 'Senior Film Editor',
    readTime: '6 min read',
    publishedAt: '2024-11-01T14:00:00Z',
    status: 'published',
    featured: true
  },
  {
    id: 'art-02',
    slug: 'the-golden-age-of-prestige-television-shogun-and-severance',
    title: 'Precision Over Volume: The Resurgence of Prestige Television Craft',
    excerpt: 'With Shōgun sweeping the Emmys and Severance entering its second chapter, television is returning to meticulous historical cadence and patient conceptual tension.',
    body: `The era of rapid streaming sprawl is giving way to a deliberate return to craft. Audiences are rewarding television that demands undivided attention, cultural authenticity, and rigorous pacing.\n\nHiroyuki Sanada's historic turn as Lord Toranaga in Shōgun proved that international storytelling, when produced with uncompromised period accuracy and bilingual reverence, commands global cultural primacy.\n\nSimultaneously, Ben Stiller and Dan Erickson's Severance subverts corporate modernism into psychological mystery, proving that original speculative fiction continues to flourish when granted architectural freedom.`,
    category: 'Industry',
    image: '/assets/images/hero_shogun_feudal_1793737313036.jpg',
    imageAlt: 'Feudal Japanese setting in Shōgun',
    author: 'Marcus Vance',
    authorRole: 'Cultural Critic',
    readTime: '5 min read',
    publishedAt: '2024-10-28T09:30:00Z',
    status: 'published'
  },
  {
    id: 'art-03',
    slug: 'curators-dispatch-ten-overlooked-sci-fi-masterworks',
    title: "Curator's Dispatch: Ten Overlooked Speculative Gems You Can Stream Today",
    excerpt: 'Beyond the mainstream blockbusters lie contemplative visions of artificial consciousness, temporal paradoxes, and quiet orbital solitude.',
    body: `True discovery happens at the periphery of algorithm recommendations. In this edition of Curator's Dispatch, we spotlight ten masterworks from independent filmmakers and international retrospectives.\n\nFeatured selections include Shane Carruth's Primer, Jonathan Glazer's Under the Skin, and Mamoru Oshii's 1995 Ghost in the Shell—films that privilege mood, philosophical inquiry, and sonic experimentation over conventional formula.`,
    category: 'Curation',
    image: '/assets/images/hero_scifi_cyberpunk_1793737313682.jpg',
    imageAlt: 'Futuristic atmospheric skyline from Blade Runner',
    author: 'Kaelen Thorne',
    authorRole: 'Lead Curator',
    readTime: '4 min read',
    publishedAt: '2024-10-15T16:00:00Z',
    status: 'published'
  }
];

export const SEED_REVIEWS: UserReview[] = [
  {
    id: 'rev-01',
    userId: 'user-astreon-1',
    userName: 'CinemaAuteur',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mediaId: 693134,
    mediaType: 'movie',
    rating: 10,
    reviewText: 'Denis Villeneuve has crafted something truly transcendent. The sound design alone rumbles straight through the auditorium seats. The Giedi Prime black-and-white infrared sequence is pure cinematic poetry.',
    status: 'published',
    createdAt: '2024-03-05T20:15:00Z',
    helpfulCount: 42
  },
  {
    id: 'rev-02',
    userId: 'user-astreon-2',
    userName: 'AstralVoyager',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mediaId: 872585,
    mediaType: 'movie',
    rating: 9,
    reviewText: 'Cillian Murphy gives the performance of a lifetime. The Trinity test sequence is unforgettable, relying on dead silence and terrifying atmospheric shockwaves rather than easy Hollywood explosions.',
    status: 'published',
    createdAt: '2023-07-25T11:40:00Z',
    helpfulCount: 29
  },
  {
    id: 'rev-03',
    userId: 'user-astreon-3',
    userName: 'KurosawaDisciple',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    mediaId: 126308,
    mediaType: 'tv',
    rating: 10,
    reviewText: 'Shōgun sets a new watermark for historical television. The political chess match between Toranaga and Ishido is Shakespearean in scope. Anna Sawai delivers every line with devastating grace.',
    status: 'published',
    createdAt: '2024-04-12T14:10:00Z',
    helpfulCount: 38
  }
];

export const SEED_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-1',
    actor: 'admin@astreon.org',
    action: 'SET_FEATURED_MEDIA',
    targetType: 'hero_feature',
    targetId: 693134,
    timestamp: '2024-11-01T08:00:00Z',
    details: 'Updated hero spotlight to Dune: Part Two with 4K trailer link'
  },
  {
    id: 'log-2',
    actor: 'admin@astreon.org',
    action: 'PUBLISH_ARTICLE',
    targetType: 'article',
    targetId: 'art-01',
    timestamp: '2024-11-01T14:00:00Z',
    details: 'Published longform feature: The Architects of Arrakis'
  },
  {
    id: 'log-3',
    actor: 'mod@astreon.org',
    action: 'MODERATE_REVIEW',
    targetType: 'review',
    targetId: 'rev-01',
    timestamp: '2024-11-02T10:15:00Z',
    details: 'Verified review compliance with community guidelines'
  }
];
