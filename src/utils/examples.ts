// Example Zod schema for the tool to use as initial state
export const exampleZodSchema = `import { z } from 'zod';

const DimensionsSchema = z.object({
  width: z.number().description("Content width in pixels"),
  height: z.number().description("Content height in pixels"),
});

const HashtagAnalysisSchema = z.object({
  hashtags: z
    .array(z.string())
    .description("List of extracted hashtags from the caption"),
  strategy: z
    .string()
    .nullable()
    .description("Why these hashtags were chosen (e.g. audience targeting)"),
});

const CaptionSegmentSchema = z.object({
  type: z
    .enum(["hook", "body", "cta"])
    .description("Segment role: attention-grabber, body text, or call-to-action"),
  content: z
    .string()
    .nullable()
    .description("Text of this caption segment"),
  rationale: z
    .string()
    .nullable()
    .description("Why this segment works in its role"),
  position_in_caption: z
    .number()
    .description("Order index of this segment within the full caption"),
});

const CallToActionSchema = z.object({
  text: z
    .string()
    .nullable()
    .description("The explicit call-to-action text"),
  rationale: z
    .string()
    .nullable()
    .description("Why this CTA is effective"),
  placement: z
    .object({
      slide_id: z
        .number()
        .nullable()
        .description("Which slide this CTA is tied to"),
      caption_segment: z
        .enum(["hook", "body", "cta"])
        .description("Which caption segment holds the CTA"),
    })
    .description("Where in the post the CTA appears"),
});

const TextOverlaySchema = z.object({
  text: z
    .string()
    .nullable()
    .description("Overlay text rendered on the slide"),
  style: z
    .object({
      font_size: z.number().description("Font size in pixels"),
      font_color: z.string().description("Hex code or named color"),
      font_weight: z.string().description("CSS font-weight (e.g. bold)"),
    })
    .description("CSS styling for this text overlay"),
  position: z
    .object({
      x: z.number().description("Horizontal position as fraction (0-1)"),
      y: z.number().description("Vertical position as fraction (0-1)"),
    })
    .description("Normalized overlay position"),
  rationale: z
    .string()
    .nullable()
    .description("Why this text was placed here"),
});

const GraphicOverlaySchema = z.object({
  type: z
    .string()
    .description("Overlay role (e.g. logo, screenshot)"),
  url: z.string().description("Source URL of the overlay image"),
  position: z
    .object({
      x: z.number().description("Horizontal position as fraction"),
      y: z.number().description("Vertical position as fraction"),
    })
    .description("Where the overlay sits on the slide"),
  size: z
    .object({
      width: z.number().description("Width as fraction of slide"),
      height: z.number().description("Height as fraction of slide"),
    })
    .description("Normalized overlay size"),
  rationale: z
    .string()
    .nullable()
    .description("Why this graphic was added"),
});

const SlideSchema = z.object({
  id: z.number().description("Slide index"),
  image_url: z
    .string()
    .description("Background image URL for this slide"),
  dimensions: DimensionsSchema.description("Slide's pixel dimensions"),
  role: z
    .string()
    .nullable()
    .description("Narrative role of this slide (e.g. hook, proof)"),
  visual_focus: z
    .string()
    .nullable()
    .description("Primary visual element on the slide"),
  composition_notes: z
    .string()
    .nullable()
    .description("Framing or rule-of-thirds notes"),
  text_overlays: z
    .array(TextOverlaySchema)
    .description("All text elements placed on the slide"),
  graphic_overlays: z
    .array(GraphicOverlaySchema)
    .description("All non-text graphics on the slide"),
});

const DesignPaletteSchema = z.object({
  primary_colors: z
    .array(z.string())
    .description("Main brand or post colors (hex codes)"),
  accent_colors: z
    .array(z.string())
    .description("Supporting highlight colors"),
  font_styles: z
    .array(z.string())
    .description("Font families or styles used"),
  overall_mood: z
    .string()
    .nullable()
    .description("Descriptive mood tag (e.g. energetic, calm)"),
});

export const TikTokPostSchema = z
  .object({
    platform: z
      .literal("tiktok")
      .description("Social platform identifier"),
    template_version: z
      .string()
      .description("Schema version"),
    post_id: z
      .string()
      .nullable()
      .description("Unique TikTok post ID"),
    author: z
      .object({
        id: z.string().description("Author's TikTok ID"),
        uniqueId: z.string().description("Author's @ handle"),
        nickname: z.string().description("Display name"),
      })
      .description("Post author metadata"),
    original_desc: z
      .string()
      .nullable()
      .description("Raw caption/description from the post"),
    dimensions: DimensionsSchema.description("Overall post dimensions"),
    slide_count: z
      .number()
      .description("Number of image slides"),
    hashtag_analysis: HashtagAnalysisSchema.description(
      "Extracted hashtag details"
    ),
    caption_segments: z
      .array(CaptionSegmentSchema)
      .description("Hook/Body/CTA segments of the caption"),
    call_to_action: CallToActionSchema.description("Isolated CTA analysis"),
    slides: z
      .array(SlideSchema)
      .description("Per-slide visual & narrative breakdown"),
    narrative_flow: z
      .string()
      .nullable()
      .description(
        "High-level story arc across slides (e.g. hook → pain → solution)"
      ),
    design_palette: DesignPaletteSchema.description(
      "Color, typography & mood summary"
    ),
  })
  .description("Complete analysis schema for a TikTok image post");
`;
