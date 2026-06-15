-- Profile fields used by the Gemini logo prompt builder.
-- brand_initials lets us emit the letter-by-letter spelling block for
-- monogram-style logos; brand_symbol is the free-text motif hint
-- ("arrow", "lightning bolt", "crown"…) the prompt appends.

alter table profiles
  add column if not exists brand_initials text,
  add column if not exists brand_symbol text;
