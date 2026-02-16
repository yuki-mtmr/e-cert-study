import { describe, it, expect } from 'vitest';
import { CONCEPT_MAPS, getConceptMap, getMapForSection } from '../glossary/concept-maps';
import { SECTIONS } from '../glossary/sections';

describe('CONCEPT_MAPS', () => {
  it('6つのマップが定義されている', () => {
    expect(CONCEPT_MAPS).toHaveLength(6);
  });

  it('全てのIDが一意である', () => {
    const ids = CONCEPT_MAPS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('svgPathが /concept-maps/ で始まり .svg で終わる', () => {
    for (const map of CONCEPT_MAPS) {
      expect(map.svgPath).toMatch(/^\/concept-maps\/.*\.svg$/);
    }
  });

  it('overviewマップが含まれる', () => {
    const overview = CONCEPT_MAPS.find((m) => m.id === 'overview');
    expect(overview).toBeDefined();
    expect(overview!.svgPath).toBe('/concept-maps/overview.svg');
  });

  it('各セクションIDに対応するマップが存在する', () => {
    for (const section of SECTIONS) {
      const map = CONCEPT_MAPS.find((m) => m.id === section.id);
      expect(map).toBeDefined();
    }
  });
});

describe('getConceptMap', () => {
  it('セクションID未指定でoverviewを返す', () => {
    const map = getConceptMap();
    expect(map.id).toBe('overview');
  });

  it('セクションIDを指定するとそのセクションのマップを返す', () => {
    const map = getConceptMap('ml');
    expect(map.id).toBe('ml');
    expect(map.svgPath).toBe('/concept-maps/ml.svg');
  });

  it('存在しないIDでoverviewを返す', () => {
    const map = getConceptMap('nonexistent');
    expect(map.id).toBe('overview');
  });
});

describe('getMapForSection', () => {
  it('指定セクションのマップを返す', () => {
    const map = getMapForSection('dl-basic');
    expect(map.id).toBe('dl-basic');
  });

  it('存在しないIDでoverviewを返す', () => {
    const map = getMapForSection('unknown');
    expect(map.id).toBe('overview');
  });
});
