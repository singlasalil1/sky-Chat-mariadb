export const cases = [
  // EASY CASES
  {
    id: 'case-001',
    title: 'The Hub Mystery',
    difficulty: 'easy',
    category: 'Airport Investigation',
    description: 'A traveler mentioned flying through a major US hub known for its massive number of connections. Can you identify which airport?',
    clues: [
      {
        id: 1,
        text: 'The airport is located in the United States',
        icon: '🇺🇸'
      },
      {
        id: 2,
        text: 'This hub has over 200 direct route connections',
        icon: '🛫'
      },
      {
        id: 3,
        text: 'The airport code starts with the letter "A"',
        icon: '🔤'
      },
      {
        id: 4,
        text: 'It is located in the state of Georgia',
        icon: '📍'
      }
    ],
    question: 'What is the IATA code of this airport?',
    answerType: 'text',
    solution: {
      answer: 'ATL',
      explanation: 'Hartsfield-Jackson Atlanta International Airport (ATL) is one of the busiest airports in the world and serves as a major hub with over 200 direct connections.',
      funFact: 'ATL has been the world\'s busiest airport by passenger traffic since 1998!'
    }
  },
  {
    id: 'case-002',
    title: 'The Distance Puzzle',
    difficulty: 'easy',
    category: 'Route Analysis',
    description: 'A pilot mentioned flying one of the longest domestic routes in the United States. Can you figure out which route?',
    clues: [
      {
        id: 1,
        text: 'Both airports are located in the United States',
        icon: '🇺🇸'
      },
      {
        id: 2,
        text: 'The route connects the East Coast to Hawaii',
        icon: '🌊'
      },
      {
        id: 3,
        text: 'The departure city is known for its Freedom Trail',
        icon: '🗽'
      },
      {
        id: 4,
        text: 'The destination is the capital of Hawaii',
        icon: '🏝️'
      }
    ],
    question: 'What are the two airport codes? (format: XXX-XXX)',
    answerType: 'text',
    solution: {
      answer: 'BOS-HNL',
      explanation: 'Boston Logan (BOS) to Honolulu (HNL) is one of the longest domestic routes in the US, spanning approximately 5,095 miles.',
      funFact: 'This flight takes about 11 hours westbound but can be faster eastbound due to tailwinds!'
    }
  },
  {
    id: 'case-003',
    title: 'The European Connection',
    difficulty: 'easy',
    category: 'Airport Investigation',
    description: 'A major European hub is known for its efficiency and massive international connections. Which airport is it?',
    clues: [
      {
        id: 1,
        text: 'The airport is located in Western Europe',
        icon: '🇪🇺'
      },
      {
        id: 2,
        text: 'It serves as the main hub for Lufthansa',
        icon: '✈️'
      },
      {
        id: 3,
        text: 'The city is known as a major financial center',
        icon: '🏦'
      },
      {
        id: 4,
        text: 'The city name in German means "ford of the Franks"',
        icon: '🏰'
      }
    ],
    question: 'What is the IATA code of this airport?',
    answerType: 'text',
    solution: {
      answer: 'FRA',
      explanation: 'Frankfurt Airport (FRA) is Germany\'s busiest airport and a major European hub, serving as the primary hub for Lufthansa.',
      funFact: 'FRA has its own railway station with high-speed train connections throughout Europe!'
    }
  },

  // MEDIUM CASES
  {
    id: 'case-004',
    title: 'The Layover Trail',
    difficulty: 'medium',
    category: 'Route Investigation',
    description: 'A passenger flew from New York to Sydney with exactly one stop. The layover was at a major Pacific hub. Where did they stop?',
    clues: [
      {
        id: 1,
        text: 'The layover airport is not in the United States mainland',
        icon: '🌊'
      },
      {
        id: 2,
        text: 'This hub is located in the Pacific region',
        icon: '🏝️'
      },
      {
        id: 3,
        text: 'The airport serves as a gateway between North America and Oceania',
        icon: '🌏'
      },
      {
        id: 4,
        text: 'The city is the capital of its US state',
        icon: '🇺🇸'
      }
    ],
    question: 'What is the IATA code of the layover airport?',
    answerType: 'text',
    solution: {
      answer: 'HNL',
      explanation: 'Honolulu International Airport (HNL) serves as a major connection point for flights between the US mainland and Australia/New Zealand.',
      funFact: 'HNL was used as a refueling stop for transpacific flights before modern long-range aircraft!'
    }
  },
  {
    id: 'case-005',
    title: 'The Airline Code Breaker',
    difficulty: 'medium',
    category: 'Airline Investigation',
    description: 'An airline operates extensive routes in the Middle East and is known for luxury service. Their hub is in the UAE. Which airline?',
    clues: [
      {
        id: 1,
        text: 'The airline is based in the United Arab Emirates',
        icon: '🇦🇪'
      },
      {
        id: 2,
        text: 'The hub city shares its name with the airline',
        icon: '🏙️'
      },
      {
        id: 3,
        text: 'Their aircraft often feature the Airbus A380',
        icon: '✈️'
      },
      {
        id: 4,
        text: 'The airline code is a two-letter combination: E_',
        icon: '🔤'
      }
    ],
    question: 'What is the two-letter IATA airline code?',
    answerType: 'text',
    solution: {
      answer: 'EK',
      explanation: 'Emirates (EK) is the flag carrier of Dubai, UAE, and operates one of the largest fleets of Airbus A380s in the world.',
      funFact: 'Emirates operates the world\'s longest non-stop commercial flight: Dubai to Auckland!'
    }
  },
  {
    id: 'case-006',
    title: 'The Asian Megahub',
    difficulty: 'medium',
    category: 'Airport Investigation',
    description: 'This Asian airport is consistently rated as one of the best in the world and serves as a major connection point between East and West.',
    clues: [
      {
        id: 1,
        text: 'The airport is located in Southeast Asia',
        icon: '🌏'
      },
      {
        id: 2,
        text: 'It serves as the main hub for Singapore Airlines',
        icon: '✈️'
      },
      {
        id: 3,
        text: 'The airport has won "World\'s Best Airport" multiple times',
        icon: '🏆'
      },
      {
        id: 4,
        text: 'The airport features the world\'s tallest indoor waterfall',
        icon: '💧'
      }
    ],
    question: 'What is the IATA code of this airport?',
    answerType: 'text',
    solution: {
      answer: 'SIN',
      explanation: 'Singapore Changi Airport (SIN) is renowned for its excellent service, amenities, and the iconic Rain Vortex waterfall in Jewel Changi.',
      funFact: 'Changi Airport has a butterfly garden, movie theaters, and even a swimming pool inside the terminals!'
    }
  },

  // HARD CASES
  {
    id: 'case-007',
    title: 'The Triangle Route Mystery',
    difficulty: 'hard',
    category: 'Multi-Route Analysis',
    description: 'Three major airports form a heavily-traveled triangle in the US. All three are major hubs. Can you identify the California hub in this triangle?',
    clues: [
      {
        id: 1,
        text: 'The three airports are: one in California, one in Texas, and one in Illinois',
        icon: '🔺'
      },
      {
        id: 2,
        text: 'The California airport is NOT in Los Angeles',
        icon: '🚫'
      },
      {
        id: 3,
        text: 'This airport serves the Bay Area',
        icon: '🌉'
      },
      {
        id: 4,
        text: 'It is a major hub for United Airlines',
        icon: '✈️'
      }
    ],
    question: 'What is the IATA code of the California hub? (Bonus: name all three)',
    answerType: 'text',
    solution: {
      answer: 'SFO',
      explanation: 'San Francisco International (SFO) forms a major triangle with Chicago O\'Hare (ORD) and Dallas/Fort Worth (DFW). These three hubs connect much of the United States.',
      funFact: 'These three airports together handle over 200 million passengers annually!'
    }
  },
  {
    id: 'case-008',
    title: 'The Transcontinental Detective',
    difficulty: 'hard',
    category: 'Complex Route Analysis',
    description: 'A shipment was flown from Tokyo to London via two stops: one in the Middle East and one in Europe. Both stops were at major hubs.',
    clues: [
      {
        id: 1,
        text: 'The first stop was at the world\'s busiest international airport by passenger traffic',
        icon: '🌍'
      },
      {
        id: 2,
        text: 'This Middle Eastern hub is located in the UAE',
        icon: '🇦🇪'
      },
      {
        id: 3,
        text: 'The second stop was at a major European hub in Germany',
        icon: '🇩🇪'
      },
      {
        id: 4,
        text: 'The European hub is the main base for Lufthansa',
        icon: '✈️'
      }
    ],
    question: 'What were the two layover airports? (format: XXX-XXX)',
    answerType: 'text',
    solution: {
      answer: 'DXB-FRA',
      explanation: 'The route was Tokyo → Dubai (DXB) → Frankfurt (FRA) → London. DXB is the world\'s busiest international airport, and FRA is Lufthansa\'s main hub.',
      funFact: 'Dubai International handles over 88 million international passengers per year!'
    }
  },
  {
    id: 'case-009',
    title: 'The Southern Cross Mystery',
    difficulty: 'hard',
    category: 'Geographic Detective',
    description: 'This airport serves as the primary gateway to an entire continent and is the busiest in the Southern Hemisphere.',
    clues: [
      {
        id: 1,
        text: 'The airport is located in the Southern Hemisphere',
        icon: '🌍'
      },
      {
        id: 2,
        text: 'It serves as the main international gateway to its country',
        icon: '🛂'
      },
      {
        id: 3,
        text: 'The city is famous for its Opera House and Harbour Bridge',
        icon: '🎭'
      },
      {
        id: 4,
        text: 'This is Qantas Airways\' primary hub',
        icon: '✈️'
      }
    ],
    question: 'What is the IATA code of this airport?',
    answerType: 'text',
    solution: {
      answer: 'SYD',
      explanation: 'Sydney Kingsford Smith Airport (SYD) is Australia\'s busiest airport and the primary international gateway to the continent.',
      funFact: 'SYD is named after pioneering Australian aviator Charles Kingsford Smith, who made the first transpacific flight from the US to Australia in 1928!'
    }
  },
  {
    id: 'case-010',
    title: 'The Polar Route',
    difficulty: 'hard',
    category: 'Ultra Long-Haul Investigation',
    description: 'One of the world\'s longest commercial flights connects two major cities on opposite sides of the globe, flying over the Arctic.',
    clues: [
      {
        id: 1,
        text: 'The route connects Asia to North America',
        icon: '🌏'
      },
      {
        id: 2,
        text: 'The Asian city is the capital and largest city of its country',
        icon: '🏙️'
      },
      {
        id: 3,
        text: 'The North American destination is in the northeastern United States',
        icon: '🇺🇸'
      },
      {
        id: 4,
        text: 'The Asian airport code is ICN, serving Seoul',
        icon: '🇰🇷'
      }
    ],
    question: 'What is the IATA code of the North American destination?',
    answerType: 'text',
    solution: {
      answer: 'JFK',
      explanation: 'The Seoul Incheon (ICN) to New York JFK route is one of the longest, spanning approximately 6,900 miles and taking 14+ hours.',
      funFact: 'Polar routes save time and fuel by taking advantage of Earth\'s curvature and favorable winds at high latitudes!'
    }
  }
];
