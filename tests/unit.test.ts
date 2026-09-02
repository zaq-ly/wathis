import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toTitleCase,
  cleanMigrationTitle,
  formatYear,
  formatSeasonDisplay,
  parseSeasonInput,
  isAnimeItem,
  sortByRelease,
} from '../src/lib/utils';
import { parseCSVLine, parseUniversalImport } from '../src/lib/importParser';

describe('Critical Business Logic & Utility Unit Tests', () => {
  describe('toTitleCase', () => {
    it('should format title with minor words in lowercase and Roman numerals in uppercase', () => {
      // Arrange
      const input = 'lord of the rings: the return of the king part ii';

      // Act
      const result = toTitleCase(input);

      // Assert
      assert.equal(result, 'Lord of the Rings: The Return of the King Part II');
    });
  });

  describe('cleanMigrationTitle', () => {
    it('should strip codec, quality tags, and extract year in parentheses', () => {
      // Arrange
      const raw = 'Inception.1080p.BluRay.x264 (2010)';

      // Act
      const result = cleanMigrationTitle(raw);

      // Assert
      assert.equal(result.cleanTitle, 'Inception');
      assert.equal(result.detectedYear, 2010);
    });

    it('should extract season tags from title string', () => {
      // Arrange
      const raw = 'Stranger Things S1-S4';

      // Act
      const result = cleanMigrationTitle(raw);

      // Assert
      assert.equal(result.cleanTitle, 'Stranger Things');
      assert.equal(result.detectedSeason, 'S1-S4');
    });
  });

  describe('formatYear', () => {
    it('should parse 4-digit year from ISO date string', () => {
      // Arrange
      const dateStr = '2023-11-15';

      // Act
      const year = formatYear(dateStr);

      // Assert
      assert.equal(year, 2023);
    });

    it('should return null for invalid or empty date', () => {
      // Arrange & Act & Assert
      assert.equal(formatYear(''), null);
      assert.equal(formatYear(null), null);
      assert.equal(formatYear('invalid'), null);
    });
  });

  describe('formatSeasonDisplay', () => {
    it('should prioritize season_label if present', () => {
      // Arrange
      const item = { season_count: 2, season_label: 'S2 E05' };

      // Act
      const display = formatSeasonDisplay(item);

      // Assert
      assert.equal(display, 'S2 E05');
    });

    it('should format range S1-Sn for season count > 1', () => {
      // Arrange
      const item = { season_count: 4 };

      // Act
      const display = formatSeasonDisplay(item);

      // Assert
      assert.equal(display, 'S1-S4');
    });

    it('should format as Eps for anime with high count (>6)', () => {
      // Arrange
      const animeItem = { season_count: 12, genres: ['Anime'] };

      // Act
      const display = formatSeasonDisplay(animeItem);

      // Assert
      assert.equal(display, 'Eps 12');
    });
  });

  describe('parseSeasonInput', () => {
    it('should parse season and episode input like S2 E04', () => {
      // Arrange
      const input = 'S2 E04';

      // Act
      const result = parseSeasonInput(input);

      // Assert
      assert.equal(result.count, 2);
      assert.equal(result.label, 'S2 E04');
    });

    it('should format high episode numbers correctly', () => {
      // Arrange
      const input = 'Eps 24';

      // Act
      const result = parseSeasonInput(input);

      // Assert
      assert.equal(result.count, 24);
      assert.equal(result.label, 'Eps 24');
    });
  });

  describe('isAnimeItem', () => {
    it('should return true if genres include Anime', () => {
      // Arrange
      const item = { genres: ['Anime', 'Action'] };

      // Act & Assert
      assert.equal(isAnimeItem(item), true);
    });

    it('should return true for Animation with Japanese characters', () => {
      // Arrange
      const item = {
        genres: ['Animation'],
        title: '君の名は。',
        original_title: 'Kimi no Na wa',
      };

      // Act & Assert
      assert.equal(isAnimeItem(item), true);
    });

    it('should return false for Western animation', () => {
      // Arrange
      const item = {
        genres: ['Animation'],
        title: 'Toy Story 4',
        original_title: 'Toy Story 4',
      };

      // Act & Assert
      assert.equal(isAnimeItem(item), false);
    });
  });

  describe('sortByRelease', () => {
    it('should sort descending prioritizing items with full release date over year-only', () => {
      // Arrange
      const items = [
        { title: 'Item A', release_year: 2024, release_date: null },
        { title: 'Item B', release_year: 2024, release_date: '2024-05-01' },
        { title: 'Item C', release_year: 2023, release_date: '2023-12-01' },
      ];

      // Act
      const sorted = sortByRelease(items, 'desc');

      // Assert
      assert.equal(sorted[0].title, 'Item B');
      assert.equal(sorted[1].title, 'Item C');
      assert.equal(sorted[2].title, 'Item A');
    });
  });

  describe('parseCSVLine', () => {
    it('should parse simple CSV line', () => {
      // Arrange
      const line = 'Inception,2010,Action';

      // Act
      const result = parseCSVLine(line);

      // Assert
      assert.deepEqual(result, ['Inception', '2010', 'Action']);
    });

    it('should handle quoted values with commas correctly', () => {
      // Arrange
      const line = '"Spider-Man: Into the Spider-Verse, Part 1",2018,"Animation, Action"';

      // Act
      const result = parseCSVLine(line);

      // Assert
      assert.deepEqual(result, [
        'Spider-Man: Into the Spider-Verse, Part 1',
        '2018',
        'Animation, Action',
      ]);
    });
  });

  describe('parseUniversalImport', () => {
    it('should parse JSON array of titles', () => {
      // Arrange
      const json = JSON.stringify(['Interstellar (2014)', 'The Dark Knight']);

      // Act
      const results = parseUniversalImport(json, 'watchlist.json');

      // Assert
      assert.equal(results.length, 2);
      assert.equal(results[0].clean, 'Interstellar');
      assert.equal(results[0].year, 2014);
      assert.equal(results[1].clean, 'The Dark Knight');
    });

    it('should parse CSV with standard Letterboxd/Notion headers', () => {
      // Arrange
      const csv = 'Title,Year,Genre\nDune: Part Two,2024,Sci-Fi\nOppenheimer,2023,Drama';

      // Act
      const results = parseUniversalImport(csv, 'movies.csv');

      // Assert
      assert.equal(results.length, 2);
      assert.equal(results[0].clean, 'Dune: Part Two');
      assert.equal(results[0].year, 2024);
      assert.equal(results[0].genre, 'Sci-Fi');
      assert.equal(results[1].clean, 'Oppenheimer');
      assert.equal(results[1].year, 2023);
    });

    it('should strip markdown checklist bullets from text input', () => {
      // Arrange
      const raw = '- [x] Spirited Away (2001)\n1. Princess Mononoke (1997)';

      // Act
      const results = parseUniversalImport(raw);

      // Assert
      assert.equal(results.length, 2);
      assert.equal(results[0].clean, 'Spirited Away');
      assert.equal(results[0].year, 2001);
      assert.equal(results[1].clean, 'Princess Mononoke');
      assert.equal(results[1].year, 1997);
    });
  });
});
