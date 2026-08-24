export interface MockReportsDataset {
  session_records: any[];
  student_rankings: any[];
  analytics_summary: any;
  class_analytics_map: Record<string, any>;
}

export const MOCK_PROFILES = [
  { tier: 8, rankName: 'Quán Quân', title: 'Xuất Chúng', baseC1: 9.8, baseC2: 9.8, baseHw: 9.9, slope: 0.02, volatility: 0.15, absentSessions: [] as number[] },
  { tier: 7, rankName: 'Cao Thủ', title: 'Vượt Trội', baseC1: 9.4, baseC2: 9.5, baseHw: 9.6, slope: 0.02, volatility: 0.25, absentSessions: [] as number[] },
  { tier: 6, rankName: 'Tinh Anh', title: 'Ưu Tú', baseC1: 9.0, baseC2: 9.2, baseHw: 9.4, slope: 0.04, volatility: 0.3, absentSessions: [] as number[] },
  { tier: 5, rankName: 'Kim Cương', title: 'Xuất Sắc', baseC1: 8.5, baseC2: 8.7, baseHw: 9.0, slope: 0.03, volatility: 0.35, absentSessions: [] as number[] },
  { tier: 4, rankName: 'Bạch Kim', title: 'Giỏi', baseC1: 7.8, baseC2: 8.0, baseHw: 8.5, slope: 0.02, volatility: 0.4, absentSessions: [7] as number[] },
  { tier: 3, rankName: 'Vàng', title: 'Khá', baseC1: 6.8, baseC2: 7.0, baseHw: 7.6, slope: -0.01, volatility: 0.6, absentSessions: [12] as number[] },
  { tier: 2, rankName: 'Bạc', title: 'Trung Bình', baseC1: 5.8, baseC2: 6.0, baseHw: 6.5, slope: -0.04, volatility: 0.7, absentSessions: [15, 18] as number[] },
  { tier: 1, rankName: 'Đồng', title: 'Yếu', baseC1: 4.2, baseC2: 4.5, baseHw: 5.0, slope: -0.03, volatility: 0.8, absentSessions: [19, 20] as number[] },
];

export const GRAMMAR_TOPICS_LIST = [
  'Present Simple & Adverbs of Frequency',    // Unit 1: My New School
  'Possessive Case & Prepositions of Place',  // Unit 2: My House
  'Present Continuous',                       // Unit 3: My Friends
  'Comparative Adjectives',                   // Unit 4: My Neighbourhood
  'Countable/Uncountable Nouns & Must',       // Unit 5: Natural Wonders of Viet Nam
  'Should/Shouldn\'t & Some/Any',             // Unit 6: Our Tet Holiday
  'Conjunctions & Question Words',            // Unit 7: Television
  'Past Simple & Imperatives',                // Unit 8: Sports and Games
  'Possessive Pronouns',                      // Unit 9: Cities of the World
  'Future Simple (Will) & Might',             // Unit 10: Our Houses in the Future
  'Articles & First Conditional',             // Unit 11: Our Greener World
  'Superlative Adjectives & Could',           // Unit 12: Robots
];
