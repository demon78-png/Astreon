// server.ts
import express2 from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/server/apiApp.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0119106237",
  appId: "1:951173698161:web:fe0f29e5b3fa72418741d0",
  apiKey: "AIzaSyBwL1UBanGKf-f7iJNm-VvTWns2PpTYICk",
  authDomain: "gen-lang-client-0119106237.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-astreon-62c32054-27f2-4bee-a80d-98620e463670",
  storageBucket: "gen-lang-client-0119106237.firebasestorage.app",
  messagingSenderId: "951173698161",
  measurementId: "",
  oAuthClientId: "951173698161-23esv4odhpqetpqck88sbsg08ilr6hgc.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/data/seedData.ts
var INITIAL_FEATURED_ID = 693134;
var SEED_MEDIA = [
  {
    id: 693134,
    title: "Dune: Part Two",
    originalTitle: "Dune: Part Two",
    overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
    mediaType: "movie",
    releaseDate: "2024-03-01",
    posterPath: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropPath: "/assets/images/hero_dune_cinema_1793737311007.jpg",
    voteAverage: 8.2,
    voteCount: 5410,
    genres: ["Science Fiction", "Adventure", "Drama"],
    runtime: 166,
    status: "Released",
    tagline: "Long live the fighters.",
    featured: true,
    cast: [
      { id: 1190668, name: "Timoth\xE9e Chalamet", character: "Paul Atreides", profilePath: "https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg" },
      { id: 505710, name: "Zendaya", character: "Chani" },
      { id: 932967, name: "Rebecca Ferguson", character: "Lady Jessica" },
      { id: 1373737, name: "Florence Pugh", character: "Princess Irulan" },
      { id: 1475782, name: "Austin Butler", character: "Feyd-Rautha" },
      { id: 3894, name: "Javier Bardem", character: "Stilgar" }
    ],
    crew: [
      { id: 137427, name: "Denis Villeneuve", job: "Director", department: "Directing" },
      { id: 947, name: "Hans Zimmer", job: "Original Music Composer", department: "Sound" },
      { id: 960010, name: "Greig Fraser", job: "Director of Photography", department: "Camera" }
    ],
    videos: [
      { id: "v1", key: "Way9Dexny3w", name: "Official Trailer 3", site: "YouTube", type: "Trailer", official: true },
      { id: "v2", key: "U2Qp5pL38RE", name: "Official Trailer 2", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 1899, providerName: "Max", type: "flatrate", link: "https://www.max.com" },
      { providerId: 2, providerName: "Apple TV", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "rent", link: "https://tv.apple.com" },
      { providerId: 3, providerName: "Amazon Video", type: "rent", link: "https://www.primevideo.com" }
    ],
    similarIds: [157336, 872585, 438631]
  },
  {
    id: 872585,
    title: "Oppenheimer",
    originalTitle: "Oppenheimer",
    overview: "The story of J. Robert Oppenheimer\u2019s role in the development of the atomic bomb during World War II, chronicling both the scientific triumph and the profound moral crisis that followed.",
    mediaType: "movie",
    releaseDate: "2023-07-21",
    posterPath: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    voteAverage: 8.1,
    voteCount: 8900,
    genres: ["Drama", "History"],
    runtime: 180,
    status: "Released",
    tagline: "The world forever changes.",
    cast: [
      { id: 2037, name: "Cillian Murphy", character: "J. Robert Oppenheimer" },
      { id: 5081, name: "Emily Blunt", character: "Katherine Oppenheimer" },
      { id: 1892, name: "Matt Damon", character: "Leslie Groves" },
      { id: 3223, name: "Robert Downey Jr.", character: "Lewis Strauss" }
    ],
    crew: [
      { id: 525, name: "Christopher Nolan", job: "Director", department: "Directing" },
      { id: 1222479, name: "Ludwig G\xF6ransson", job: "Original Music Composer", department: "Sound" }
    ],
    videos: [
      { id: "v3", key: "uYPbbksJxIg", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 1899, providerName: "Peacock", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "flatrate", link: "https://peacocktv.com" }
    ],
    similarIds: [693134, 157336]
  },
  {
    id: 157336,
    title: "Interstellar",
    originalTitle: "Interstellar",
    overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
    mediaType: "movie",
    releaseDate: "2014-11-05",
    posterPath: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    voteAverage: 8.4,
    voteCount: 35200,
    genres: ["Adventure", "Drama", "Science Fiction"],
    runtime: 169,
    status: "Released",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    cast: [
      { id: 10297, name: "Matthew McConaughey", character: "Joseph Cooper" },
      { id: 1813, name: "Anne Hathaway", character: "Amelia Brand" },
      { id: 83002, name: "Jessica Chastain", character: "Murphy Cooper" }
    ],
    crew: [
      { id: 525, name: "Christopher Nolan", job: "Director", department: "Directing" },
      { id: 947, name: "Hans Zimmer", job: "Original Music Composer", department: "Sound" }
    ],
    videos: [
      { id: "v4", key: "zSWdZVtXT7E", name: "Official Trailer 3", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 1899, providerName: "Paramount+", type: "flatrate", link: "https://paramountplus.com" }
    ]
  },
  {
    id: 335984,
    title: "Blade Runner 2049",
    originalTitle: "Blade Runner 2049",
    overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what\u2019s left of society into chaos.",
    mediaType: "movie",
    releaseDate: "2017-10-04",
    posterPath: "https://image.tmdb.org/t/p/w780/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    backdropPath: "/assets/images/hero_scifi_cyberpunk_1793737313682.jpg",
    voteAverage: 8,
    voteCount: 13200,
    genres: ["Science Fiction", "Mystery", "Drama"],
    runtime: 164,
    status: "Released",
    tagline: "There are still pages left in this story.",
    cast: [
      { id: 30614, name: "Ryan Gosling", character: "Officer K" },
      { id: 3, name: "Harrison Ford", character: "Rick Deckard" },
      { id: 224513, name: "Ana de Armas", character: "Joi" }
    ],
    crew: [
      { id: 137427, name: "Denis Villeneuve", job: "Director", department: "Directing" },
      { id: 960010, name: "Roger Deakins", job: "Director of Photography", department: "Camera" }
    ],
    videos: [
      { id: "v5", key: "gCcx85zbxz4", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 1899, providerName: "Max", type: "flatrate", link: "https://max.com" }
    ]
  },
  {
    id: 95396,
    title: "Severance",
    originalTitle: "Severance",
    overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their job.",
    mediaType: "tv",
    firstAirDate: "2022-02-18",
    posterPath: "https://image.tmdb.org/t/p/w780/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg",
    backdropPath: "/assets/images/hero_severance_series_1793737312253.jpg",
    voteAverage: 8.4,
    voteCount: 1450,
    genres: ["Drama", "Mystery", "Science Fiction"],
    numberOfSeasons: 2,
    numberOfEpisodes: 19,
    status: "Returning Series",
    tagline: "Please do not adjust your screen.",
    cast: [
      { id: 1253360, name: "Adam Scott", character: "Mark Scout" },
      { id: 110996, name: "Patricia Arquette", character: "Harmony Cobel" },
      { id: 6193, name: "John Turturro", character: "Irving Bailiff" },
      { id: 17419, name: "Christopher Walken", character: "Burt Goodman" }
    ],
    crew: [
      { id: 7399, name: "Ben Stiller", job: "Director / Executive Producer", department: "Directing" },
      { id: 2474818, name: "Dan Erickson", job: "Creator", department: "Writing" }
    ],
    videos: [
      { id: "v6", key: "xEQP4VVuyrY", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 2, providerName: "Apple TV+", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "flatrate", link: "https://tv.apple.com" }
    ]
  },
  {
    id: 126308,
    title: "Sh\u014Dgun",
    originalTitle: "Sh\u014Dgun",
    overview: "When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power and devastate his formidable enemies in feudal Japan.",
    mediaType: "tv",
    firstAirDate: "2024-02-27",
    posterPath: "https://image.tmdb.org/t/p/w780/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg",
    backdropPath: "/assets/images/hero_shogun_feudal_1793737313036.jpg",
    voteAverage: 8.5,
    voteCount: 1280,
    genres: ["Drama", "War & Politics", "Action & Adventure"],
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    status: "Returning Series",
    tagline: "Honor is bought with blood.",
    cast: [
      { id: 21694, name: "Hiroyuki Sanada", character: "Lord Yoshii Toranaga" },
      { id: 1478701, name: "Cosmo Jarvis", character: "John Blackthorne" },
      { id: 1878952, name: "Anna Sawai", character: "Toda Mariko" }
    ],
    crew: [
      { id: 153018, name: "Justin Marks", job: "Showrunner / Creator", department: "Writing" }
    ],
    videos: [
      { id: "v7", key: "yCMnZ24y16c", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 337, providerName: "Hulu", type: "flatrate", link: "https://www.hulu.com" },
      { providerId: 337, providerName: "Disney+", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "flatrate", link: "https://disneyplus.com" }
    ]
  },
  {
    id: 100088,
    title: "The Last of Us",
    originalTitle: "The Last of Us",
    overview: "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone. What starts as a small job soon becomes a brutal, heartbreaking journey.",
    mediaType: "tv",
    firstAirDate: "2023-01-15",
    posterPath: "https://image.tmdb.org/t/p/w780/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg",
    voteAverage: 8.6,
    voteCount: 4890,
    genres: ["Drama", "Sci-Fi & Fantasy", "Action & Adventure"],
    numberOfSeasons: 2,
    numberOfEpisodes: 16,
    status: "Returning Series",
    tagline: "When you\u2019re lost in the darkness, look for the light.",
    cast: [
      { id: 1253360, name: "Pedro Pascal", character: "Joel Miller" },
      { id: 2008779, name: "Bella Ramsey", character: "Ellie Williams" }
    ],
    crew: [
      { id: 1224131, name: "Craig Mazin", job: "Creator / Writer", department: "Writing" },
      { id: 1253361, name: "Neil Druckmann", job: "Creator / Writer", department: "Writing" }
    ],
    videos: [
      { id: "v8", key: "uLtkt8BonwM", name: "Official Teaser", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 1899, providerName: "Max", type: "flatrate", link: "https://max.com" }
    ]
  },
  {
    id: 76331,
    title: "Succession",
    originalTitle: "Succession",
    overview: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down from the company.",
    mediaType: "tv",
    firstAirDate: "2018-06-03",
    posterPath: "https://image.tmdb.org/t/p/w780/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/d87JXX3DLkRJMfm5StCmmnmhHuX.jpg",
    voteAverage: 8.6,
    voteCount: 2100,
    genres: ["Drama"],
    numberOfSeasons: 4,
    numberOfEpisodes: 39,
    status: "Ended",
    tagline: "Blood is thicker than money.",
    cast: [
      { id: 3905, name: "Brian Cox", character: "Logan Roy" },
      { id: 55437, name: "Jeremy Strong", character: "Kendall Roy" },
      { id: 147814, name: "Sarah Snook", character: "Shiv Roy" },
      { id: 11115, name: "Kieran Culkin", character: "Roman Roy" }
    ],
    crew: [
      { id: 114620, name: "Jesse Armstrong", job: "Creator", department: "Writing" },
      { id: 1222480, name: "Nicholas Britell", job: "Original Music Composer", department: "Sound" }
    ],
    videos: [
      { id: "v9", key: "OzYxJV_rmE8", name: "Season 4 Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 1899, providerName: "Max", type: "flatrate", link: "https://max.com" }
    ]
  },
  {
    id: 533535,
    title: "Deadpool & Wolverine",
    originalTitle: "Deadpool & Wolverine",
    overview: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.",
    mediaType: "movie",
    releaseDate: "2024-07-26",
    posterPath: "https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/by8z9Fe8y7p4jo2YlW2SZDnptyT.jpg",
    voteAverage: 7.7,
    voteCount: 5200,
    genres: ["Action", "Comedy", "Science Fiction"],
    runtime: 128,
    status: "Released",
    tagline: "Come together.",
    cast: [
      { id: 10859, name: "Ryan Reynolds", character: "Wade Wilson / Deadpool" },
      { id: 6968, name: "Hugh Jackman", character: "Logan / Wolverine" },
      { id: 1742442, name: "Emma Corrin", character: "Cassandra Nova" }
    ],
    crew: [
      { id: 17825, name: "Shawn Levy", job: "Director", department: "Directing" }
    ],
    videos: [
      { id: "v10", key: "73_1biulkYk", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 337, providerName: "Disney+", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "flatrate", link: "https://disneyplus.com" }
    ]
  },
  {
    id: 1022789,
    title: "Inside Out 2",
    originalTitle: "Inside Out 2",
    overview: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust aren\u2019t sure how to feel when Anxiety shows up.",
    mediaType: "movie",
    releaseDate: "2024-06-14",
    posterPath: "https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg",
    voteAverage: 7.6,
    voteCount: 4700,
    genres: ["Animation", "Family", "Adventure", "Comedy"],
    runtime: 96,
    status: "Released",
    tagline: "Make room for new emotions.",
    cast: [
      { id: 32281, name: "Amy Poehler", character: "Joy (voice)" },
      { id: 1391587, name: "Maya Hawke", character: "Anxiety (voice)" },
      { id: 147814, name: "Phyllis Smith", character: "Sadness (voice)" }
    ],
    crew: [
      { id: 148110, name: "Kelsey Mann", job: "Director", department: "Directing" }
    ],
    videos: [
      { id: "v11", key: "LEjhY15eCx0", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 337, providerName: "Disney+", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "flatrate", link: "https://disneyplus.com" }
    ]
  },
  {
    id: 94605,
    title: "Arcane",
    originalTitle: "Arcane",
    overview: "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.",
    mediaType: "tv",
    firstAirDate: "2021-11-06",
    posterPath: "https://image.tmdb.org/t/p/w780/87C0wecB8bHb1PsrKBI4kJiEkgV.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/5cvnxEHT3e39DvT6ARw4GNCFrB0.jpg",
    voteAverage: 8.7,
    voteCount: 3800,
    genres: ["Animation", "Sci-Fi & Fantasy", "Action & Adventure"],
    numberOfSeasons: 2,
    numberOfEpisodes: 18,
    status: "Ended",
    tagline: "Every legend has a beginning.",
    cast: [
      { id: 1011904, name: "Hailee Steinfeld", character: "Vi (voice)" },
      { id: 1009138, name: "Ella Purnell", character: "Jinx (voice)" }
    ],
    crew: [
      { id: 2474819, name: "Christian Linke", job: "Creator", department: "Writing" }
    ],
    videos: [
      { id: "v12", key: "fXmAurh012s", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 8, providerName: "Netflix", type: "flatrate", link: "https://netflix.com" }
    ]
  },
  {
    id: 912649,
    title: "Venom: The Last Dance",
    originalTitle: "Venom: The Last Dance",
    overview: "Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on their last dance.",
    mediaType: "movie",
    releaseDate: "2024-10-23",
    posterPath: "https://image.tmdb.org/t/p/w780/vGXptEdgZIhPg3cGlc7e8sNPC2e.jpg",
    backdropPath: "https://image.tmdb.org/t/p/original/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg",
    voteAverage: 6.8,
    voteCount: 2200,
    genres: ["Action", "Science Fiction", "Adventure"],
    runtime: 109,
    status: "Released",
    tagline: "Til death do they part.",
    cast: [
      { id: 2524, name: "Tom Hardy", character: "Eddie Brock / Venom" },
      { id: 19034, name: "Chiwetel Ejiofor", character: "Rex Strickland" }
    ],
    crew: [
      { id: 147815, name: "Kelly Marcel", job: "Director", department: "Directing" }
    ],
    videos: [
      { id: "v13", key: "__2bjWbetsA", name: "Official Trailer", site: "YouTube", type: "Trailer", official: true }
    ],
    providers: [
      { providerId: 2, providerName: "Apple TV", logoPath: "https://image.tmdb.org/t/p/w92/peURlLlr8jggOwK53fJ5wdQl05y.jpg", type: "rent", link: "https://tv.apple.com" }
    ]
  },
  {
    id: 9900001,
    title: "Meridian Drift",
    originalTitle: "Meridian Drift",
    overview: "An orbital cartographer uncovers an impossible signal drifting beneath the ice crust of Europa, triggering a high-stakes deep-space expedition.",
    mediaType: "movie",
    releaseDate: "2026-12-18",
    posterPath: "/assets/images/hero_scifi_cyberpunk_1793737313682.jpg",
    backdropPath: "/assets/images/hero_scifi_cyberpunk_1793737313682.jpg",
    voteAverage: 0,
    voteCount: 0,
    genres: ["Science Fiction", "Mystery"],
    runtime: 142,
    status: "Post Production",
    tagline: "Every signal leaves an echo."
  },
  {
    id: 9900002,
    title: "Winter at Takayama",
    originalTitle: "Winter at Takayama",
    overview: "Across three generations of master timber architects in northern Japan, a contested restoration project unearths decades-old family secrets.",
    mediaType: "tv",
    firstAirDate: "2027-01-22",
    posterPath: "/assets/images/hero_shogun_feudal_1793737313036.jpg",
    backdropPath: "/assets/images/hero_shogun_feudal_1793737313036.jpg",
    voteAverage: 0,
    voteCount: 0,
    genres: ["Drama", "History"],
    numberOfSeasons: 1,
    numberOfEpisodes: 8,
    status: "In Production",
    tagline: "Some foundations never settle."
  },
  {
    id: 9900003,
    title: "The Glass Consulate",
    originalTitle: "The Glass Consulate",
    overview: "When an encrypted diplomatic pouch vanishes mid-transit in Geneva, two rival intelligence archivists are forced into an uneasy 48-hour alliance.",
    mediaType: "tv",
    firstAirDate: "2027-02-14",
    posterPath: "/assets/images/hero_severance_series_1793737312253.jpg",
    backdropPath: "/assets/images/hero_severance_series_1793737312253.jpg",
    voteAverage: 0,
    voteCount: 0,
    genres: ["Thriller", "Mystery", "Drama"],
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    status: "In Production",
    tagline: "Trust is an expiring credential."
  },
  {
    id: 9900004,
    title: "Sirocco",
    originalTitle: "Sirocco",
    overview: "A solar-sail cargo crew navigating an uncharted dust corridor races an approaching magnetic storm across the Mediterranean basin.",
    mediaType: "movie",
    releaseDate: "2027-03-26",
    posterPath: "/assets/images/hero_dune_cinema_1793737311007.jpg",
    backdropPath: "/assets/images/hero_dune_cinema_1793737311007.jpg",
    voteAverage: 0,
    voteCount: 0,
    genres: ["Adventure", "Science Fiction", "Drama"],
    runtime: 154,
    status: "Post Production",
    tagline: "Catch the wind before the sky turns."
  }
];
var SEED_NEWS = [
  {
    id: "art-01",
    slug: "the-architects-of-arrakis-denis-villeneuve-cinema",
    title: "The Architects of Arrakis: How Denis Villeneuve Reshaped Modern Sci-Fi",
    excerpt: "An in-depth editorial exploring the sensory minimalism, acoustic design, and narrative discipline behind Dune: Part Two and the evolution of widescreen world-building.",
    body: `From the brutalist architecture of Giedi Prime to the sweeping desert geometry of Arrakis, Denis Villeneuve and cinematographer Greig Fraser have established a visual grammar unlike anything in contemporary cinema.

Rather than indulging in standard digital clutter, Dune: Part Two enforces an austere restraint. Natural light, tactile grain, and Hans Zimmer's microtonal acoustic compositions ground the cosmic scale in immediate physical dread.

In this longform retrospective, ASTREON's editorial team examines how the franchise balances ancient religious allegory with technological skepticism\u2014and what this means for the future of authored epics in a marketplace often saturated with transient visual effects.`,
    category: "Deep Dive",
    image: "/assets/images/hero_dune_cinema_1793737311007.jpg",
    imageAlt: "Arrakis desert horizon cinematic frame",
    author: "Elena Vance",
    authorRole: "Senior Film Editor",
    readTime: "6 min read",
    publishedAt: "2024-11-01T14:00:00Z",
    status: "published",
    featured: true
  },
  {
    id: "art-02",
    slug: "the-golden-age-of-prestige-television-shogun-and-severance",
    title: "Precision Over Volume: The Resurgence of Prestige Television Craft",
    excerpt: "With Sh\u014Dgun sweeping the Emmys and Severance entering its second chapter, television is returning to meticulous historical cadence and patient conceptual tension.",
    body: `The era of rapid streaming sprawl is giving way to a deliberate return to craft. Audiences are rewarding television that demands undivided attention, cultural authenticity, and rigorous pacing.

Hiroyuki Sanada's historic turn as Lord Toranaga in Sh\u014Dgun proved that international storytelling, when produced with uncompromised period accuracy and bilingual reverence, commands global cultural primacy.

Simultaneously, Ben Stiller and Dan Erickson's Severance subverts corporate modernism into psychological mystery, proving that original speculative fiction continues to flourish when granted architectural freedom.`,
    category: "Industry",
    image: "/assets/images/hero_shogun_feudal_1793737313036.jpg",
    imageAlt: "Feudal Japanese setting in Sh\u014Dgun",
    author: "Marcus Vance",
    authorRole: "Cultural Critic",
    readTime: "5 min read",
    publishedAt: "2024-10-28T09:30:00Z",
    status: "published"
  },
  {
    id: "art-03",
    slug: "curators-dispatch-ten-overlooked-sci-fi-masterworks",
    title: "Curator's Dispatch: Ten Overlooked Speculative Gems You Can Stream Today",
    excerpt: "Beyond the mainstream blockbusters lie contemplative visions of artificial consciousness, temporal paradoxes, and quiet orbital solitude.",
    body: `True discovery happens at the periphery of algorithm recommendations. In this edition of Curator's Dispatch, we spotlight ten masterworks from independent filmmakers and international retrospectives.

Featured selections include Shane Carruth's Primer, Jonathan Glazer's Under the Skin, and Mamoru Oshii's 1995 Ghost in the Shell\u2014films that privilege mood, philosophical inquiry, and sonic experimentation over conventional formula.`,
    category: "Curation",
    image: "/assets/images/hero_scifi_cyberpunk_1793737313682.jpg",
    imageAlt: "Futuristic atmospheric skyline from Blade Runner",
    author: "Kaelen Thorne",
    authorRole: "Lead Curator",
    readTime: "4 min read",
    publishedAt: "2024-10-15T16:00:00Z",
    status: "published"
  }
];
var SEED_REVIEWS = [
  {
    id: "rev-01",
    userId: "user-astreon-1",
    userName: "CinemaAuteur",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    mediaId: 693134,
    mediaType: "movie",
    rating: 10,
    reviewText: "Denis Villeneuve has crafted something truly transcendent. The sound design alone rumbles straight through the auditorium seats. The Giedi Prime black-and-white infrared sequence is pure cinematic poetry.",
    status: "published",
    createdAt: "2024-03-05T20:15:00Z",
    helpfulCount: 42
  },
  {
    id: "rev-02",
    userId: "user-astreon-2",
    userName: "AstralVoyager",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    mediaId: 872585,
    mediaType: "movie",
    rating: 9,
    reviewText: "Cillian Murphy gives the performance of a lifetime. The Trinity test sequence is unforgettable, relying on dead silence and terrifying atmospheric shockwaves rather than easy Hollywood explosions.",
    status: "published",
    createdAt: "2023-07-25T11:40:00Z",
    helpfulCount: 29
  },
  {
    id: "rev-03",
    userId: "user-astreon-3",
    userName: "KurosawaDisciple",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    mediaId: 126308,
    mediaType: "tv",
    rating: 10,
    reviewText: "Sh\u014Dgun sets a new watermark for historical television. The political chess match between Toranaga and Ishido is Shakespearean in scope. Anna Sawai delivers every line with devastating grace.",
    status: "published",
    createdAt: "2024-04-12T14:10:00Z",
    helpfulCount: 38
  }
];
var SEED_AUDIT_LOGS = [
  {
    id: "log-1",
    actor: "admin@astreon.org",
    action: "SET_FEATURED_MEDIA",
    targetType: "hero_feature",
    targetId: 693134,
    timestamp: "2024-11-01T08:00:00Z",
    details: "Updated hero spotlight to Dune: Part Two with 4K trailer link"
  },
  {
    id: "log-2",
    actor: "admin@astreon.org",
    action: "PUBLISH_ARTICLE",
    targetType: "article",
    targetId: "art-01",
    timestamp: "2024-11-01T14:00:00Z",
    details: "Published longform feature: The Architects of Arrakis"
  },
  {
    id: "log-3",
    actor: "mod@astreon.org",
    action: "MODERATE_REVIEW",
    targetType: "review",
    targetId: "rev-01",
    timestamp: "2024-11-02T10:15:00Z",
    details: "Verified review compliance with community guidelines"
  }
];

// src/utils/entertainment.ts
function formatReleaseYear(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "TBA";
  const match = dateStr.match(/^\d{4}/);
  return match ? match[0] : "TBA";
}
var GENRE_FILTER_ALIASES = {
  "science fiction": ["science fiction", "sci-fi & fantasy"],
  fantasy: ["fantasy", "sci-fi & fantasy"],
  "sci-fi & fantasy": ["sci-fi & fantasy", "science fiction", "fantasy"],
  action: ["action", "action & adventure"],
  adventure: ["adventure", "action & adventure"],
  "action & adventure": ["action & adventure", "action", "adventure"],
  war: ["war", "war & politics"],
  "war & politics": ["war & politics", "war"]
};
function filterMedia(items, filter) {
  return items.filter((item) => {
    if (filter.type && filter.type !== "all" && item.mediaType !== filter.type) {
      return false;
    }
    if (filter.genre && filter.genre !== "All" && filter.genre !== "") {
      const normalizedFilter = filter.genre.trim().toLowerCase();
      const accepted = GENRE_FILTER_ALIASES[normalizedFilter] || [normalizedFilter];
      if (!item.genres || !item.genres.some((g) => accepted.includes(g.toLowerCase()))) {
        return false;
      }
    }
    if (filter.year && filter.year !== "All" && filter.year !== "") {
      const year = formatReleaseYear(item.releaseDate || item.firstAirDate);
      if (year !== filter.year) {
        return false;
      }
    }
    if (filter.minRating !== void 0 && filter.minRating > 0) {
      if (item.voteAverage < filter.minRating) {
        return false;
      }
    }
    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase().trim();
      const inTitle = item.title.toLowerCase().includes(q);
      const inOverview = item.overview.toLowerCase().includes(q);
      const inGenres = item.genres.some((g) => g.toLowerCase().includes(q));
      const inCast = item.cast?.some((c) => c.name.toLowerCase().includes(q)) ?? false;
      if (!inTitle && !inOverview && !inGenres && !inCast) {
        return false;
      }
    }
    return true;
  });
}
function sortMedia(items, sortBy = "popularity.desc") {
  const cloned = [...items];
  switch (sortBy) {
    case "vote_average.desc":
      return cloned.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    case "primary_release_date.desc":
      return cloned.sort((a, b) => {
        const dateA = a.releaseDate || a.firstAirDate || "";
        const dateB = b.releaseDate || b.firstAirDate || "";
        return dateB.localeCompare(dateA);
      });
    case "title.asc":
      return cloned.sort((a, b) => a.title.localeCompare(b.title));
    case "popularity.desc":
    default:
      return cloned.sort((a, b) => {
        const scoreB = (b.voteAverage || 0) * Math.log10(Math.max(b.voteCount || 1, 10));
        const scoreA = (a.voteAverage || 0) * Math.log10(Math.max(a.voteCount || 1, 10));
        return scoreB - scoreA;
      });
  }
}
function generateArticleSlug(title, existingSlugs, fallbackId) {
  const normalized = (title || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim().replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  const fallbackClean = (fallbackId || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  const base = normalized || fallbackClean || `dispatch-${Date.now()}`;
  if (!existingSlugs) return base;
  const taken = new Set(Array.from(existingSlugs, (s) => s.toLowerCase()));
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
function getTodayIsoDate(now = /* @__PURE__ */ new Date()) {
  return now.toISOString().slice(0, 10);
}
function isUpcomingReleaseDate(dateStr, referenceDateIso = getTodayIsoDate()) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return false;
  const isoDay = match[1];
  const [yearStr, monthStr, dayStr] = isoDay.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return false;
  }
  return isoDay > referenceDateIso;
}
function getUpcomingMediaItems(items, referenceDateIso = getTodayIsoDate(), limit = 24) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const deduped = /* @__PURE__ */ new Map();
  for (const item of items) {
    const releaseStr = item.releaseDate || item.firstAirDate;
    if (!isUpcomingReleaseDate(releaseStr, referenceDateIso)) continue;
    const key = `${item.mediaType}:${item.id}`;
    const existing = deduped.get(key);
    if (!existing || !existing.posterPath && item.posterPath) {
      deduped.set(key, item);
    }
  }
  return Array.from(deduped.values()).sort((a, b) => {
    const dateA = (a.releaseDate || a.firstAirDate || "").slice(0, 10);
    const dateB = (b.releaseDate || b.firstAirDate || "").slice(0, 10);
    const dateCmp = dateA.localeCompare(dateB);
    if (dateCmp !== 0) return dateCmp;
    const popA = (a.voteCount || 0) + (a.voteAverage || 0) * 10;
    const popB = (b.voteCount || 0) + (b.voteAverage || 0) * 10;
    if (popB !== popA) return popB - popA;
    return a.title.localeCompare(b.title);
  }).slice(0, Math.max(0, limit));
}

// src/utils/netlify.ts
function normalizeNetlifyApiPath(rawPath) {
  const input = (rawPath || "/").trim();
  const queryIndex = input.indexOf("?");
  const pathnamePart = queryIndex === -1 ? input : input.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? "" : input.slice(queryIndex);
  let normalizedPath = pathnamePart.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, "");
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (normalizedPath === "/") {
    normalizedPath = "/api";
  } else if (normalizedPath !== "/api" && !normalizedPath.startsWith("/api/")) {
    normalizedPath = `/api${normalizedPath}`;
  }
  return `${normalizedPath}${queryPart}`;
}

// src/utils/providers.ts
var SUPPORTED_PROVIDER_REGIONS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "ES", label: "Spain" },
  { code: "JP", label: "Japan" },
  { code: "BR", label: "Brazil" },
  { code: "MX", label: "Mexico" },
  { code: "IN", label: "India" },
  { code: "KR", label: "South Korea" }
];
var VALID_REGION_CODES = new Set(SUPPORTED_PROVIDER_REGIONS.map((r) => r.code));
var KNOWN_PROVIDER_URLS = [
  [/amazon\s*channel|prime\s*video|amazon\s*video/i, "https://www.primevideo.com"],
  [/apple\s*tv/i, "https://tv.apple.com"],
  [/youtube\s*tv/i, "https://tv.youtube.com"],
  [/youtube/i, "https://www.youtube.com/movies"],
  [/google\s*play/i, "https://play.google.com/store/movies"],
  [/hbo\s*max|\bmax\b/i, "https://www.max.com"],
  [/netflix/i, "https://www.netflix.com"],
  [/disney/i, "https://www.disneyplus.com"],
  [/hulu/i, "https://www.hulu.com"],
  [/peacock/i, "https://www.peacocktv.com"],
  [/paramount/i, "https://www.paramountplus.com"],
  [/crunchyroll/i, "https://www.crunchyroll.com"],
  [/mubi/i, "https://mubi.com"],
  [/criterion/i, "https://www.criterionchannel.com"],
  [/tubi/i, "https://tubitv.com"],
  [/pluto/i, "https://pluto.tv"],
  [/fandango|vudu/i, "https://athome.fandango.com"],
  [/starz/i, "https://www.starz.com"],
  [/mgm\+|mgm\s*plus/i, "https://www.mgmplus.com"],
  [/amc\+|amc\s*plus|\bamc\b/i, "https://www.amc.com"],
  [/shudder/i, "https://www.shudder.com"],
  [/fubo/i, "https://www.fubo.tv"],
  [/freevee/i, "https://www.amazon.com/freevee"],
  [/britbox/i, "https://www.britbox.com"],
  [/acorn/i, "https://www.acorn.tv"],
  [/showtime/i, "https://www.paramountplus.com"],
  [/kanopy/i, "https://www.kanopy.com"],
  [/hoopla/i, "https://www.hoopladigital.com"],
  [/plex/i, "https://watch.plex.tv"],
  [/roku/i, "https://therokuchannel.roku.com"],
  [/bbc\s*iplayer/i, "https://www.bbc.co.uk/iplayer"],
  [/itvx/i, "https://www.itv.com"],
  [/rakuten/i, "https://www.rakuten.tv"],
  [/curzon/i, "https://homecinema.curzon.com"],
  [/bfi/i, "https://player.bfi.org.uk"],
  [/sky\s*go|sky\s*store|\bnow\b/i, "https://www.nowtv.com"],
  [/crave/i, "https://www.crave.ca"]
];
var SAFE_HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
function isSafeHttpUrl(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return SAFE_HTTP_URL_REGEX.test(trimmed);
}
function buildTmdbWatchPageUrl(mediaType, mediaId, region) {
  const safeType = mediaType === "tv" ? "tv" : "movie";
  const base = `https://www.themoviedb.org/${safeType}/${mediaId}/watch`;
  if (region && VALID_REGION_CODES.has(region.toUpperCase())) {
    return `${base}?locale=${region.toUpperCase()}`;
  }
  return base;
}
function findKnownProviderUrl(providerName) {
  const normalized = (providerName || "").trim();
  if (!normalized) return void 0;
  for (const [pattern, url] of KNOWN_PROVIDER_URLS) {
    if (pattern.test(normalized)) {
      return url;
    }
  }
  return void 0;
}
function resolveWatchProviderUrl(provider, mediaType, mediaId, regionWatchLink) {
  if (isSafeHttpUrl(provider.link)) {
    return provider.link.trim();
  }
  const directPlatformUrl = findKnownProviderUrl(provider.providerName);
  if (directPlatformUrl) {
    return directPlatformUrl;
  }
  if (isSafeHttpUrl(regionWatchLink)) {
    return regionWatchLink.trim();
  }
  return buildTmdbWatchPageUrl(mediaType, mediaId);
}
var PREFERRED_REGIONS = ["US", "GB", "CA", "AU"];
var AVAILABILITY_BUCKETS = [
  "flatrate",
  "free",
  "ads",
  "rent",
  "buy"
];
function hasAnyProviderEntries(country) {
  if (!country) return false;
  return AVAILABILITY_BUCKETS.some(
    (bucket) => Array.isArray(country[bucket]) && country[bucket].length > 0
  );
}
function extractTmdbWatchProvidersWithRegion(watchProvidersPayload, mediaType, mediaId, maxProviders = 12, preferredRegion) {
  const results = watchProvidersPayload?.results;
  if (!results || typeof results !== "object") {
    return { providers: [], regionUsed: null };
  }
  let chosenCountry;
  let chosenCode = null;
  const requested = preferredRegion ? preferredRegion.trim().toUpperCase() : "";
  const searchOrder = requested ? [requested, ...PREFERRED_REGIONS.filter((r) => r !== requested)] : [...PREFERRED_REGIONS];
  for (const region of searchOrder) {
    if (hasAnyProviderEntries(results[region])) {
      chosenCountry = results[region];
      chosenCode = region;
      break;
    }
  }
  if (!chosenCountry) {
    for (const [code, country] of Object.entries(results)) {
      if (hasAnyProviderEntries(country)) {
        chosenCountry = country;
        chosenCode = code;
        break;
      }
    }
  }
  if (!chosenCountry) {
    return { providers: [], regionUsed: null };
  }
  const regionLink = isSafeHttpUrl(chosenCountry.link) ? chosenCountry.link.trim() : void 0;
  const collected = [];
  const seenKeys = /* @__PURE__ */ new Set();
  for (const bucket of AVAILABILITY_BUCKETS) {
    const list = chosenCountry[bucket];
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || !raw.provider_id || !raw.provider_name) continue;
      const dedupeKey = String(raw.provider_id);
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);
      collected.push({
        providerId: raw.provider_id,
        providerName: raw.provider_name,
        logoPath: raw.logo_path ? `https://image.tmdb.org/t/p/w92${raw.logo_path}` : void 0,
        type: bucket,
        link: resolveWatchProviderUrl(
          { providerName: raw.provider_name },
          mediaType,
          mediaId,
          regionLink
        )
      });
      if (collected.length >= maxProviders) {
        return { providers: collected, regionUsed: chosenCode };
      }
    }
  }
  return { providers: collected, regionUsed: chosenCode };
}

// src/utils/ratings.ts
function clampStarRating(stars) {
  if (!Number.isFinite(stars)) return 1;
  return Math.min(5, Math.max(1, Math.round(stars)));
}
function starRatingToTenScale(stars) {
  return clampStarRating(stars) * 2;
}
function buildUserReviewDocId(mediaType, mediaId, userId) {
  const safeType = mediaType === "tv" ? "tv" : "movie";
  const safeMediaId = Math.max(1, Math.floor(Number(mediaId) || 1));
  const safeUid = (userId || "user").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `rev_${safeType}_${safeMediaId}_${safeUid}`.slice(0, 128);
}

// src/server/apiApp.ts
var ADMIN_EMAIL = "danny2010qwert@gmail.com";
var CACHE_TTL = 60 * 60 * 1e3;
var TMDB_RATE_LIMIT = 120;
var TMDB_RATE_WINDOW_MS = 60 * 1e3;
var VALID_DOC_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
var TMDB_GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10765: "Sci-Fi & Fantasy",
  10768: "War & Politics"
};
var TMDB_MOVIE_GENRE_PARAM_MAP = {
  action: "28",
  adventure: "12",
  animation: "16",
  comedy: "35",
  crime: "80",
  documentary: "99",
  drama: "18",
  family: "10751",
  fantasy: "14",
  history: "36",
  horror: "27",
  music: "10402",
  mystery: "9648",
  romance: "10749",
  "science fiction": "878",
  "tv movie": "10770",
  thriller: "53",
  war: "10752",
  western: "37",
  "action & adventure": "28|12",
  "sci-fi & fantasy": "878|14",
  "war & politics": "10752"
};
var TMDB_TV_GENRE_PARAM_MAP = {
  action: "10759",
  adventure: "10759",
  "action & adventure": "10759",
  animation: "16",
  comedy: "35",
  crime: "80",
  documentary: "99",
  drama: "18",
  family: "10751",
  fantasy: "10765",
  kids: "10762",
  mystery: "9648",
  news: "10763",
  reality: "10764",
  "science fiction": "10765",
  "sci-fi & fantasy": "10765",
  soap: "10766",
  talk: "10767",
  war: "10768",
  "war & politics": "10768",
  western: "37"
};
function resolveTmdbGenreParam(genre, mType) {
  const key = genre.trim().toLowerCase();
  if (!key || key === "all") return void 0;
  return mType === "movie" ? TMDB_MOVIE_GENRE_PARAM_MAP[key] : TMDB_TV_GENRE_PARAM_MAP[key];
}
function resolveFirebaseApiKey() {
  if (process.env.FIREBASE_API_KEY) {
    return process.env.FIREBASE_API_KEY;
  }
  if (firebase_applet_config_default && typeof firebase_applet_config_default.apiKey === "string" && firebase_applet_config_default.apiKey) {
    return firebase_applet_config_default.apiKey;
  }
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
      path.resolve(process.cwd(), "firebase-applet-config.json"),
      path.resolve(currentDir, "../../firebase-applet-config.json")
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const parsed = JSON.parse(fs.readFileSync(candidate, "utf8"));
        if (parsed?.apiKey) return parsed.apiKey;
      }
    }
  } catch (err) {
    console.warn("[ASTREON Server] Could not read firebase-applet-config.json:", err);
  }
  return "";
}
function isSyntheticLocalMediaId(id) {
  return Number.isFinite(id) && id >= 99e5 && id < 991e4;
}
function mapTmdbSummaryToMediaItem(raw, explicitType) {
  const mType = explicitType || (raw.media_type === "tv" ? "tv" : raw.media_type === "movie" ? "movie" : raw.first_air_date ? "tv" : "movie");
  const title = raw.title || raw.name;
  if (!raw.id || !title) return null;
  const genres = Array.isArray(raw.genres) ? raw.genres.map((g) => g.name) : Array.isArray(raw.genre_ids) ? raw.genre_ids.map((gid) => TMDB_GENRE_MAP[gid]).filter(Boolean) : [];
  return {
    id: Number(raw.id),
    title,
    originalTitle: raw.original_title || raw.original_name,
    overview: raw.overview || "Overview unavailable.",
    mediaType: mType,
    releaseDate: raw.release_date,
    firstAirDate: raw.first_air_date,
    posterPath: raw.poster_path ? `https://image.tmdb.org/t/p/w780${raw.poster_path}` : "",
    backdropPath: raw.backdrop_path ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}` : "",
    voteAverage: Math.round((raw.vote_average || 0) * 10) / 10,
    voteCount: raw.vote_count || 0,
    genres: genres.length > 0 ? genres : [mType === "movie" ? "Cinema" : "Series"],
    genreIds: raw.genre_ids
  };
}
function createApiApp() {
  const app2 = express();
  const firebaseApiKey = resolveFirebaseApiKey();
  const getTmdbApiKey = () => process.env.TMDB_API_KEY || "";
  const tokenCache = /* @__PURE__ */ new Map();
  const tmdbCache = /* @__PURE__ */ new Map();
  const tmdbRateBuckets = /* @__PURE__ */ new Map();
  let mediaItems = [...SEED_MEDIA];
  let newsArticles = [...SEED_NEWS];
  let reviews = [...SEED_REVIEWS];
  let auditLogs = [...SEED_AUDIT_LOGS];
  let featuredMediaId = INITIAL_FEATURED_ID;
  function upsertCatalogItem(item) {
    const idx = mediaItems.findIndex((m) => m.id === item.id && m.mediaType === item.mediaType);
    if (idx === -1) {
      mediaItems.push(item);
    } else {
      mediaItems[idx] = { ...mediaItems[idx], ...item };
    }
  }
  async function verifyFirebaseToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const idToken = authHeader.slice(7).trim();
    if (!idToken || !firebaseApiKey) return null;
    const cached = tokenCache.get(idToken);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          signal: AbortSignal.timeout(4e3)
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const u = data?.users?.[0];
      if (!u || !u.localId) return null;
      const verified = {
        uid: u.localId,
        email: u.email || "",
        emailVerified: Boolean(u.emailVerified),
        displayName: u.displayName
      };
      tokenCache.set(idToken, { user: verified, expiresAt: Date.now() + 5 * 60 * 1e3 });
      return verified;
    } catch {
      return null;
    }
  }
  async function requireAuth(req, res, next) {
    const user = await verifyFirebaseToken(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.authUser = user;
    next();
  }
  async function requireAdmin(req, res, next) {
    const user = await verifyFirebaseToken(req);
    if (!user) {
      return res.status(401).json({ error: "Admin authentication required" });
    }
    if (user.email.toLowerCase() !== ADMIN_EMAIL || !user.emailVerified) {
      return res.status(403).json({ error: "Verified administrator privileges required" });
    }
    req.authUser = user;
    next();
  }
  async function fetchFromTMDB(endpoint, params = {}) {
    const apiKey = getTmdbApiKey();
    if (!apiKey) return null;
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.set("api_key", apiKey);
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val);
    }
    const cacheKey = url.toString();
    const cached = tmdbCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5e3)
      });
      if (!res.ok) {
        if (res.status === 404) {
          tmdbCache.set(cacheKey, { data: null, timestamp: Date.now() });
          return null;
        }
        console.warn(`TMDB request failed: ${res.status} ${res.statusText}`);
        return null;
      }
      const data = await res.json();
      tmdbCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.warn("TMDB API fetch error:", err);
      return null;
    }
  }
  function tmdbRateLimiter(req, res, next) {
    if (req.method !== "GET") return next();
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    const now = Date.now();
    const bucket = tmdbRateBuckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      tmdbRateBuckets.set(ip, { count: 1, resetAt: now + TMDB_RATE_WINDOW_MS });
    } else {
      bucket.count += 1;
      if (bucket.count > TMDB_RATE_LIMIT) {
        res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1e3)));
        return res.status(429).json({ error: "Rate limit exceeded. Please retry shortly." });
      }
    }
    res.setHeader(
      "Cache-Control",
      "public, max-age=120, s-maxage=300, stale-while-revalidate=600"
    );
    next();
  }
  app2.use((req, _res, next) => {
    if (req.url.startsWith("/.netlify/functions/api")) {
      req.url = normalizeNetlifyApiPath(req.url);
    }
    next();
  });
  app2.use(express.json());
  app2.use("/api/tmdb", tmdbRateLimiter);
  app2.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      platform: "ASTREON",
      tmdbConnected: Boolean(getTmdbApiKey()),
      runtime: process.env.NETLIFY ? "netlify-functions" : "node-express",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.get("/api/tmdb/featured", (_req, res) => {
    const featured = mediaItems.find((m) => m.id === featuredMediaId) || mediaItems[0];
    res.json(featured);
  });
  app2.post("/api/tmdb/featured", requireAdmin, (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Media ID is required" });
    }
    const found = mediaItems.find((m) => m.id === Number(id));
    if (!found) {
      return res.status(404).json({ error: "Media title not found in catalog" });
    }
    featuredMediaId = Number(id);
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.email || req.body.actor || ADMIN_EMAIL,
      action: "SET_FEATURED_MEDIA",
      targetType: "hero_feature",
      targetId: featuredMediaId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Updated hero featured media to: ${found.title}`
    });
    res.json({ success: true, featured: found });
  });
  app2.get("/api/tmdb/search", async (req, res) => {
    const queryText = (req.query.q || "").trim();
    const type = req.query.type || "all";
    const language = (req.query.language || "en-US").trim();
    const isDefaultLang = language === "en-US";
    const localResults = filterMedia(mediaItems, {
      type,
      searchQuery: queryText
    });
    if (!queryText || !getTmdbApiKey()) {
      return res.json({ results: sortMedia(localResults, "popularity.desc"), source: "catalog" });
    }
    const endpoint = type === "movie" ? "/search/movie" : type === "tv" ? "/search/tv" : "/search/multi";
    const live = await fetchFromTMDB(endpoint, {
      query: queryText,
      include_adult: "false",
      page: "1",
      language
    });
    if (!live || !Array.isArray(live.results)) {
      return res.json({ results: sortMedia(localResults, "popularity.desc"), source: "catalog" });
    }
    const liveMapped = [];
    for (const raw of live.results) {
      if (raw.media_type === "person") continue;
      const mapped = mapTmdbSummaryToMediaItem(raw, type === "all" ? void 0 : type);
      if (mapped) {
        if (isDefaultLang) upsertCatalogItem(mapped);
        liveMapped.push(mapped);
      }
    }
    const seen = new Set(liveMapped.map((m) => `${m.mediaType}:${m.id}`));
    const merged = [...liveMapped, ...localResults.filter((m) => !seen.has(`${m.mediaType}:${m.id}`))];
    res.json({ results: merged.slice(0, 24), source: "tmdb" });
  });
  app2.get("/api/tmdb/trending", async (req, res) => {
    const type = req.query.type || "all";
    const language = (req.query.language || "en-US").trim();
    const isDefaultLang = language === "en-US";
    if (getTmdbApiKey()) {
      const live = await fetchFromTMDB(`/trending/${type}/week`, { page: "1", language });
      if (live && Array.isArray(live.results)) {
        const mapped = [];
        for (const raw of live.results) {
          if (raw.media_type === "person") continue;
          const item = mapTmdbSummaryToMediaItem(raw, type === "all" ? void 0 : type);
          if (item) {
            if (isDefaultLang) upsertCatalogItem(item);
            mapped.push(item);
          }
        }
        if (mapped.length > 0) {
          return res.json({ results: mapped, source: "tmdb" });
        }
      }
    }
    const fallback = sortMedia(filterMedia(mediaItems, { type }), "popularity.desc");
    res.json({ results: fallback, source: "catalog" });
  });
  app2.get("/api/tmdb/upcoming", async (req, res) => {
    const rawType = req.query.type || "all";
    const type = rawType === "movie" || rawType === "tv" ? rawType : "all";
    const language = (req.query.language || "en-US").trim();
    const isDefaultLang = language === "en-US";
    const todayIso = getTodayIsoDate();
    const tomorrowDate = /* @__PURE__ */ new Date(`${todayIso}T12:00:00Z`);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrowIso = getTodayIsoDate(tomorrowDate);
    if (getTmdbApiKey()) {
      const fetchUpcomingMovies = type === "all" || type === "movie" ? Promise.all([
        fetchFromTMDB("/discover/movie", {
          page: "1",
          include_adult: "false",
          sort_by: "popularity.desc",
          "primary_release_date.gte": tomorrowIso,
          language
        }),
        fetchFromTMDB("/movie/upcoming", {
          page: "1",
          language
        })
      ]) : Promise.resolve([null, null]);
      const fetchUpcomingTv = type === "all" || type === "tv" ? fetchFromTMDB("/discover/tv", {
        page: "1",
        include_adult: "false",
        sort_by: "popularity.desc",
        "first_air_date.gte": tomorrowIso,
        language
      }) : Promise.resolve(null);
      const [[movieDiscover, movieUpcoming], tvPopular] = await Promise.all([
        fetchUpcomingMovies,
        fetchUpcomingTv
      ]);
      const movieItemsRaw = [];
      for (const resp of [movieDiscover, movieUpcoming]) {
        if (resp && Array.isArray(resp.results)) {
          for (const raw of resp.results) {
            const mapped = mapTmdbSummaryToMediaItem(raw, "movie");
            if (mapped && mapped.posterPath) {
              if (isDefaultLang) upsertCatalogItem(mapped);
              movieItemsRaw.push(mapped);
            }
          }
        }
      }
      const tvItemsRaw = [];
      if (tvPopular && Array.isArray(tvPopular.results)) {
        for (const raw of tvPopular.results) {
          const mapped = mapTmdbSummaryToMediaItem(raw, "tv");
          if (mapped && mapped.posterPath) {
            if (isDefaultLang) upsertCatalogItem(mapped);
            tvItemsRaw.push(mapped);
          }
        }
      }
      const upcomingMovies = getUpcomingMediaItems(
        movieItemsRaw,
        todayIso,
        type === "movie" ? 24 : 12
      );
      const upcomingTv = getUpcomingMediaItems(
        tvItemsRaw,
        todayIso,
        type === "tv" ? 24 : 12
      );
      const combined = getUpcomingMediaItems([...upcomingMovies, ...upcomingTv], todayIso, 24);
      if (combined.length > 0) {
        return res.json({ results: combined, source: "tmdb", asOf: todayIso });
      }
    }
    const filteredCatalog = type === "all" ? mediaItems : mediaItems.filter((item) => item.mediaType === type);
    const fallback = getUpcomingMediaItems(filteredCatalog, todayIso, 24);
    res.json({ results: fallback, source: "catalog", asOf: todayIso });
  });
  app2.get("/api/tmdb/discover", async (req, res) => {
    const type = req.query.type || "all";
    const genre = req.query.genre || "";
    const year = req.query.year || "";
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;
    const sortBy = req.query.sortBy || "popularity.desc";
    const queryText = (req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
    const language = (req.query.language || "en-US").trim();
    const isDefaultLang = language === "en-US";
    if (getTmdbApiKey() && queryText) {
      const searchTargets = type === "all" ? ["movie", "tv"] : [type];
      const searchResponses = await Promise.all(
        searchTargets.map(
          (mType) => fetchFromTMDB(`/search/${mType}`, {
            query: queryText,
            page: String(page),
            include_adult: "false",
            language
          })
        )
      );
      const searchMapped = [];
      let maxPages = 1;
      let totalResults = 0;
      searchResponses.forEach((resp, idx) => {
        const mType = searchTargets[idx];
        if (resp && Array.isArray(resp.results)) {
          maxPages = Math.max(maxPages, Math.min(resp.total_pages || 1, 50));
          totalResults += resp.total_results || resp.results.length;
          for (const raw of resp.results) {
            const item = mapTmdbSummaryToMediaItem(raw, mType);
            if (item && item.posterPath) {
              if (isDefaultLang) upsertCatalogItem(item);
              searchMapped.push(item);
            }
          }
        }
      });
      const filteredLive = filterMedia(searchMapped, {
        type,
        genre,
        year,
        minRating
      });
      const localMatches = page === 1 ? filterMedia(SEED_MEDIA, { type, genre, year, minRating, searchQuery: queryText }) : [];
      const seen = new Set(filteredLive.map((m) => `${m.mediaType}:${m.id}`));
      const combined = [...filteredLive, ...localMatches.filter((m) => !seen.has(`${m.mediaType}:${m.id}`))];
      if (combined.length > 0 || searchMapped.length > 0) {
        const sorted = sortMedia(combined, sortBy);
        return res.json({
          results: sorted,
          total: Math.max(totalResults, sorted.length),
          page,
          totalPages: maxPages,
          source: "tmdb"
        });
      }
    }
    if (getTmdbApiKey() && !queryText) {
      const hasGenreFilter = Boolean(genre && genre !== "All");
      const tmdbSortMovie = sortBy === "title.asc" ? "original_title.asc" : sortBy === "primary_release_date.desc" ? "primary_release_date.desc" : sortBy;
      const tmdbSortTv = sortBy === "title.asc" ? "original_name.asc" : sortBy === "primary_release_date.desc" ? "first_air_date.desc" : sortBy;
      const buildParams = (mType, genreParam) => {
        const p = {
          page: String(page),
          include_adult: "false",
          sort_by: mType === "movie" ? tmdbSortMovie : tmdbSortTv,
          language
        };
        if (genreParam) p.with_genres = genreParam;
        if (year && year !== "All" && /^\d{4}$/.test(year)) {
          p[mType === "movie" ? "primary_release_year" : "first_air_date_year"] = year;
        }
        if (minRating > 0) p["vote_average.gte"] = String(minRating);
        if (sortBy === "vote_average.desc") p["vote_count.gte"] = "200";
        return p;
      };
      const rawTargets = type === "all" ? ["movie", "tv"] : [type];
      const resolvedTargets = rawTargets.map((mType) => ({
        mType,
        genreParam: hasGenreFilter ? resolveTmdbGenreParam(genre, mType) : void 0
      })).filter((entry) => !hasGenreFilter || Boolean(entry.genreParam));
      const responses = await Promise.all(
        resolvedTargets.map((entry) => fetchFromTMDB(`/discover/${entry.mType}`, buildParams(entry.mType, entry.genreParam)))
      );
      const liveMapped = [];
      let maxPages = 1;
      let totalResults = 0;
      responses.forEach((resp, idx) => {
        const mType = resolvedTargets[idx].mType;
        if (resp && Array.isArray(resp.results)) {
          maxPages = Math.max(maxPages, Math.min(resp.total_pages || 1, 50));
          totalResults += resp.total_results || resp.results.length;
          for (const raw of resp.results) {
            const item = mapTmdbSummaryToMediaItem(raw, mType);
            if (item && item.posterPath) {
              if (isDefaultLang) upsertCatalogItem(item);
              liveMapped.push(item);
            }
          }
        }
      });
      if (liveMapped.length > 0) {
        let merged = liveMapped;
        if (page === 1) {
          const localFiltered = filterMedia(SEED_MEDIA, {
            type,
            genre,
            year,
            minRating,
            searchQuery: queryText
          });
          const seen = new Set(liveMapped.map((m) => `${m.mediaType}:${m.id}`));
          merged = [...liveMapped, ...localFiltered.filter((m) => !seen.has(`${m.mediaType}:${m.id}`))];
        }
        const sorted = sortMedia(merged, sortBy);
        return res.json({
          results: sorted,
          total: Math.max(totalResults, sorted.length),
          page,
          totalPages: maxPages,
          source: "tmdb"
        });
      }
    }
    let filtered = filterMedia(mediaItems, {
      type,
      genre,
      year,
      minRating,
      searchQuery: queryText
    });
    filtered = sortMedia(filtered, sortBy);
    res.json({
      results: page === 1 ? filtered : [],
      total: filtered.length,
      page,
      totalPages: 1,
      source: "catalog"
    });
  });
  app2.get("/api/tmdb/details/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    if (type !== "movie" && type !== "tv") {
      return res.status(400).json({ error: "Invalid media type; expected movie or tv" });
    }
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid numeric media ID" });
    }
    const numId = parseInt(id, 10);
    if (!Number.isSafeInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: "Media ID must be a positive integer" });
    }
    const language = (req.query.language || "en-US").trim();
    const rawRegion = (req.query.region || "US").trim().toUpperCase();
    const region = /^[A-Z]{2}$/.test(rawRegion) ? rawRegion : "US";
    const isDefaultLang = language === "en-US";
    const isDefaultRegion = region === "US";
    const localMatch = mediaItems.find(
      (m) => m.id === numId && m.mediaType === type
    );
    if (isSyntheticLocalMediaId(numId)) {
      if (localMatch) {
        return res.json(localMatch);
      }
      return res.status(404).json({ error: "Title not found" });
    }
    if (localMatch && (localMatch._tmdbEnriched && isDefaultLang && isDefaultRegion || !getTmdbApiKey())) {
      return res.json(localMatch);
    }
    if (getTmdbApiKey()) {
      const live = await fetchFromTMDB(`/${type}/${numId}`, {
        append_to_response: "credits,videos,watch/providers,similar",
        language
      });
      if (live) {
        const similarItems = [];
        for (const s of (live.similar?.results || []).slice(0, 8)) {
          const mappedSim = mapTmdbSummaryToMediaItem(s, type);
          if (mappedSim) {
            if (isDefaultLang && !mediaItems.some((m) => m.id === mappedSim.id && m.mediaType === mappedSim.mediaType)) {
              mediaItems.push(mappedSim);
            }
            similarItems.push(mappedSim);
          }
        }
        const liveCast = (live.credits?.cast || []).slice(0, 12).map((c) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : void 0
        }));
        const liveVideos = (live.videos?.results || []).map((v) => ({
          id: v.id,
          key: v.key,
          name: v.name,
          site: v.site,
          type: v.type,
          official: v.official
        }));
        const { providers: liveProviders, regionUsed } = extractTmdbWatchProvidersWithRegion(
          live["watch/providers"],
          type,
          numId,
          16,
          region
        );
        const preserveLocalBackdrop = localMatch?.backdropPath && localMatch.backdropPath.startsWith("/assets/images/") ? localMatch.backdropPath : void 0;
        const mapped = {
          id: live.id,
          title: live.title || live.name,
          originalTitle: live.original_title || live.original_name,
          overview: live.overview || localMatch?.overview || "Overview unavailable.",
          mediaType: type,
          releaseDate: live.release_date,
          firstAirDate: live.first_air_date,
          posterPath: live.poster_path ? `https://image.tmdb.org/t/p/w780${live.poster_path}` : localMatch?.posterPath || "",
          backdropPath: preserveLocalBackdrop || (live.backdrop_path ? `https://image.tmdb.org/t/p/original${live.backdrop_path}` : localMatch?.backdropPath || ""),
          voteAverage: Math.round((live.vote_average || 0) * 10) / 10,
          voteCount: live.vote_count || 0,
          genres: (live.genres || []).map((g) => TMDB_GENRE_MAP[g.id] || g.name),
          runtime: live.runtime,
          numberOfSeasons: live.number_of_seasons,
          numberOfEpisodes: live.number_of_episodes,
          status: live.status,
          tagline: live.tagline || localMatch?.tagline,
          featured: localMatch?.featured,
          cast: liveCast.length > 0 ? liveCast : localMatch?.cast,
          crew: (live.credits?.crew || []).slice(0, 6).map((cr) => ({
            id: cr.id,
            name: cr.name,
            job: cr.job,
            department: cr.department
          })),
          videos: liveVideos.length > 0 ? liveVideos : localMatch?.videos,
          providers: liveProviders && liveProviders.length > 0 ? liveProviders : localMatch?.providers,
          providerRegion: regionUsed || region,
          similarIds: similarItems.length > 0 ? similarItems.map((s) => s.id) : localMatch?.similarIds,
          _tmdbEnriched: true
        };
        if (isDefaultLang && isDefaultRegion) upsertCatalogItem(mapped);
        return res.json(mapped);
      }
    }
    if (localMatch) {
      return res.json(localMatch);
    }
    res.status(404).json({ error: "Title not found" });
  });
  app2.get("/api/tmdb/tv/:id/season/:seasonNumber", async (req, res) => {
    const { id, seasonNumber } = req.params;
    if (!/^\d+$/.test(id) || !/^\d+$/.test(seasonNumber)) {
      return res.status(400).json({ error: "Invalid numeric TV show or season number" });
    }
    const tvId = parseInt(id, 10);
    const seasonNum = parseInt(seasonNumber, 10);
    if (!Number.isSafeInteger(tvId) || tvId <= 0 || seasonNum < 0 || seasonNum > 100) {
      return res.status(400).json({ error: "TV ID and season number out of range" });
    }
    const language = (req.query.language || "en-US").trim();
    if (getTmdbApiKey() && !isSyntheticLocalMediaId(tvId)) {
      const liveSeason = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNum}`, { language });
      if (liveSeason && Array.isArray(liveSeason.episodes)) {
        return res.json({
          id: liveSeason.id || tvId * 100 + seasonNum,
          seasonNumber: liveSeason.season_number ?? seasonNum,
          name: liveSeason.name || `Season ${seasonNum}`,
          overview: liveSeason.overview || "",
          airDate: liveSeason.air_date,
          posterPath: liveSeason.poster_path ? `https://image.tmdb.org/t/p/w342${liveSeason.poster_path}` : null,
          episodes: liveSeason.episodes.map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episode_number,
            seasonNumber: ep.season_number ?? seasonNum,
            name: ep.name || `Episode ${ep.episode_number}`,
            overview: ep.overview || "",
            airDate: ep.air_date,
            runtime: ep.runtime || null,
            stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null,
            voteAverage: ep.vote_average ? Math.round(ep.vote_average * 10) / 10 : void 0
          })),
          source: "tmdb"
        });
      }
    }
    const localTv = mediaItems.find((m) => m.id === tvId && m.mediaType === "tv");
    if (localTv) {
      const totalSeasons = localTv.numberOfSeasons || 1;
      const estimatedCount = Math.min(
        Math.max(Math.round((localTv.numberOfEpisodes || 8) / totalSeasons), 4),
        12
      );
      const episodes = Array.from({ length: estimatedCount }, (_, idx) => ({
        id: tvId * 1e3 + seasonNum * 100 + idx + 1,
        episodeNumber: idx + 1,
        seasonNumber: seasonNum,
        name: `Season ${seasonNum} \xB7 Chapter ${idx + 1}`,
        overview: idx === 0 ? localTv.overview : `Episode ${idx + 1} of ${localTv.title} Season ${seasonNum}.`,
        airDate: localTv.firstAirDate,
        runtime: localTv.episodeRunTime?.[0] || 48,
        stillPath: null
      }));
      return res.json({
        id: tvId * 100 + seasonNum,
        seasonNumber: seasonNum,
        name: `Season ${seasonNum}`,
        overview: localTv.overview,
        airDate: localTv.firstAirDate,
        posterPath: localTv.posterPath || null,
        episodes,
        source: "catalog"
      });
    }
    res.status(404).json({ error: "Season details unavailable" });
  });
  app2.get("/api/tmdb/person/:id", async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid numeric person ID" });
    }
    const personId = parseInt(id, 10);
    if (!Number.isSafeInteger(personId) || personId <= 0) {
      return res.status(400).json({ error: "Person ID must be a positive integer" });
    }
    const language = (req.query.language || "en-US").trim();
    if (getTmdbApiKey() && !isSyntheticLocalMediaId(personId)) {
      const livePerson = await fetchFromTMDB(`/person/${personId}`, {
        append_to_response: "combined_credits",
        language
      });
      if (livePerson && livePerson.id) {
        const rawCredits = [
          ...Array.isArray(livePerson.combined_credits?.cast) ? livePerson.combined_credits.cast : [],
          ...Array.isArray(livePerson.combined_credits?.crew) ? livePerson.combined_credits.crew : []
        ];
        const dedupedCredits = /* @__PURE__ */ new Map();
        for (const cr of rawCredits) {
          const mType = cr.media_type === "tv" ? "tv" : "movie";
          const title = cr.title || cr.name;
          if (!cr.id || !title) continue;
          const key = `${mType}:${cr.id}`;
          if (!dedupedCredits.has(key)) {
            dedupedCredits.set(key, {
              id: cr.id,
              mediaType: mType,
              title,
              posterPath: cr.poster_path ? `https://image.tmdb.org/t/p/w342${cr.poster_path}` : "",
              backdropPath: cr.backdrop_path ? `https://image.tmdb.org/t/p/w780${cr.backdrop_path}` : "",
              character: cr.character || void 0,
              job: cr.job || void 0,
              releaseDate: cr.release_date || cr.first_air_date || void 0,
              voteAverage: Math.round((cr.vote_average || 0) * 10) / 10,
              _pop: cr.popularity || 0
            });
          }
        }
        const credits = Array.from(dedupedCredits.values()).sort((a, b) => (b._pop || 0) - (a._pop || 0)).slice(0, 24).map(({ _pop, ...rest }) => rest);
        return res.json({
          id: livePerson.id,
          name: livePerson.name,
          biography: livePerson.biography || "",
          birthday: livePerson.birthday || null,
          deathday: livePerson.deathday || null,
          placeOfBirth: livePerson.place_of_birth || null,
          knownForDepartment: livePerson.known_for_department || void 0,
          profilePath: livePerson.profile_path ? `https://image.tmdb.org/t/p/w300${livePerson.profile_path}` : null,
          credits,
          source: "tmdb"
        });
      }
    }
    let matchedName = "";
    let matchedProfile = null;
    let knownForDepartment = "Acting";
    const catalogCredits = [];
    for (const item of mediaItems) {
      const castHit = item.cast?.find((c) => c.id === personId);
      const crewHit = item.crew?.find((cr) => cr.id === personId);
      if (castHit) {
        matchedName = matchedName || castHit.name;
        matchedProfile = matchedProfile || castHit.profilePath || null;
        catalogCredits.push({
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          character: castHit.character,
          releaseDate: item.releaseDate || item.firstAirDate,
          voteAverage: item.voteAverage
        });
      } else if (crewHit) {
        matchedName = matchedName || crewHit.name;
        knownForDepartment = crewHit.department || "Production";
        catalogCredits.push({
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          job: crewHit.job,
          releaseDate: item.releaseDate || item.firstAirDate,
          voteAverage: item.voteAverage
        });
      }
    }
    if (matchedName) {
      return res.json({
        id: personId,
        name: matchedName,
        biography: `${matchedName} is featured across curated selections in the ASTREON catalog.`,
        knownForDepartment,
        profilePath: matchedProfile,
        credits: catalogCredits,
        source: "catalog"
      });
    }
    res.status(404).json({ error: "Person profile not found" });
  });
  app2.get("/api/news", (_req, res) => {
    res.setHeader(
      "Cache-Control",
      "public, max-age=120, s-maxage=300, stale-while-revalidate=600"
    );
    res.json({ articles: newsArticles });
  });
  app2.post("/api/news", requireAdmin, (req, res) => {
    const { id: clientId, slug: clientSlug, publishedAt: clientPublishedAt, title, excerpt, body, category, author, image, imageAlt } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }
    const articleId = typeof clientId === "string" && VALID_DOC_ID_REGEX.test(clientId) ? clientId : `art_${Date.now()}`;
    const existingSlugs = newsArticles.filter((a) => a.id !== articleId).map((a) => a.slug);
    const candidateSlug = typeof clientSlug === "string" && VALID_DOC_ID_REGEX.test(clientSlug) && !existingSlugs.includes(clientSlug) ? clientSlug : generateArticleSlug(title, existingSlugs, articleId);
    const newArticle = {
      id: articleId,
      slug: candidateSlug,
      title,
      excerpt: excerpt || title,
      body,
      category: category || "Curation",
      image: image || "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
      imageAlt: imageAlt || title,
      author: author || "ASTREON Editorial Board",
      authorRole: "Contributor",
      readTime: `${Math.max(1, Math.ceil(body.split(" ").length / 200))} min read`,
      publishedAt: typeof clientPublishedAt === "string" && clientPublishedAt ? clientPublishedAt : (/* @__PURE__ */ new Date()).toISOString(),
      status: "published"
    };
    const existingIdx = newsArticles.findIndex((a) => a.id === newArticle.id);
    if (existingIdx >= 0) {
      newsArticles[existingIdx] = newArticle;
    } else {
      newsArticles.unshift(newArticle);
    }
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.email || req.body.actor || ADMIN_EMAIL,
      action: "PUBLISH_ARTICLE",
      targetType: "article",
      targetId: newArticle.id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Published article: "${newArticle.title}"`
    });
    res.status(201).json(newArticle);
  });
  app2.put("/api/news/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const idx = newsArticles.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Article not found" });
    }
    const existing = newsArticles[idx];
    const { title, excerpt, body, category, author, image, imageAlt, status } = req.body;
    const updated = {
      ...existing,
      ...typeof title === "string" && title.trim() ? { title: title.trim() } : {},
      ...typeof excerpt === "string" && excerpt.trim() ? { excerpt: excerpt.trim() } : {},
      ...typeof body === "string" && body.trim() ? {
        body: body.trim(),
        readTime: `${Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200))} min read`
      } : {},
      ...category ? { category } : {},
      ...typeof author === "string" && author.trim() ? { author: author.trim() } : {},
      ...typeof image === "string" && image.trim() ? { image: image.trim() } : {},
      ...typeof imageAlt === "string" && imageAlt.trim() ? { imageAlt: imageAlt.trim() } : {},
      ...status === "published" || status === "draft" ? { status } : {}
    };
    newsArticles[idx] = updated;
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.email || ADMIN_EMAIL,
      action: status && status !== existing.status ? "TOGGLE_ARTICLE_STATUS" : "UPDATE_ARTICLE",
      targetType: "article",
      targetId: updated.id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Updated article "${updated.title}" (status: ${updated.status})`
    });
    res.json(updated);
  });
  app2.get("/api/reviews", (req, res) => {
    const mediaId = req.query.mediaId ? parseInt(req.query.mediaId, 10) : void 0;
    const rawType = req.query.mediaType;
    const mediaType = rawType === "movie" || rawType === "tv" ? rawType : void 0;
    if (mediaId) {
      const matched = reviews.filter(
        (r) => r.mediaId === mediaId && (!mediaType || !r.mediaType || r.mediaType === mediaType)
      );
      return res.json({ reviews: matched });
    }
    res.json({ reviews });
  });
  app2.post("/api/reviews", requireAuth, (req, res) => {
    const {
      id: clientId,
      createdAt: clientCreatedAt,
      userId,
      userName,
      userAvatar,
      mediaId,
      mediaType,
      rating,
      starRating,
      reviewText
    } = req.body;
    const verifiedUid = req.authUser?.uid;
    if (!verifiedUid || userId && userId !== verifiedUid) {
      return res.status(403).json({ error: "Authenticated identity mismatch" });
    }
    if (!userName || !mediaId || rating === void 0 && starRating === void 0) {
      return res.status(400).json({ error: "Missing required review fields" });
    }
    const hasStarRating = starRating !== void 0 && starRating !== null;
    let resolvedStars;
    let numRating;
    if (hasStarRating) {
      const parsedStars = Number(starRating);
      if (!Number.isFinite(parsedStars) || parsedStars < 1 || parsedStars > 5) {
        return res.status(400).json({ error: "Star rating must be a number between 1 and 5" });
      }
      resolvedStars = clampStarRating(parsedStars);
      numRating = starRatingToTenScale(resolvedStars);
    } else {
      numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 10) {
        return res.status(400).json({ error: "Rating must be a number between 1 and 10" });
      }
    }
    const trimmedText = typeof reviewText === "string" ? reviewText.trim() : "";
    if (!hasStarRating && trimmedText.length < 5) {
      return res.status(400).json({ error: "Review text must be between 5 and 2000 characters" });
    }
    if (trimmedText.length > 2e3) {
      return res.status(400).json({ error: "Review text must be at most 2000 characters" });
    }
    const resolvedType = mediaType === "tv" ? "tv" : "movie";
    const existing = reviews.find(
      (r) => r.userId === verifiedUid && r.mediaId === Number(mediaId) && r.mediaType === resolvedType
    );
    if (existing) {
      existing.rating = numRating;
      if (resolvedStars !== void 0) {
        existing.starRating = resolvedStars;
      }
      existing.reviewText = trimmedText;
      existing.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      return res.json({ message: "Review updated successfully", review: existing });
    }
    const reviewId = typeof clientId === "string" && VALID_DOC_ID_REGEX.test(clientId) ? clientId : buildUserReviewDocId(resolvedType, Number(mediaId), verifiedUid);
    const newReview = {
      id: reviewId,
      userId: verifiedUid,
      userName: String(userName).trim().slice(0, 100) || "ASTREON Member",
      ...typeof userAvatar === "string" && userAvatar.trim() ? { userAvatar: userAvatar.trim().slice(0, 500) } : {},
      mediaId: Number(mediaId),
      mediaType: resolvedType,
      rating: numRating,
      ...resolvedStars !== void 0 ? { starRating: resolvedStars } : {},
      reviewText: trimmedText,
      status: "published",
      createdAt: typeof clientCreatedAt === "string" && clientCreatedAt ? clientCreatedAt : (/* @__PURE__ */ new Date()).toISOString(),
      helpfulCount: 0
    };
    reviews.unshift(newReview);
    res.status(201).json({ message: "Review published", review: newReview });
  });
  app2.put("/api/reviews/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const { rating, starRating, reviewText } = req.body;
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    if (review.userId !== req.authUser?.uid) {
      return res.status(403).json({ error: "Only the review author can edit this review" });
    }
    const hasStarRating = starRating !== void 0 && starRating !== null;
    let resolvedStars;
    let numRating;
    if (hasStarRating) {
      const parsedStars = Number(starRating);
      if (!Number.isFinite(parsedStars) || parsedStars < 1 || parsedStars > 5) {
        return res.status(400).json({ error: "Star rating must be a number between 1 and 5" });
      }
      resolvedStars = clampStarRating(parsedStars);
      numRating = starRatingToTenScale(resolvedStars);
    } else {
      numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 10) {
        return res.status(400).json({ error: "Rating must be a number between 1 and 10" });
      }
    }
    const trimmedText = typeof reviewText === "string" ? reviewText.trim() : "";
    if (!hasStarRating && trimmedText.length < 5) {
      return res.status(400).json({ error: "Review text must be between 5 and 2000 characters" });
    }
    if (trimmedText.length > 2e3) {
      return res.status(400).json({ error: "Review text must be at most 2000 characters" });
    }
    review.rating = numRating;
    if (resolvedStars !== void 0) {
      review.starRating = resolvedStars;
    }
    review.reviewText = trimmedText;
    review.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json({ success: true, review });
  });
  app2.delete("/api/reviews/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Review not found" });
    }
    const isAdminUser = req.authUser?.email.toLowerCase() === ADMIN_EMAIL && req.authUser.emailVerified;
    if (reviews[idx].userId !== req.authUser?.uid && !isAdminUser) {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }
    reviews.splice(idx, 1);
    res.json({ success: true });
  });
  app2.patch("/api/reviews/:id/helpful", requireAuth, (req, res) => {
    const { id } = req.params;
    const delta = req.body?.delta === -1 ? -1 : 1;
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    review.helpfulCount = Math.max(0, (review.helpfulCount || 0) + delta);
    res.json({ success: true, helpfulCount: review.helpfulCount });
  });
  app2.patch("/api/reviews/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    if (status && ["published", "pending", "flagged"].includes(status)) {
      review.status = status;
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        actor: req.authUser?.email || ADMIN_EMAIL,
        action: "MODERATE_REVIEW",
        targetType: "review",
        targetId: review.id,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        details: `Changed review status to ${status}`
      });
    }
    res.json({ success: true, review });
  });
  app2.post("/api/reports", requireAuth, (req, res) => {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !["review", "article", "user"].includes(targetType) || !targetId || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ error: "Valid targetType, targetId, and reason are required" });
    }
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.uid || req.authUser?.email || "user",
      action: "REPORT_SUBMITTED",
      targetType,
      targetId: String(targetId).slice(0, 128),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: `Report submitted for ${targetType} #${String(targetId).slice(0, 128)}: "${reason.trim().slice(0, 500)}"`
    });
    res.json({ success: true, message: "Report received and queued for review" });
  });
  app2.get("/api/admin/metrics", requireAdmin, (_req, res) => {
    const totalReviews = reviews.length;
    const flaggedReviews = reviews.filter((r) => r.status === "flagged").length;
    const publishedArticles = newsArticles.filter((a) => a.status === "published").length;
    res.json({
      catalogCount: mediaItems.length,
      moviesCount: mediaItems.filter((m) => m.mediaType === "movie").length,
      tvCount: mediaItems.filter((m) => m.mediaType === "tv").length,
      totalReviews,
      flaggedReviews,
      publishedArticles,
      featuredTitle: mediaItems.find((m) => m.id === featuredMediaId)?.title || "None"
    });
  });
  app2.get("/api/admin/audit-logs", requireAdmin, (_req, res) => {
    res.json({ logs: auditLogs });
  });
  return app2;
}

// server.ts
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path2.dirname(__filename);
dotenv.config();
process.on("uncaughtException", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.warn("[ASTREON Server] Handled EADDRINUSE conflict on port:", err.port);
    return;
  }
  console.error("[ASTREON Server] Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[ASTREON Server] Unhandled Rejection:", reason);
});
var app = createApiApp();
var defaultAppPort = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : 3e3;
var cliPort;
var portIdx = process.argv.indexOf("--port");
if (portIdx !== -1 && process.argv[portIdx + 1]) {
  const parsed = parseInt(process.argv[portIdx + 1], 10);
  if (!isNaN(parsed) && parsed !== 8080) cliPort = parsed;
}
var PORT = defaultAppPort;
if (cliPort) {
  PORT = cliPort;
} else if (process.env.APP_PORT) {
  PORT = parseInt(process.env.APP_PORT, 10);
} else if (process.env.PORT && parseInt(process.env.PORT, 10) !== 8080) {
  PORT = parseInt(process.env.PORT, 10);
}
var isProduction = process.env.NODE_ENV === "production";
async function startServer() {
  try {
    const distPath = path2.join(__dirname, "dist");
    const hasDist = fs2.existsSync(path2.join(distPath, "index.html"));
    if (isProduction && hasDist) {
      console.log("[ASTREON] Serving production static bundle from /dist");
      app.use(express2.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path2.join(distPath, "index.html"));
      });
    } else {
      console.log("[ASTREON] Mounting Vite middleware mode");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: "spa"
      });
      app.use(vite.middlewares);
    }
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`[ASTREON] Server running successfully at http://0.0.0.0:${PORT}`);
    });
    server.on("error", (err) => {
      if (err?.code === "EADDRINUSE") {
        console.warn(`[ASTREON] Port ${PORT} already occupied. Retrying on port 3000...`);
        if (PORT !== 3e3) {
          PORT = 3e3;
          const fallbackServer = app.listen(PORT, "0.0.0.0", () => {
            console.log(`[ASTREON] Server fallback active at http://0.0.0.0:${PORT}`);
          });
          fallbackServer.on("error", (fallbackErr) => {
            console.error("[ASTREON] Fallback server listen error:", fallbackErr);
            process.exit(1);
          });
        } else {
          console.error("[ASTREON] Primary port 3000 already in use.");
          process.exit(1);
        }
      } else {
        console.error("[ASTREON] Server listen error:", err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error("[ASTREON] Failed to start server:", err);
    process.exit(1);
  }
}
startServer();
