import {
  ANTI_SLOP_RULES,
  ANTI_SLOP_CHECKLIST,
  buildAntiSlopPrefix,
  BRAND_SPEC_EXTRACTION_PROTOCOL,
  FORBIDDEN_VISUAL_ELEMENTS,
  FORBIDDEN_VISUAL_PROMPT_SUFFIX,
} from './anti-slop-policy';

describe('anti-slop-policy', () => {
  it('has the core blacklist words documented', () => {
    expect(ANTI_SLOP_RULES).toContain('Additionally');
    expect(ANTI_SLOP_RULES).toContain('Furthermore');
    expect(ANTI_SLOP_RULES).toContain('Leverage');
    expect(ANTI_SLOP_RULES).toContain('em-dashes');
  });

  it('checklist includes P0 gates', () => {
    expect(ANTI_SLOP_CHECKLIST).toContain('P0');
    expect(ANTI_SLOP_CHECKLIST).toContain('Zero em-dashes');
    expect(ANTI_SLOP_CHECKLIST).toContain('No invented statistics');
  });

  it('buildAntiSlopPrefix combines rules and checklist', () => {
    const prefix = buildAntiSlopPrefix();
    expect(prefix).toContain('Anti-AI-Slop Rules');
    expect(prefix).toContain('Pre-emit checklist');
    expect(prefix.endsWith('---\n\n')).toBe(true);
  });

  it('brand-spec protocol enforces 5 steps', () => {
    expect(BRAND_SPEC_EXTRACTION_PROTOCOL).toContain('1. LOCATE');
    expect(BRAND_SPEC_EXTRACTION_PROTOCOL).toContain('2. DOWNLOAD');
    expect(BRAND_SPEC_EXTRACTION_PROTOCOL).toContain('3. GREP');
    expect(BRAND_SPEC_EXTRACTION_PROTOCOL).toContain('4. CODIFY');
    expect(BRAND_SPEC_EXTRACTION_PROTOCOL).toContain('5. VOCALISE');
  });

  it('forbidden visual elements list is non-empty', () => {
    expect(FORBIDDEN_VISUAL_ELEMENTS.length).toBeGreaterThan(5);
    expect(FORBIDDEN_VISUAL_PROMPT_SUFFIX).toContain('CRITICAL');
  });
});
