import type { SupportedLocale } from '../utils/i18n.ts';

export interface LocalizedMediaCopy {
  title?: string;
  overview: string;
  tagline?: string;
}

export interface LocalizedArticleCopy {
  title: string;
  excerpt: string;
  body: string;
  category: string;
  readTime: string;
}

export const LOCALIZED_MEDIA_CONTENT: Record<
  Exclude<SupportedLocale, 'en'>,
  Record<number, LocalizedMediaCopy>
> = {
  es: {
    693134: {
      title: 'Dune: Parte Dos',
      tagline: 'Larga vida a los combatientes.',
      overview:
        'Sigue el mítico viaje de Paul Atreides mientras se une a Chani y los Fremen en busca de venganza contra los conspiradores que destruyeron a su familia. Ante la disyuntiva entre el amor de su vida y el destino del universo conocido, lucha por evitar un terrible futuro que solo él puede prever.'
    },
    872585: {
      title: 'Oppenheimer',
      tagline: 'El mundo cambia para siempre.',
      overview:
        'La historia del papel de J. Robert Oppenheimer en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial, narrando tanto el triunfo científico como la profunda crisis moral posterior.'
    },
    157336: {
      title: 'Interestelar',
      tagline: 'La humanidad nació en la Tierra. Nunca estuvo destinada a morir aquí.',
      overview:
        'Un grupo de exploradores aprovecha un agujero de gusano recién descubierto para superar las limitaciones de los viajes espaciales humanos y conquistar las enormes distancias de un viaje interestelar.'
    },
    335984: {
      title: 'Blade Runner 2049',
      tagline: 'Todavía quedan páginas en esta historia.',
      overview:
        'Treinta años después de los eventos de la primera película, un nuevo blade runner, el oficial K del LAPD, desentierra un secreto oculto durante años que amenaza con sumir lo que queda de la sociedad en el caos.'
    },
    95396: {
      title: 'Separación',
      tagline: 'Por favor, no ajuste su pantalla.',
      overview:
        'Mark lidera un equipo de empleados cuyos recuerdos laborales y personales han sido divididos quirúrgicamente. Cuando un misterioso colega aparece fuera del trabajo, comienza una búsqueda para descubrir la verdad.'
    },
    126308: {
      title: 'Shōgun',
      tagline: 'El honor se paga con sangre.',
      overview:
        'Cuando un misterioso barco europeo aparece encallado cerca de un pueblo pesquero, el señor Yoshii Toranaga descubre secretos que podrían inclinar la balanza del poder en el Japón feudal.'
    },
    100088: {
      title: 'The Last of Us',
      tagline: 'Cuando estés perdido en la oscuridad, busca la luz.',
      overview:
        'Veinte años después de la destrucción de la civilización moderna, Joel, un sobreviviente endurecido, es contratado para sacar a Ellie, una joven de 14 años, de una opresiva zona de cuarentena.'
    },
    76331: {
      title: 'Sucesión',
      tagline: 'La sangre pesa más que el dinero.',
      overview:
        'La familia Roy controla el mayor conglomerado de medios y entretenimiento del mundo, pero su imperio entra en conflicto cuando el patriarca anciano decide dar un paso al costado.'
    },
    533535: {
      title: 'Deadpool y Lobezno',
      tagline: 'Juntos por primera vez.',
      overview:
        'Un apático Wade Wilson lleva una vida tranquila dejando atrás sus días como Deadpool, hasta que su mundo enfrenta una amenaza existencial y debe convencer a un reacio Wolverine para luchar juntos.'
    },
    1022789: {
      title: 'Del Revés 2 (Intensa-Mente 2)',
      tagline: 'Haz espacio para nuevas emociones.',
      overview:
        'La mente adolescente de Riley sufre una repentina remodelación para dar cabida a algo inesperado: nuevas emociones como Ansiedad se unen a Alegría, Tristeza, Furia, Temor y Desagrado.'
    },
    94605: {
      title: 'Arcane',
      tagline: 'Toda leyenda tiene un comienzo.',
      overview:
        'En medio de la marcada discordia entre las ciudades gemelas de Piltover y Zaun, dos hermanas luchan en bandos opuestos de una guerra entre tecnologías mágicas y convicciones irreconciliables.'
    },
    912649: {
      title: 'Venom: El Último Baile',
      tagline: 'Hasta que la muerte los separe.',
      overview:
        'Eddie y Venom están huyendo. Perseguidos por ambos mundos y con el cerco cerrándose, el dúo se ve obligado a tomar una decisión devastadora que bajará el telón en su último baile.'
    }
  },
  fr: {
    693134: {
      title: 'Dune : Deuxième Partie',
      tagline: 'Longue vie aux combattants.',
      overview:
        'Paul Atreides s’unit à Chani et aux Fremen tout en menant une lutte de vengeance contre ceux qui ont détruit sa famille. Confronté à un choix entre l’amour de sa vie et le destin de l’univers, il tente d’empêcher un terrible avenir.'
    },
    872585: {
      title: 'Oppenheimer',
      tagline: 'Le monde change à jamais.',
      overview:
        'Le rôle déterminant de J. Robert Oppenheimer dans le développement de la bombe atomique durant la Seconde Guerre mondiale, entre triomphe scientifique et crise morale profonde.'
    },
    157336: {
      title: 'Interstellar',
      tagline: 'L’humanité est née sur Terre. Elle n’est pas destinée à y mourir.',
      overview:
        'Un groupe d’explorateurs utilise un trou de ver récemment découvert pour dépasser les limites du voyage spatial humain et franchir les vastes distances d’un périple interstellaire.'
    },
    335984: {
      title: 'Blade Runner 2049',
      tagline: 'Il reste encore des pages à cette histoire.',
      overview:
        'Trente ans après les événements du premier film, l’officier K du LAPD met au jour un secret enfoui capable de plonger ce qu’il reste de la société dans le chaos.'
    },
    95396: {
      title: 'Severance',
      tagline: 'Veuillez ne pas régler votre écran.',
      overview:
        'Mark dirige une équipe d’employés dont les souvenirs professionnels et personnels ont été chirurgicalement séparés, jusqu’au jour où un mystérieux collègue réapparaît hors du bureau.'
    },
    126308: {
      title: 'Shōgun',
      tagline: 'L’honneur s’achète par le sang.',
      overview:
        'Lorsqu’un mystérieux navire européen s’échoue près d’un village de pêcheurs, le seigneur Yoshii Toranaga découvre des secrets capables de bouleverser l’équilibre du pouvoir au Japon féodal.'
    },
    100088: {
      title: 'The Last of Us',
      tagline: 'Quand on est perdu dans les ténèbres, il faut chercher la lumière.',
      overview:
        'Vingt ans après l’effondrement de la civilisation moderne, Joel est engagé pour exfiltrer Ellie, 14 ans, hors d’une zone de quarantaine oppressive à travers une Amérique dévastée.'
    },
    76331: {
      title: 'Succession',
      tagline: 'Le sang pèse plus lourd que l’argent.',
      overview:
        'La famille Roy règne sur le plus grand conglomérat médiatique du monde, mais la question de la succession déclenche une lutte impitoyable lorsque le patriarche vieillissant envisage de se retirer.'
    },
    533535: {
      title: 'Deadpool & Wolverine',
      tagline: 'Unis malgré eux.',
      overview:
        'Wade Wilson mène une vie civile paisible jusqu’à ce qu’une menace existentielle frappe son univers, l’obligeant à faire équipe avec un Wolverine particulièrement réticent.'
    },
    1022789: {
      title: 'Vice-Versa 2',
      tagline: 'Faites place à de nouvelles émotions.',
      overview:
        'Le quartier cérébral de Riley, désormais adolescente, subit une démolition soudaine pour accueillir de toutes nouvelles émotions menées par Anxiété.'
    },
    94605: {
      title: 'Arcane',
      tagline: 'Chaque légende a un commencement.',
      overview:
        'Au cœur des tensions entre les cités jumelles de Piltover et Zaun, deux sœurs s’affrontent dans des camps opposés alors que la magie et la technologie bouleversent leur monde.'
    },
    912649: {
      title: 'Venom : The Last Dance',
      tagline: 'Jusqu’à ce que la mort les sépare.',
      overview:
        'Eddie et Venom sont en fuite. Traqués par leurs deux mondes, ils doivent prendre une décision déchirante qui scellera leur ultime danse.'
    }
  },
  de: {
    693134: {
      title: 'Dune: Part Two',
      tagline: 'Lang leben die Kämpfer.',
      overview:
        'Paul Atreides verbündet sich mit Chani und den Fremen auf einem Rachefeldzug gegen die Verschwörer, die seine Familie vernichteten, und steht vor der Wahl zwischen seiner großen Liebe und dem Schicksal des Universums.'
    },
    872585: {
      title: 'Oppenheimer',
      tagline: 'Die Welt verändert sich für immer.',
      overview:
        'Die Geschichte von J. Robert Oppenheimers Rolle bei der Entwicklung der Atombombe im Zweiten Weltkrieg – zwischen wissenschaftlichem Durchbruch und tiefer moralischer Krise.'
    },
    157336: {
      title: 'Interstellar',
      tagline: 'Die Menschheit wurde auf der Erde geboren. Sie sollte hier nicht sterben.',
      overview:
        'Eine Gruppe von Forschern nutzt ein neu entdecktes Wurmloch, um die Grenzen menschlicher Raumfahrt zu überwinden und eine neue Heimat jenseits unseres Sonnensystems zu finden.'
    },
    335984: {
      title: 'Blade Runner 2049',
      tagline: 'In dieser Geschichte fehlen noch Seiten.',
      overview:
        'Dreißig Jahre nach dem ersten Film stößt LAPD-Officer K auf ein lange vergrabenes Geheimnis, das die Überreste der Gesellschaft ins Chaos zu stürzen droht.'
    },
    95396: {
      title: 'Severance',
      tagline: 'Bitte verstellen Sie nicht Ihren Bildschirm.',
      overview:
        'Mark leitet ein Team, dessen berufliche und private Erinnerungen chirurgisch getrennt wurden – bis ein mysteriöser Kollege außerhalb der Arbeit auftaucht.'
    },
    126308: {
      title: 'Shōgun',
      tagline: 'Ehre wird mit Blut erkauft.',
      overview:
        'Als ein europäisches Schiff vor einem japanischen Fischerdorf strandet, entdeckt Fürst Yoshii Toranaga Geheimnisse, die das Machtgefüge im feudalen Japan erschüttern.'
    },
    100088: {
      title: 'The Last of Us',
      tagline: 'Wenn du in der Dunkelheit verloren bist, suche nach dem Licht.',
      overview:
        'Zwanzig Jahre nach dem Untergang der modernen Zivilisation soll Joel die 14-jährige Ellie aus einer streng abgeriegelten Quarantänezone schmuggeln.'
    },
    76331: {
      title: 'Succession',
      tagline: 'Blut ist dicker als Geld.',
      overview:
        'Die Familie Roy kontrolliert eines der mächtigsten Medienimperien der Welt – doch als der Patriarch sich zurückzieht, entbrennt ein gnadenloser Machtkampf.'
    },
    533535: {
      title: 'Deadpool & Wolverine',
      tagline: 'Kommt zusammen.',
      overview:
        'Wade Wilson hat sein Söldnerleben hinter sich gelassen, doch als seine Heimatwelt bedroht wird, muss er sich mit einem widerwilligen Wolverine verbünden.'
    },
    1022789: {
      title: 'Alles steht Kopf 2',
      tagline: 'Macht Platz für neue Emotionen.',
      overview:
        'Im Hauptquartier von Rileys Verstand herrscht plötzlich Umbruchstimmung, als mit der Pubertät unerwartet neue Emotionen wie Zweifel einziehen.'
    },
    94605: {
      title: 'Arcane',
      tagline: 'Jede Legende hat einen Anfang.',
      overview:
        'Inmitten der scharfen Kluft zwischen den Zwillingsstädten Piltover und Zhaun kämpfen zwei Schwestern auf gegnerischen Seiten um Magie und Überzeugung.'
    },
    912649: {
      title: 'Venom: The Last Dance',
      tagline: 'Bis dass der Tod sie scheidet.',
      overview:
        'Eddie und Venom befinden sich auf der Flucht. Gejagt von beiden Welten müssen sie eine folgenschwere Entscheidung treffen, die ihren letzten Tanz besiegelt.'
    }
  },
  ja: {
    693134: {
      title: 'デューン 砂の惑星 PART2',
      tagline: '戦士たちに栄光あれ。',
      overview:
        '一族を滅ぼした陰謀者への復讐のため、チャニとフレメンの民に加わるポール・アトレイデス。愛する者か、全宇宙の運命かという過酷な選択を迫られながら、彼だけが見通す恐ろしい未来を阻止しようと立ち上がる。'
    },
    872585: {
      title: 'オッペンハイマー',
      tagline: '世界は永遠に変わる。',
      overview:
        '第二次世界大戦下、原子爆弾開発計画を率いた物理学者J・ロバート・オッペンハイマーの科学的な勝利と、その後に直面した深い道徳的危機を描く壮大な伝記ドラマ。'
    },
    157336: {
      title: 'インターステラー',
      tagline: '人類は地球で生まれた。だがここで終わる運命ではない。',
      overview:
        '新たに発見されたワームホールを利用し、人類の宇宙航行の限界を超えて星間旅行へと旅立つ探検隊の壮大な挑戦を描くSF叙事詩。'
    },
    335984: {
      title: 'ブレードランナー 2049',
      tagline: 'この物語にはまだ続きがある。',
      overview:
        '前作から30年後。LAPDの新人ブレードランナーKは、残された社会の秩序を崩壊させかねない長年葬られていた秘密を掘り起こす。'
    },
    95396: {
      title: 'セヴェランス',
      tagline: '画面の調整は不要です。',
      overview:
        '仕事中の記憶と私生活の記憶を手術で完全に分断された社員たちを率いるマーク。職場の外で謎めいた同僚と出会ったことから、真実を探る旅が始まる。'
    },
    126308: {
      title: 'SHŌGUN 将軍',
      tagline: '名誉は血によって購われる。',
      overview:
        '謎のヨーロッパ船が漁村に漂着したことをきっかけに、吉井虎永は封建時代の日本の権力均衡を覆しかねない秘密を知ることになる。'
    },
    100088: {
      title: 'THE LAST OF US',
      tagline: '闇に迷ったときは、光を探せ。',
      overview:
        '現代文明の崩壊から20年後、歴戦の生存者ジョエルは、14歳の少女エリーを厳重な隔離地域から連れ出す任務を引き受ける。'
    },
    76331: {
      title: 'メディア王 〜華麗なる一族〜',
      tagline: '血は金よりも濃い。',
      overview:
        '世界最大のメディア帝国を築いたロイ一族。高齢の父が第一線を退くことを示唆したとき、後継の座を巡る苛烈な権力闘争が幕を開ける。'
    },
    533535: {
      title: 'デッドプール＆ウルヴァリン',
      tagline: '共に戦え。',
      overview:
        '穏やかな市民生活を送っていたウェイド・ウィルソンだったが、故郷の世界が存亡の危機に瀕したことで、気乗りしないウルヴァリンと共に再びスーツを纏う。'
    },
    1022789: {
      title: 'インサイド・ヘッド2',
      tagline: '新しい感情のためのスペースを。',
      overview:
        '思春期を迎えたライリーの頭の中で、ヨロコビたちの司令部が突然の大改装を迎え、「シンパイ」をはじめとする大人の感情たちが現れる。'
    },
    94605: {
      title: 'アーケイン',
      tagline: 'すべての伝説には始まりがある。',
      overview:
        '繁栄するピルトーヴァーと地下都市ゾウンの対立が深まる中、引き裂かれた二人の姉妹が魔法技術と信念を巡り敵味方に分かれて戦う。'
    },
    912649: {
      title: 'ヴェノム：ザ・ラストダンス',
      tagline: '死が二人を分かつまで。',
      overview:
        '追われる身となったエディとヴェノム。二つの世界から迫り来る包囲網の中、二人は最後のダンスの幕を下ろす重大な決断を迫られる。'
    }
  },
  pt: {
    693134: {
      title: 'Duna: Parte Dois',
      tagline: 'Vida longa aos guerreiros.',
      overview:
        'Paul Atreides une-se a Chani e aos Fremen em uma jornada de vingança contra os conspiradores que destruíram sua família, enfrentando uma escolha entre o amor de sua vida e o destino do universo conhecido.'
    },
    872585: {
      title: 'Oppenheimer',
      tagline: 'O mundo muda para sempre.',
      overview:
        'A história do papel de J. Robert Oppenheimer no desenvolvimento da bomba atômica durante a Segunda Guerra Mundial, retratando o triunfo científico e a profunda crise moral subsequente.'
    },
    157336: {
      title: 'Interestelar',
      tagline: 'A humanidade nasceu na Terra. Nunca foi destinada a morrer aqui.',
      overview:
        'Um grupo de exploradores utiliza um buraco de minhoca recém-descoberto para superar as limitações das viagens espaciais humanas e conquistar as enormes distâncias interestelares.'
    },
    335984: {
      title: 'Blade Runner 2049',
      tagline: 'Ainda restam páginas nesta história.',
      overview:
        'Trinta anos após os eventos do primeiro filme, o policial K desenterra um segredo há muito oculto que ameaça mergulhar o que resta da sociedade no caos.'
    },
    95396: {
      title: 'Ruptura',
      tagline: 'Por favor, não ajuste sua tela.',
      overview:
        'Mark lidera uma equipe cujas memórias profissionais e pessoais foram separadas cirurgicamente, até que um misterioso colega reaparece fora do trabalho.'
    },
    126308: {
      title: 'Xógum: A Gloriosa Saga do Japão',
      tagline: 'A honra é paga com sangue.',
      overview:
        'Quando um misterioso navio europeu encalha em uma vila de pescadores, o lorde Yoshii Toranaga descobre segredos capazes de alterar o equilíbrio de poder no Japão feudal.'
    },
    100088: {
      title: 'The Last of Us',
      tagline: 'Quando estiver perdido na escuridão, procure a luz.',
      overview:
        'Vinte anos após a queda da civilização moderna, Joel é contratado para levar Ellie, uma garota de 14 anos, para fora de uma opressiva zona de quarentena.'
    },
    76331: {
      title: 'Succession',
      tagline: 'O sangue fala mais alto que o dinheiro.',
      overview:
        'A família Roy controla o maior conglomerado de mídia e entretenimento do mundo, mas tudo muda quando o patriarca decide se afastar do comando.'
    },
    533535: {
      title: 'Deadpool & Wolverine',
      tagline: 'Unidos à força.',
      overview:
        'Wade Wilson leva uma vida tranquila até que seu mundo enfrenta uma ameaça existencial, forçando-o a vestir o uniforme novamente ao lado de um relutante Wolverine.'
    },
    1022789: {
      title: 'Divertida Mente 2',
      tagline: 'Abra espaço para novas emoções.',
      overview:
        'A sala de controle mental da jovem Riley passa por uma reforma repentina para receber novas emoções inesperadas, incluindo a Ansiedade.'
    },
    94605: {
      title: 'Arcane',
      tagline: 'Toda lenda tem um começo.',
      overview:
        'Em meio ao conflito entre as cidades gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e convicções.'
    },
    912649: {
      title: 'Venom: A Última Rodada',
      tagline: 'Até que a morte os separe.',
      overview:
        'Eddie e Venom estão em fuga. Perseguidos pelos dois mundos e com o cerco se fechando, a dupla precisa tomar uma decisão devastadora em seu ato final.'
    }
  }
};

export const LOCALIZED_NEWS_CONTENT: Record<
  Exclude<SupportedLocale, 'en'>,
  Record<string, LocalizedArticleCopy>
> = {
  es: {
    'art-01': {
      title: 'Los Arquitectos de Arrakis: Cómo Denis Villeneuve Redefinió la Ciencia Ficción Moderna',
      excerpt: 'Un análisis profundo del minimalismo sensorial, el diseño acústico y la disciplina narrativa tras Dune: Parte Dos.',
      body: 'Desde la arquitectura brutalista de Giedi Prime hasta la geometría desértica de Arrakis, Denis Villeneuve y el director de fotografía Greig Fraser han establecido una gramática visual incomparable.\n\nLejos del exceso digital habitual, Dune: Parte Dos impone una austeridad rigurosa. La luz natural, la textura física y la partitura de Hans Zimmer anclan la escala cósmica en una sensación tangible.\n\nEn esta retrospectiva, el equipo editorial de ASTREON examina cómo la saga equilibra la alegoría histórica con el cine épico contemporáneo.',
      category: 'Análisis',
      readTime: '6 min de lectura'
    },
    'art-02': {
      title: 'Precisión Sobre Volumen: El Resurgir del Oficio en la Televisión de Prestigio',
      excerpt: 'Con Shōgun arrasando en los premios y Separación iniciando su segundo capítulo, la televisión regresa al rigor histórico y conceptual.',
      body: 'La era del exceso en streaming da paso a un retorno deliberado al oficio artesanal. El público premia las series que exigen atención plena y precisión cultural.\n\nLa interpretación de Hiroyuki Sanada en Shōgun demostró que las historias bilingües y fieles al periodo conquistan al público global, mientras Separación transforma la sátira corporativa en misterio arquitectónico.',
      category: 'Industria',
      readTime: '5 min de lectura'
    },
    'art-03': {
      title: 'Crónica del Curador: Diez Joyas Especulativas Olvidadas Para Ver Hoy',
      excerpt: 'Más allá de los grandes estrenos existen visiones íntimas sobre conciencia artificial, paradojas temporales y soledad orbital.',
      body: 'El verdadero descubrimiento ocurre fuera del algoritmo convencional. En esta edición destacamos diez obras maestras de cineastas independientes y retrospectivas internacionales.\n\nDesde Primer hasta Under the Skin y Ghost in the Shell, estas películas privilegian la atmósfera y la reflexión filosófica.',
      category: 'Curaduría',
      readTime: '4 min de lectura'
    }
  },
  fr: {
    'art-01': {
      title: 'Les Architectes d’Arrakis : Comment Denis Villeneuve a Réinventé la Science-Fiction Moderne',
      excerpt: 'Une exploration approfondie du minimalisme sensoriel, du design sonore et de la maîtrise narrative de Dune : Deuxième Partie.',
      body: 'De l’architecture brutaliste de Giedi Prime aux étendues géométriques d’Arrakis, Denis Villeneuve et Greig Fraser ont bâti une grammaire visuelle singulière.\n\nPlutôt que la surcharge numérique, le film privilégie la lumière naturelle, la matière et les compositions acoustiques de Hans Zimmer.\n\nDans cette rétrospective, la rédaction d’ASTREON analyse l’équilibre entre allégorie mythique et grand cinéma d’auteur.',
      category: 'Analyse',
      readTime: '6 min de lecture'
    },
    'art-02': {
      title: 'La Précision Avant le Volume : Le Renouveau de la Télévision de Prestige',
      excerpt: 'Entre le triomphe de Shōgun et le retour de Severance, la série retrouve le goût de la rigueur et de la tension patiente.',
      body: 'L’ère de l’abondance laisse place à un retour exigeant vers la mise en scène et la justesse historique.\n\nLe succès mondial de Shōgun prouve qu’une œuvre bilingue sans compromis captive le public international, tandis que Severance réinvente le thriller psychologique.',
      category: 'Industrie',
      readTime: '5 min de lecture'
    },
    'art-03': {
      title: 'Carnet du Conservateur : Dix Perles Spéculatives Méconnues à Redécouvrir',
      excerpt: 'Au-delà des blockbusters se cachent des récits contemplatifs sur la conscience, le temps et la solitude spatiale.',
      body: 'La véritable découverte naît en marge des recommandations standardisées. Voici dix œuvres marquantes de cinéastes indépendants privilégiant l’atmosphère et l’audace formelle.',
      category: 'Curation',
      readTime: '4 min de lecture'
    }
  },
  de: {
    'art-01': {
      title: 'Die Architekten von Arrakis: Wie Denis Villeneuve das moderne Sci-Fi-Kino neu formte',
      excerpt: 'Eine tiefgehende Analyse über sensorischen Minimalismus, Sounddesign und erzählerische Disziplin hinter Dune: Part Two.',
      body: 'Von der brutalistischen Architektur auf Giedi Prime bis zu den Wüstenlinien von Arrakis haben Denis Villeneuve und Greig Fraser eine unverwechselbare Bildsprache geschaffen.\n\nNatürliches Licht, körnige Textur und Hans Zimmers Klangwelten verleihen dem kosmischen Epos spürbare physische Wucht.',
      category: 'Tiefenanalyse',
      readTime: '6 Min. Lesezeit'
    },
    'art-02': {
      title: 'Präzision statt Masse: Die Rückkehr der Handwerkskunst im Serienfernsehen',
      excerpt: 'Mit Shōgun und Severance besinnt sich das Fernsehen auf historische Genauigkeit und konzeptionelle Spannung.',
      body: 'Nach Jahren schneller Streaming-Flut wächst die Wertschätzung für Serien, die volle Aufmerksamkeit und kulturelle Authentizität verlangen.',
      category: 'Branche',
      readTime: '5 Min. Lesezeit'
    },
    'art-03': {
      title: 'Kurators Auswahl: Zehn übersehene Sci-Fi-Meisterwerke zum Entdecken',
      excerpt: 'Abseits großer Blockbuster warten kontemplative Visionen über Bewusstsein, Zeitparadoxien und stille Raumfahrt.',
      body: 'Echte Entdeckungen geschehen abseits üblicher Algorithmen. Diese zehn Werke setzen auf Atmosphäre, philosophische Tiefe und klangliche Experimente.',
      category: 'Kuration',
      readTime: '4 Min. Lesezeit'
    }
  },
  ja: {
    'art-01': {
      title: 'アラキスの建築家たち：ドゥニ・ヴィルヌーヴがいかに現代SFを再構築したか',
      excerpt: '『デューン 砂の惑星 PART2』における感覚的ミニマリズム、音響設計、物語の規律を掘り下げる特集論考。',
      body: 'ジエディ・プライムのブルータリズム建築からアラキスの広大な砂漠の幾何学まで、ドゥニ・ヴィルヌーヴと撮影監督グリーグ・フレイザーは現代映画に比類なき視覚文法を打ち立てた。\n\n過剰なデジタル表現を抑え、自然光とフィルムの質感、ハンス・ジマーの重厚な音響が宇宙規模の物語に確かな手触りを与えている。',
      category: '深掘り分析',
      readTime: '読了目安 6分'
    },
    'art-02': {
      title: '量より精度へ：プレステージ・テレビクラフトの復権',
      excerpt: '『SHŌGUN 将軍』の快挙と『セヴェランス』の続編が示す、緻密な時代考証と緊張感あるドラマ作りの回帰。',
      body: '膨大な配信作品の時代を経て、観客の集中と文化的誠実さを求める作品が世界的な支持を集めている。\n\n真田広之が体現した『SHŌGUN』の妥協なき時代表現と、『セヴェランス』の心理的建築美はその象徴だ。',
      category: '業界動向',
      readTime: '読了目安 5分'
    },
    'art-03': {
      title: 'キュレーター通信：今観るべき隠れた名作SF映画10選',
      excerpt: '大作の裏側に潜む、人工意識・時間パラドックス・静かな宇宙の孤独を描いた思索的な傑作群。',
      body: '真の発見はアルゴリズムの周縁にある。『プライマー』『アンダー・ザ・スキン』『GHOST IN THE SHELL / 攻殻機動隊』など、ムードと哲学的問いを重んじる10本を紹介する。',
      category: 'キュレーション',
      readTime: '読了目安 4分'
    }
  },
  pt: {
    'art-01': {
      title: 'Os Arquitetos de Arrakis: Como Denis Villeneuve Transformou a Ficção Científica Moderna',
      excerpt: 'Uma análise aprofundada do minimalismo sensorial, desenho acústico e disciplina narrativa por trás de Duna: Parte Dois.',
      body: 'Da arquitetura brutalista de Giedi Prime à geometria do deserto de Arrakis, Denis Villeneuve e o diretor de fotografia Greig Fraser estabeleceram uma gramática visual singular.\n\nLuz natural, textura tátil e as composições de Hans Zimmer ancoram a escala épica em presença física imediata.',
      category: 'Análise',
      readTime: '6 min de leitura'
    },
    'art-02': {
      title: 'Precisão Acima de Volume: O Retorno da Artesania nas Séries de Prestígio',
      excerpt: 'Com Xógum premiada e Ruptura em novo capítulo, a televisão retoma a cadência histórica e a tensão conceitual.',
      body: 'A era da abundância apressada dá lugar a um retorno deliberado à construção cuidadosa de mundo, autenticidade linguística e rigor dramático.',
      category: 'Indústria',
      readTime: '5 min de leitura'
    },
    'art-03': {
      title: 'Crônica da Curadoria: Dez Joias Especulativas Esquecidas Para Assistir Hoje',
      excerpt: 'Além dos grandes lançamentos existem visões contemplativas sobre consciência, tempo e solidão orbital.',
      body: 'A verdadeira descoberta acontece fora dos algoritmos tradicionais. Destacamos dez obras que priorizam atmosfera, filosofia e experimentação sonora.',
      category: 'Curadoria',
      readTime: '4 min de leitura'
    }
  }
};
